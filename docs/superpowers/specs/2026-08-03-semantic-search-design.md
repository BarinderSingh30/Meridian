# Semantic Search (Phase 2) — Design

## Context

Meridian's Phase 1 search (`lib/search/index.ts`, `searchProducts()`) matches on `name ILIKE %q%` and sorts by `createdAt`/`price`/`rating`. The code already anticipates this phase — its own comment says:

> Phase 1 uses ILIKE (via Prisma `contains`); Phase 2 can swap the implementation for hybrid keyword + vector ranking without callers changing.

The database is already provisioned for it: `prisma/schema.prisma` declares the `vector` and `pg_trgm` Postgres extensions, the local Docker image is `pgvector/pgvector:pg17`, and `Product.name` already has a `gin_trgm_ops` index. No embedding column exists yet, and no embedding-provider package is installed.

## Goal

Make search understand meaning, not just substrings — e.g. "cozy winter jacket" should surface a wool coat even if neither word appears in its name or description — while still catching exact brand/SKU/typo matches that keyword search is good at. `searchProducts()`'s public signature and all its callers (search page, category pages) stay unchanged; only the internal ranking for text queries changes.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Embedding provider | Google Gemini (`text-embedding-004` / `gemini-embedding-001`, truncated to 768 dims) | User has Google AI Pro access; avoids adding OpenAI billing |
| Ranking strategy | Hybrid: keyword (trigram) + vector, fused | Vector alone is weak on exact brand/SKU/short queries; keyword alone misses conceptual matches |
| Fusion method | Reciprocal Rank Fusion (RRF) | Combines by rank position, not raw score — no cross-metric normalization/tuning needed; standard hybrid-search pattern (Elasticsearch/OpenSearch use it) |
| Embedding trigger | Inline on product create/update, plus a one-off backfill script | Keeps embeddings fresh with no extra infra (queue/worker); acceptable at portfolio catalog scale |
| Query-time failure mode | Silently fall back to keyword-only search | Search must never break for a user because of a third-party API hiccup |

## Data model

Add to `Product`:

```prisma
embedding Unsupported("vector(768)")?
```

Add an HNSW index (`vector_cosine_ops`) on `embedding`, alongside the existing `gin_trgm_ops` index on `name`. One new Prisma migration. The column is nullable — products without an embedding yet (freshly seeded, or saved while the embedding call failed) simply don't participate in the vector half of ranking until backfilled.

## Embedding generation

`lib/search/embed.ts` exports one function:

```ts
embedText(text: string): Promise<number[] | null>
```

Wraps the Gemini embeddings API. Returns `null` (never throws to the caller) on any failure — callers decide what "no embedding" means for them.

**What gets embedded:** `` `${name} — ${brand ?? ""} — ${category.name}. ${description}` ``. Brand and category give the model retrieval-useful signal a bare description lacks (e.g. "Nike" and "Running Shoes" pull the vector toward the right neighborhood).

**When:** `createProductAction` and `updateProductAction` (`lib/actions/admin/product-actions.ts`) call `embedText()` after assembling the composite string, and store the result on the same `create`/`update` call. If `embedText()` returns `null`, the product still saves — with `embedding: null` — rather than the admin action failing because of an unrelated API hiccup.

## Backfill script

`prisma/backfill-embeddings.ts`, run via `tsx` (matches the existing `prisma/seed.ts` pattern). Iterates all `ACTIVE`/`DRAFT` products with `embedding IS NULL`, embeds, updates. Includes a small delay between calls to respect Gemini free-tier per-minute quotas. Run once after this ships (to cover the seeded catalog) and after any bulk import.

## Query-time search

`searchProducts()` in `lib/search/index.ts` keeps its exact signature and all existing filter logic (status/category/price/rating/stock). Internally, when `q` is present **and** `sort === "relevance"`:

1. Call `embedText(q)`.
2. If it returns a vector: run one `prisma.$queryRaw` with two CTEs over the existing `where` filters —
   - keyword CTE: rank by `similarity(name, q)` (existing trgm behavior)
   - vector CTE: rank by `embedding <=> queryVector` (cosine distance)
   - fuse with RRF: `score = 1/(60 + rank_keyword) + 1/(60 + rank_vector)` (products missing from one CTE just don't contribute that term), order by `score DESC`.
3. If it returns `null` (Gemini call failed): fall through to the current ILIKE/trgm-only path, unchanged.

Any other sort (`price_asc`, `price_desc`, `newest`, `rating`) or any request without `q` never calls `embedText()` at all — those paths are byte-for-byte unchanged from Phase 1.

## Error handling

No new user-facing error states. A failed embedding call (product save or search query) degrades silently to the prior behavior — an unembedded product, or a keyword-only search result — never a broken page or failed save.

## Testing

- Manual pass on `/search`: compare a handful of representative queries (a conceptual query like "cozy winter jacket", an exact brand/SKU query, a typo) before/after, on the seeded catalog post-backfill.
- Spot-check the RRF SQL directly against a few seeded products with known embeddings to confirm fusion ordering behaves as expected (a conceptual match without keyword overlap should still surface; an exact brand/SKU match should still rank highly even if semantically generic).

## Out of scope

- No UI changes — same search box, filters, sort dropdown.
- No autocomplete/typeahead, no "did you mean" suggestions.
- No scheduled/cron re-embedding — only on product save + manual backfill.
- No vector search on reviews or categories, only `Product`.
