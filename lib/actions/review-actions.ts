"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recomputeProductRating } from "@/lib/reviews";

export async function submitReviewAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const userId = session.user.id;

  const productId = String(formData.get("productId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const rating = Number(formData.get("rating"));
  const title = String(formData.get("title") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "").trim();

  if (!productId || !Number.isInteger(rating) || rating < 1 || rating > 5 || !body) return;

  await prisma.$transaction(async (tx) => {
    // Computed fresh on every submit, inside the transaction: if it's stale
    // it's stale-low (a purchase completing concurrently just misses the
    // flag this time), never stale-high, which is the safe direction.
    const verifiedOrderItem = await tx.orderItem.findFirst({
      where: { productId, order: { userId, status: { in: ["PAID", "FULFILLED"] } } },
    });

    await tx.review.upsert({
      where: { userId_productId: { userId, productId } },
      update: { rating, title, body, isVerifiedPurchase: !!verifiedOrderItem },
      create: { userId, productId, rating, title, body, isVerifiedPurchase: !!verifiedOrderItem },
    });

    await recomputeProductRating(tx, productId);
  });

  if (slug) revalidatePath(`/p/${slug}`);
}

export async function deleteReviewAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const userId = session.user.id;

  const productId = String(formData.get("productId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!productId) return;

  await prisma.$transaction(async (tx) => {
    await tx.review.deleteMany({ where: { userId, productId } });
    await recomputeProductRating(tx, productId);
  });

  if (slug) revalidatePath(`/p/${slug}`);
}
