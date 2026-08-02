"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recomputeProductRating } from "@/lib/reviews";

export async function toggleReviewStatusAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const review = await prisma.review.findUnique({ where: { id }, select: { productId: true, status: true } });
  if (!review) return;

  const nextStatus = review.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";

  await prisma.$transaction(async (tx) => {
    await tx.review.update({ where: { id }, data: { status: nextStatus } });
    await recomputeProductRating(tx, review.productId);
  });

  revalidatePath("/admin/reviews");
}
