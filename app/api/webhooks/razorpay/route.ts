import Razorpay from "razorpay";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email/order-confirmation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text(); // raw string - signature is computed over this exact body
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const isValid = Razorpay.validateWebhookSignature(body, signature, env.RAZORPAY_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response("Bad signature", { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event !== "payment.captured") {
    // Not the event we act on (payment.failed, order.paid, etc.) - ack and move on.
    return new Response("ok", { status: 200 });
  }

  const payment = event.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id;
  const razorpayPaymentId = payment?.id;
  if (!razorpayOrderId || !razorpayPaymentId) {
    return new Response("ok", { status: 200 });
  }

  const order = await prisma.order.findUnique({
    where: { razorpayOrderId },
    include: { items: true },
  });
  if (!order) {
    // No matching order (e.g. a webhook from an unrelated test payment) - nothing to do.
    return new Response("ok", { status: 200 });
  }

  if (order.status !== "PENDING") {
    // Already processed - Razorpay retries webhooks, so this must be a no-op.
    return new Response("ok", { status: 200 });
  }

  const wasProcessed = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date(), razorpayPaymentId },
    });
    if (updated.count === 0) return false; // lost a race with another webhook delivery

    for (const item of order.items) {
      if (!item.productId) continue;
      // Conditional decrement - never goes negative even under concurrent orders.
      // Payment already succeeded, so an r.count of 0 (oversold) is recorded, not failed.
      await tx.product.updateMany({
        where: { id: item.productId, stockQuantity: { gte: item.quantity } },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }

    if (order.couponCode) {
      // Conditional increment - claims a redemption only if the coupon still has room.
      // Payment is already captured at this point, so if the limit was hit by other
      // orders first, we don't retroactively fail this payment - we just stop
      // incrementing past the cap. This is the ONLY place a redemption is claimed:
      // moving it here (from order-creation time) means an abandoned checkout never
      // burns a redemption, since this code only runs once payment is confirmed.
      await tx.$executeRaw`
        UPDATE "Coupon" SET "timesRedeemed" = "timesRedeemed" + 1
        WHERE "code" = ${order.couponCode}
          AND ("maxRedemptions" IS NULL OR "timesRedeemed" < "maxRedemptions")
      `;
    }

    if (order.userId) {
      await tx.cartItem.deleteMany({ where: { cart: { userId: order.userId } } });
      await tx.cart.updateMany({ where: { userId: order.userId }, data: { couponCode: null } });
    }

    return true;
  });

  // Network call - deliberately outside the transaction (PgBouncer transaction
  // mode can't hold a transaction open across external I/O).
  if (wasProcessed) {
    await sendOrderConfirmationEmail(order).catch((err) => {
      console.error(`[razorpay webhook] failed to send confirmation email for ${order.orderNumber}:`, err);
    });
  }

  return new Response("ok", { status: 200 });
}
