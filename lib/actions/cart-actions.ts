"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getOrCreateCart } from "@/lib/cart";
import { validateCoupon } from "@/lib/coupons";

export async function addToCartAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const requested = Math.max(1, Number(formData.get("quantity")) || 1);
  if (!productId) return;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stockQuantity: true, status: true },
  });
  if (!product || product.status !== "ACTIVE" || product.stockQuantity <= 0) return;

  const cart = await getOrCreateCart();
  const existing = cart.items.find((item) => item.productId === productId);
  const nextQuantity = Math.min(product.stockQuantity, (existing?.quantity ?? 0) + requested);

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: nextQuantity },
    create: { cartId: cart.id, productId, quantity: nextQuantity },
  });

  revalidatePath("/", "layout");
}

export async function updateCartItemAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity"));
  if (!productId || Number.isNaN(quantity)) return;

  const cart = await getOrCreateCart();

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  } else {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { stockQuantity: true } });
    const clamped = Math.min(quantity, product?.stockQuantity ?? quantity);
    await prisma.cartItem.updateMany({ where: { cartId: cart.id, productId }, data: { quantity: clamped } });
  }

  revalidatePath("/", "layout");
}

export async function removeCartItemAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  const cart = await getOrCreateCart();
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });

  revalidatePath("/", "layout");
}

export async function clearCartAction() {
  const cart = await getOrCreateCart();
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  revalidatePath("/", "layout");
}

export type ApplyCouponResult = { success: true } | { success: false; error: string };

export async function applyCouponAction(code: string): Promise<ApplyCouponResult> {
  const trimmed = code.trim();
  if (!trimmed) return { success: false, error: "Enter a coupon code." };

  const validation = await validateCoupon(trimmed);
  if (!validation.valid) return { success: false, error: validation.error };

  const cart = await getOrCreateCart();
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: validation.coupon.code } });
  revalidatePath("/cart");
  revalidatePath("/checkout");

  return { success: true };
}

export async function removeCouponAction() {
  const cart = await getOrCreateCart();
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  revalidatePath("/cart");
  revalidatePath("/checkout");
}
