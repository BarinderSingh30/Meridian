"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCart } from "@/lib/cart";
import { calculateShippingCents, SHIPPING_METHODS, type ShippingMethod } from "@/lib/shipping";
import { validateCoupon, calculateDiscountCents } from "@/lib/coupons";
import { razorpay } from "@/lib/razorpay";
import { env } from "@/lib/env";

function generateOrderNumber() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${random}`;
}

export type PlaceOrderResult =
  | { success: true; orderNumber: string; razorpayOrderId: string; amountPaise: number; keyId: string }
  | { success: false; error: string };

/**
 * Creates a PENDING order snapshotted from the current cart + address, then a
 * matching Razorpay order for the client to open in the Checkout.js modal.
 * Does not touch the cart or stock - those only change once the webhook
 * confirms payment (app/api/webhooks/razorpay/route.ts). If the customer
 * dismisses the payment modal, the order simply stays PENDING and the cart
 * is untouched.
 */
export async function placeOrderAction(addressId: string, shippingMethod: ShippingMethod): Promise<PlaceOrderResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in to check out." };
  if (!addressId) return { success: false, error: "Choose a shipping address to continue." };
  if (!Object.prototype.hasOwnProperty.call(SHIPPING_METHODS, shippingMethod)) {
    return { success: false, error: "Choose a valid delivery speed." };
  }

  const [address, cart] = await Promise.all([
    prisma.address.findFirst({ where: { id: addressId, userId: session.user.id } }),
    getCart(),
  ]);

  if (!address) return { success: false, error: "Choose a shipping address to continue." };
  if (!cart || cart.items.length === 0) return { success: false, error: "Your cart is empty." };

  const hasStockIssue = cart.items.some(
    (item) => item.product.status !== "ACTIVE" || item.quantity > item.product.stockQuantity
  );
  if (hasStockIssue) {
    return { success: false, error: "Some items in your cart are no longer available. Review your cart." };
  }

  const subtotalCents = cart.items.reduce((sum, item) => sum + item.quantity * item.product.priceCents, 0);
  const shippingCents = calculateShippingCents(subtotalCents, shippingMethod);

  let discountCents = 0;
  let couponCode: string | null = null;
  if (cart.couponCode) {
    const validation = await validateCoupon(cart.couponCode);
    if (validation.valid) {
      discountCents = calculateDiscountCents(subtotalCents, validation.coupon);
      couponCode = validation.coupon.code;
    }
  }

  const totalCents = subtotalCents + shippingCents - discountCents;
  const orderNumber = generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: session.user.id,
      email: session.user.email ?? address.fullName,
      status: "PENDING",
      subtotalCents,
      shippingCents,
      taxCents: 0,
      discountCents,
      couponCode,
      shippingMethod,
      totalCents,
      currency: "inr",
      shipName: address.fullName,
      shipLine1: address.line1,
      shipLine2: address.line2,
      shipCity: address.city,
      shipState: address.state,
      shipPostalCode: address.postalCode,
      shipCountry: address.country,
      shipPhone: address.phone,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          productSlug: item.product.slug,
          productImageUrl: item.product.images[0]?.url,
          unitPriceCents: item.product.priceCents,
          quantity: item.quantity,
          lineTotalCents: item.quantity * item.product.priceCents,
        })),
      },
    },
  });

  const razorpayOrder = await razorpay.orders.create({
    amount: totalCents,
    currency: "INR",
    receipt: order.orderNumber,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { razorpayOrderId: razorpayOrder.id },
  });

  return {
    success: true,
    orderNumber: order.orderNumber,
    razorpayOrderId: razorpayOrder.id,
    amountPaise: totalCents,
    keyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  };
}
