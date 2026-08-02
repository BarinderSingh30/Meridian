"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getOrCreateCart } from "@/lib/cart";

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
