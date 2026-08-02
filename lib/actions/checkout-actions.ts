"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCart } from "@/lib/cart";
import { calculateShippingCents } from "@/lib/shipping";

function generateOrderNumber() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${random}`;
}

/**
 * Creates a PENDING order snapshotted from the current cart + address, but
 * does not touch the cart or stock - those only change once the webhook
 * confirms payment (see lib/actions/payment-actions.ts, added in the next
 * step). If the customer abandons payment, the order simply stays PENDING
 * forever and the cart is untouched.
 */
export async function placeOrderAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const addressId = String(formData.get("addressId") ?? "");
  if (!addressId) redirect("/checkout?error=address");

  const [address, cart] = await Promise.all([
    prisma.address.findFirst({ where: { id: addressId, userId: session.user.id } }),
    getCart(),
  ]);

  if (!address) redirect("/checkout?error=address");
  if (!cart || cart.items.length === 0) redirect("/cart");

  const hasStockIssue = cart.items.some(
    (item) => item.product.status !== "ACTIVE" || item.quantity > item.product.stockQuantity
  );
  if (hasStockIssue) redirect("/checkout?error=stock");

  const subtotalCents = cart.items.reduce((sum, item) => sum + item.quantity * item.product.priceCents, 0);
  const shippingCents = calculateShippingCents(subtotalCents);
  const totalCents = subtotalCents + shippingCents;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: session.user.id,
      email: session.user.email ?? address.fullName,
      status: "PENDING",
      subtotalCents,
      shippingCents,
      taxCents: 0,
      discountCents: 0,
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

  redirect(`/checkout/success?order=${order.orderNumber}`);
}
