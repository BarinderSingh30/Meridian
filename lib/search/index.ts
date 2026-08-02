import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { embedText } from "@/lib/search/embed";

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

const CANDIDATE_POOL_SIZE = 50; // per signal, before fusion
const RRF_K = 60; // standard RRF constant

function buildFilterClauses(params: SearchParams): Prisma.Sql[] {
  const filters: Prisma.Sql[] = [Prisma.sql`status = 'ACTIVE'`];
  if (params.categoryIds?.length) filters.push(Prisma.sql`"categoryId" IN (${Prisma.join(params.categoryIds)})`);
  if (params.minPriceCents !== undefined) filters.push(Prisma.sql`"priceCents" >= ${params.minPriceCents}`);
  if (params.maxPriceCents !== undefined) filters.push(Prisma.sql`"priceCents" <= ${params.maxPriceCents}`);
  if (params.minRating !== undefined) filters.push(Prisma.sql`"ratingAvg" >= ${params.minRating}`);
  if (params.inStockOnly) filters.push(Prisma.sql`"stockQuantity" > 0`);
  return filters;
}

/**
 * Hybrid keyword+vector ranking for text queries. Returns null (caller falls
 * back to the Phase-1 ILIKE path) only when the query embedding call fails —
 * every other outcome, including zero matches, returns a real result object.
 */
async function hybridSearchProducts(params: SearchParams & { q: string }) {
  const queryVector = await embedText(params.q, "RETRIEVAL_QUERY");
  if (!queryVector) return null;

  const page = Math.max(1, params.page ?? 1);
  const perPage = params.perPage ?? PER_PAGE_DEFAULT;
  const offset = (page - 1) * perPage;
  const vectorLiteral = `[${queryVector.join(",")}]`;
  const whereClause = Prisma.join(buildFilterClauses(params), " AND ");

  const rows = await prisma.$queryRaw<{ id: string; total_count: bigint }[]>(Prisma.sql`
    WITH filtered AS (
      SELECT id, name, embedding FROM "Product" WHERE ${whereClause}
    ),
    keyword_candidates AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY sim DESC) AS rank FROM (
        SELECT id, similarity(name, ${params.q}) AS sim
        FROM filtered
        WHERE similarity(name, ${params.q}) > 0.05
      ) matched
      ORDER BY sim DESC
      LIMIT ${CANDIDATE_POOL_SIZE}
    ),
    vector_candidates AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY dist) AS rank FROM (
        SELECT id, embedding <=> ${vectorLiteral}::vector AS dist
        FROM filtered
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorLiteral}::vector
        LIMIT ${CANDIDATE_POOL_SIZE}
      ) nearest
    ),
    fused AS (
      SELECT
        COALESCE(k.id, v.id) AS id,
        COALESCE(1.0 / (${RRF_K} + k.rank), 0) + COALESCE(1.0 / (${RRF_K} + v.rank), 0) AS score
      FROM keyword_candidates k
      FULL OUTER JOIN vector_candidates v ON k.id = v.id
    )
    SELECT id, COUNT(*) OVER() AS total_count
    FROM fused
    ORDER BY score DESC
    LIMIT ${perPage} OFFSET ${offset}
  `);

  const orderedIds = rows.map((r) => r.id);
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

  const found = await prisma.product.findMany({
    where: { id: { in: orderedIds } },
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
  });
  const byId = new Map(found.map((p) => [p.id, p]));
  const products = orderedIds.map((id) => byId.get(id)).filter((p): p is (typeof found)[number] => p !== undefined);

  return {
    products,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/**
 * Single entry point for all product listing/filtering, shared by category pages
 * and the search page. Phase 1 uses ILIKE (via Prisma `contains`); Phase 2 can
 * swap the implementation for hybrid keyword + vector ranking without callers
 * changing.
 */
export async function searchProducts(params: SearchParams) {
  if (params.q && (params.sort ?? "relevance") === "relevance") {
    const hybrid = await hybridSearchProducts({ ...params, q: params.q });
    if (hybrid) return hybrid;
    // Gemini call failed — fall through to the unmodified ILIKE path below.
  }

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
