import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function recomputeProductRating(tx: Prisma.TransactionClient, productId: string) {
  const agg = await tx.review.aggregate({
    where: { productId, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: true,
  });
  await tx.product.update({
    where: { id: productId },
    data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
  });
}

export async function getRatingDistribution(productId: string) {
  const counts = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId, status: "PUBLISHED" },
    _count: true,
  });
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const c of counts) dist[c.rating] = c._count;
  return dist;
}

export function getMyReview(userId: string, productId: string) {
  return prisma.review.findUnique({ where: { userId_productId: { userId, productId } } });
}
