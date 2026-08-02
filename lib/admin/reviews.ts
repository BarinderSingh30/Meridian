import { prisma } from "@/lib/db";

export function getAdminReviews() {
  return prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
  });
}
