import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";

export type SortOption = "relevance" | "newest" | "price_asc" | "price_desc" | "rating";

export type SearchParams = {
  q?: string;
  categoryIds?: string[];
  minPriceCents?: number;
  maxPriceCents?: number;
  minRating?: number;
  inStockOnly?: boolean;
  sort?: SortOption;
  page?: number;
  perPage?: number;
};

const PER_PAGE_DEFAULT = 24;

const sortToOrderBy: Record<SortOption, Prisma.ProductOrderByWithRelationInput[]> = {
  relevance: [{ createdAt: "desc" }],
  newest: [{ createdAt: "desc" }],
  price_asc: [{ priceCents: "asc" }],
  price_desc: [{ priceCents: "desc" }],
  rating: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
};

/**
 * Single entry point for all product listing/filtering, shared by category pages
 * and the search page. Phase 1 uses ILIKE (via Prisma `contains`); Phase 2 can
 * swap the implementation for hybrid keyword + vector ranking without callers
 * changing.
 */
export async function searchProducts(params: SearchParams) {
  const page = Math.max(1, params.page ?? 1);
  const perPage = params.perPage ?? PER_PAGE_DEFAULT;

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(params.categoryIds?.length ? { categoryId: { in: params.categoryIds } } : {}),
    ...(params.q ? { name: { contains: params.q, mode: "insensitive" } } : {}),
    ...(params.minPriceCents !== undefined ? { priceCents: { gte: params.minPriceCents } } : {}),
    ...(params.maxPriceCents !== undefined ? { priceCents: { lte: params.maxPriceCents } } : {}),
    ...(params.minRating !== undefined ? { ratingAvg: { gte: params.minRating } } : {}),
    ...(params.inStockOnly ? { stockQuantity: { gt: 0 } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: sortToOrderBy[params.sort ?? "relevance"],
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        slug: true,
        name: true,
        priceCents: true,
        compareAtPriceCents: true,
        stockQuantity: true,
        ratingAvg: true,
        ratingCount: true,
        images: { select: { url: true, altText: true }, orderBy: { position: "asc" }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}
