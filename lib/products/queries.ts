import { prisma } from "@/lib/db";

const listItemSelect = {
  id: true,
  slug: true,
  name: true,
  priceCents: true,
  compareAtPriceCents: true,
  stockQuantity: true,
  ratingAvg: true,
  ratingCount: true,
  images: { select: { url: true, altText: true }, orderBy: { position: "asc" as const }, take: 1 },
};

export function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
    take: limit,
    select: listItemSelect,
  });
}

export function getNewArrivals(limit = 8) {
  return prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: listItemSelect,
  });
}

export function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      category: { select: { id: true, name: true, slug: true, parentId: true } },
      images: { orderBy: { position: "asc" } },
      reviews: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
        take: 20,
      },
    },
  });
}

export function getRelatedProducts(categoryId: string, excludeProductId: string, limit = 8) {
  return prisma.product.findMany({
    where: { status: "ACTIVE", categoryId, id: { not: excludeProductId } },
    orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: listItemSelect,
  });
}

export type ProductListItem = Awaited<ReturnType<typeof getFeaturedProducts>>[number];
