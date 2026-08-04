import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { embedText } from "@/lib/search/embed";
import { listItemSelect } from "@/lib/products/queries";

export type SortOption = "relevance" | "newest" | "price_asc" | "price_desc" | "rating";

export type SearchParams = {
  q?: string;
  categoryIds?: string[];
  brands?: string[];
  minPriceCents?: number;
  maxPriceCents?: number;
  minRating?: number;
  inStockOnly?: boolean;
  sort?: SortOption;
  page?: number;
  perPage?: number;
};

const PER_PAGE_DEFAULT = 24;

type ProductSummary = Prisma.ProductGetPayload<{ select: typeof listItemSelect }>;

export type SearchResult = {
  products: ProductSummary[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  didYouMean?: string;
};

const sortToOrderBy: Record<SortOption, Prisma.ProductOrderByWithRelationInput[]> = {
  relevance: [{ createdAt: "desc" }],
  newest: [{ createdAt: "desc" }],
  price_asc: [{ priceCents: "asc" }],
  price_desc: [{ priceCents: "desc" }],
  rating: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
};

// Per signal, before fusion. This also bounds the reported `total`/pagination for
// hybrid search to at most 2 × CANDIDATE_POOL_SIZE fused candidates — a query
// matching more products than that will under-report `total` and stop paginating
// early. Fine for this catalog's ~80 products; revisit if the catalog grows.
const CANDIDATE_POOL_SIZE = 50;
const RRF_K = 60; // standard RRF constant

function buildFilterClauses(params: SearchParams): Prisma.Sql[] {
  const filters: Prisma.Sql[] = [Prisma.sql`status = 'ACTIVE'`];
  if (params.categoryIds?.length) filters.push(Prisma.sql`"categoryId" IN (${Prisma.join(params.categoryIds)})`);
  if (params.brands?.length) filters.push(Prisma.sql`brand IN (${Prisma.join(params.brands)})`);
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
async function hybridSearchProducts(params: SearchParams & { q: string }): Promise<SearchResult | null> {
  const queryVector = await embedText(params.q, "RETRIEVAL_QUERY");
  if (!queryVector) return null;

  const page = Math.max(1, params.page ?? 1);
  const perPage = params.perPage ?? PER_PAGE_DEFAULT;
  const offset = (page - 1) * perPage;
  const vectorLiteral = `[${queryVector.join(",")}]`;
  const whereClause = Prisma.join(buildFilterClauses(params), " AND ");

  const fusedCte = Prisma.sql`
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
  `;

  const [countRows, idRows] = await Promise.all([
    prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`${fusedCte} SELECT COUNT(*) AS total FROM fused`),
    prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`${fusedCte} SELECT id FROM fused ORDER BY score DESC, id ASC LIMIT ${perPage} OFFSET ${offset}`,
    ),
  ]);

  const orderedIds = idRows.map((r) => r.id);
  const total = Number(countRows[0]?.total ?? 0);

  const found = await prisma.product.findMany({
    where: { id: { in: orderedIds } },
    select: listItemSelect,
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
export async function searchProducts(params: SearchParams): Promise<SearchResult> {
  const result = await searchProductsInner(params);

  if (params.q && result.total === 0) {
    const suggestion = await prisma.$queryRaw<{ name: string }[]>`
      SELECT name FROM "Product"
      WHERE status = 'ACTIVE' AND similarity(name, ${params.q}) > 0.15
      ORDER BY similarity(name, ${params.q}) DESC
      LIMIT 1
    `;
    if (suggestion[0]) return { ...result, didYouMean: suggestion[0].name };
  }

  return result;
}

async function searchProductsInner(params: SearchParams): Promise<SearchResult> {
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
    ...(params.brands?.length ? { brand: { in: params.brands } } : {}),
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
      select: listItemSelect,
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
