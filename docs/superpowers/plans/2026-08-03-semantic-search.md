# Semantic Search (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Phase 1's ILIKE-only product search ranking with hybrid keyword + semantic (vector) ranking, without changing `searchProducts()`'s public signature or any caller.

**Architecture:** Product text (name + brand + category + description) is embedded via Gemini on every admin create/update and stored in a new `pgvector` column on `Product`. At query time, the search query is embedded too; a single raw SQL query retrieves top candidates from both a trigram-similarity ranking and a vector cosine-distance ranking (each via the existing `pg_trgm` GIN index / new HNSW index), fuses them with Reciprocal Rank Fusion, and returns the fused order. If any Gemini call fails, search falls back to the unmodified Phase 1 ILIKE path.

**Tech Stack:** Prisma 7 (`Unsupported` type + raw SQL, since native pgvector support isn't in Prisma yet), `pgvector`/`pg_trgm` Postgres extensions (already enabled), `@google/genai` SDK, Gemini `gemini-embedding-001` embedding model.

## Global Constraints

- `searchProducts()`'s exported signature (`SearchParams` in, `{ products, total, page, perPage, totalPages }` out) does not change — verified in spec design.
- Embedding dimension is 768 everywhere (`gemini-embedding-001` with `outputDimensionality: 768`) — spec decision, matches the new column's `vector(768)` type.
- No embedding call may ever throw past its call site — every embedding-call site returns `null`/falls back instead of propagating an error (spec: "silently fall back to keyword-only search").
- This repo has no test framework (no `jest`/`vitest`/etc. in `package.json`; the README's own verification approach is manual). Do not add one — that's an unrelated dependency this feature doesn't need. Each task's "test" step below is a manual/scripted verification using tools already in this repo (`tsx`, `docker compose exec`, the dev server), matching how `prisma/seed.ts` is already verified.
- Only `Product` create/update (admin) and search-query time call the embedding API — no cron, no scheduled re-embedding (spec: out of scope).

---

## File Structure

- `lib/search/embed.ts` **(new)** — all Gemini embedding logic lives here: `embedText()`, `buildProductEmbeddingText()`, `generateAndStoreEmbedding()`. Both the admin actions and the backfill script call into this file rather than duplicating the Gemini call or the vector-literal SQL formatting.
- `lib/env.ts` **(modify)** — add `GEMINI_API_KEY`.
- `.env.example` **(modify)** — document `GEMINI_API_KEY`.
- `prisma/schema.prisma` **(modify)** — add `embedding` field to `Product`.
- `prisma/migrations/<timestamp>_add_product_embedding/migration.sql` **(new)** — hand-written (Prisma has no first-class pgvector support yet; this is the documented way to manage it).
- `lib/actions/admin/product-actions.ts` **(modify)** — `createProductAction`/`updateProductAction` call `generateAndStoreEmbedding()` after saving.
- `prisma/backfill-embeddings.ts` **(new)** — one-off script for products missing an embedding.
- `lib/search/index.ts` **(modify)** — `searchProducts()` gains a hybrid path used only when `q` is set and `sort` is `"relevance"`.
- `package.json` **(modify, via `npm install`)** — adds `@google/genai`.

---

### Task 1: Gemini API key config + SDK install

**Files:**
- Modify: `lib/env.ts`
- Modify: `.env.example`
- Modify: `package.json` (via `npm install`, not hand-edited)

**Interfaces:**
- Produces: `env.GEMINI_API_KEY: string`, consumed by Task 3's `lib/search/embed.ts`.

- [ ] **Step 1: Install the Gemini SDK**

Run: `npm install @google/genai`

- [ ] **Step 2: Add `GEMINI_API_KEY` to the env schema**

In `lib/env.ts`, add a new field to `envSchema`, grouped near the other third-party API keys:

```ts
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1),

  GEMINI_API_KEY: z.string().min(1),

  NEXT_PUBLIC_APP_URL: z.url(),
```

- [ ] **Step 3: Document it in `.env.example`**

Add, after the Razorpay block:

```
# --- Gemini embeddings (https://aistudio.google.com/apikey) ---
# Used for semantic product search (see lib/search/embed.ts).
GEMINI_API_KEY=""
```

- [ ] **Step 4: Add the key to your local `.env` and verify the schema parses**

Get a key from https://aistudio.google.com/apikey, put it in `.env` as `GEMINI_API_KEY="..."`, then run:

`npx tsx -e "import('./lib/env').then(m => console.log('OK:', !!m.env.GEMINI_API_KEY))"`

Expected: prints `OK: true` with no Zod validation error. If it throws, the key is missing from `.env`.

- [ ] **Step 5: Commit**

```bash
git add lib/env.ts .env.example package.json package-lock.json
git commit -m "Add GEMINI_API_KEY config and @google/genai dependency"
```

---

### Task 2: Add `embedding` column + HNSW index to `Product`

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_product_embedding/migration.sql`

**Interfaces:**
- Produces: `Product.embedding` — a nullable `vector(768)` column, invisible to Prisma Client's typed API (it's an `Unsupported` type) and only writable/readable via `$queryRaw`/`$executeRaw`. Task 3 and Task 6 both write/read it that way.

- [ ] **Step 1: Add the field to the Prisma schema**

In `prisma/schema.prisma`, in the `Product` model, add (right before `createdAt`):

```prisma
  ratingAvg   Float @default(0)
  ratingCount Int   @default(0)

  // pgvector column for semantic search. Nullable: unembedded products (not
  // yet saved through an admin action that generates one, or a failed Gemini
  // call) just don't participate in the vector half of ranking. Prisma has
  // no native pgvector support yet, so this is Unsupported and both the
  // index below and all reads/writes go through raw SQL (Tasks 2, 3, 6).
  embedding Unsupported("vector(768)")?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
```

- [ ] **Step 2: Scaffold an empty migration**

Run: `npx prisma migrate dev --create-only --name add_product_embedding`

This creates `prisma/migrations/<timestamp>_add_product_embedding/migration.sql`. Open it — Prisma may emit nothing or partial SQL for the `Unsupported` field; the next step replaces its contents entirely regardless of what's there.

- [ ] **Step 3: Write the migration SQL by hand**

Replace the full contents of that `migration.sql` file with:

```sql
-- AlterTable
ALTER TABLE "Product" ADD COLUMN "embedding" vector(768);

-- CreateIndex
CREATE INDEX "Product_embedding_idx" ON "Product" USING hnsw ("embedding" vector_cosine_ops);
```

- [ ] **Step 4: Apply the migration and regenerate the client**

```bash
npx prisma migrate dev
npx prisma generate
```

Expected: `prisma migrate dev` reports the migration applied with no drift warning (drift would mean Step 1's schema edit disagrees with Step 3's SQL — if so, re-check the column/type name match exactly: `embedding` / `vector(768)`).

- [ ] **Step 5: Verify the column and index exist**

If running the local Docker Postgres (`docker compose up -d`):

```bash
docker compose exec db psql -U meridian -d meridian -c "\d \"Product\""
```

Expected: the column list includes `embedding | vector(768)`, and the index list includes `Product_embedding_idx`.

(If you're on Neon instead of Docker, run the same `\d "Product"` via `psql "$DIRECT_URL" -c '\d "Product"'` or the Neon SQL editor.)

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "Add pgvector embedding column and HNSW index to Product"
```

---

### Task 3: `lib/search/embed.ts` — Gemini embedding wrapper

**Files:**
- Create: `lib/search/embed.ts`

**Interfaces:**
- Consumes: `env.GEMINI_API_KEY` (Task 1), `prisma` from `@/lib/db`, `Product.embedding` column (Task 2, written via raw SQL).
- Produces:
  - `embedText(text: string, taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"): Promise<number[] | null>` — used directly by Task 6 for query-time embedding.
  - `buildProductEmbeddingText(product: { name: string; brand: string | null; description: string }, categoryName: string): string` — used by Task 4 and Task 5.
  - `generateAndStoreEmbedding(productId: string, text: string): Promise<boolean>` — resolves `true` if an embedding was generated and stored, `false` if the Gemini call failed (nothing written). Used by Task 4 (return value ignored) and Task 5 (return value drives the log line).

- [ ] **Step 1: Write `lib/search/embed.ts`**

```ts
import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768;

const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

/**
 * Never throws. Callers treat `null` as "no embedding available this time"
 * and fall back to keyword-only behavior (product save still succeeds;
 * search still returns ILIKE results) rather than failing the request.
 */
export async function embedText(text: string, taskType: EmbeddingTaskType): Promise<number[] | null> {
  try {
    const response = await client.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [text],
      config: { outputDimensionality: EMBEDDING_DIMENSIONS, taskType },
    });
    const values = response.embeddings?.[0]?.values;
    if (!values || values.length !== EMBEDDING_DIMENSIONS) return null;
    return values;
  } catch (error) {
    console.error("[embedText] Gemini embedding call failed:", error);
    return null;
  }
}

export function buildProductEmbeddingText(
  product: { name: string; brand: string | null; description: string },
  categoryName: string,
): string {
  return `${product.name} — ${product.brand ?? ""} — ${categoryName}. ${product.description}`;
}

/**
 * Embeds `text` and, on success, writes it to Product.embedding via raw SQL
 * (required: `embedding` is an Unsupported/pgvector column, invisible to
 * Prisma Client's typed create/update). No-ops on embedding failure.
 */
export async function generateAndStoreEmbedding(productId: string, text: string): Promise<boolean> {
  const values = await embedText(text, "RETRIEVAL_DOCUMENT");
  if (!values) return false;
  const vectorLiteral = `[${values.join(",")}]`;
  await prisma.$executeRaw`UPDATE "Product" SET embedding = ${vectorLiteral}::vector WHERE id = ${productId}`;
  return true;
}
```

- [ ] **Step 2: Verify `embedText()` against the real API**

Run:

```bash
npx tsx -e "
import('./lib/search/embed').then(async (m) => {
  const v = await m.embedText('a cozy wool winter coat', 'RETRIEVAL_DOCUMENT');
  console.log('length:', v?.length, 'sample:', v?.slice(0, 3));
});
"
```

Expected: `length: 768` and three finite numbers as the sample. If it prints `length: undefined`, check `GEMINI_API_KEY` in `.env` and the console for the logged error.

- [ ] **Step 3: Verify the failure path returns `null`, not a throw**

Run the same command with an invalid key to confirm graceful degradation:

```bash
npx tsx -e "
import('./lib/search/embed').then(async (m) => {
  process.env.GEMINI_API_KEY = 'invalid';
});
"
```

(This only proves the schema validation gate; the real regression check is: temporarily set `GEMINI_API_KEY=invalid-key` in `.env`, rerun Step 2's command, confirm it logs `[embedText] Gemini embedding call failed:` and prints `length: undefined` rather than crashing the process. Then restore the real key in `.env`.)

- [ ] **Step 4: Commit**

```bash
git add lib/search/embed.ts
git commit -m "Add Gemini embedding wrapper (lib/search/embed.ts)"
```

---

### Task 4: Wire embedding generation into admin product create/update

**Files:**
- Modify: `lib/actions/admin/product-actions.ts`

**Interfaces:**
- Consumes: `buildProductEmbeddingText`, `generateAndStoreEmbedding` from `@/lib/search/embed` (Task 3).

- [ ] **Step 1: Import the new helpers**

At the top of `lib/actions/admin/product-actions.ts`, add:

```ts
import { buildProductEmbeddingText, generateAndStoreEmbedding } from "@/lib/search/embed";
```

- [ ] **Step 2: Embed on create**

In `createProductAction`, after the product is created, include the category name and generate the embedding before redirecting:

```ts
export async function createProductAction(formData: FormData) {
  await requireAdmin();

  const fields = readProductFields(formData);
  if (!fields.name || !fields.slug || !fields.description || !fields.categoryId || !fields.priceCents) return;

  const imageUrls = readImageUrls(formData);

  const product = await prisma.product.create({
    data: {
      ...fields,
      images: { create: imageUrls.map((url, i) => ({ url, position: i })) },
    },
    include: { category: { select: { name: true } } },
  });

  await generateAndStoreEmbedding(product.id, buildProductEmbeddingText(fields, product.category.name));

  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}`);
}
```

- [ ] **Step 3: Embed on update**

In `updateProductAction`, include the category name on the update call inside the transaction, then embed afterward:

```ts
export async function updateProductAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const fields = readProductFields(formData);
  if (!fields.name || !fields.slug || !fields.description || !fields.categoryId || !fields.priceCents) return;

  const imageUrls = readImageUrls(formData);

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id },
      data: fields,
      include: { category: { select: { name: true } } },
    }),
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.productImage.createMany({
      data: imageUrls.map((url, i) => ({ productId: id, url, position: i })),
    }),
  ]);

  await generateAndStoreEmbedding(id, buildProductEmbeddingText(fields, updated.category.name));

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath(`/p/${fields.slug}`);
}
```

- [ ] **Step 4: Verify end-to-end via the dev server**

```bash
npm run dev
```

In the browser, sign in as admin (`admin-demo@example.com` / your `DEMO_ADMIN_PASSWORD`), go to `/admin/products`, edit any existing product (change nothing important, just save), then verify the column was written:

```bash
docker compose exec db psql -U meridian -d meridian -c "SELECT slug, embedding IS NOT NULL AS has_embedding FROM \"Product\" WHERE slug = '<the-slug-you-edited>';"
```

Expected: `has_embedding = t`.

- [ ] **Step 5: Commit**

```bash
git add lib/actions/admin/product-actions.ts
git commit -m "Generate product embeddings on admin create/update"
```

---

### Task 5: Backfill script for existing products

**Files:**
- Create: `prisma/backfill-embeddings.ts`

**Interfaces:**
- Consumes: `buildProductEmbeddingText`, `generateAndStoreEmbedding`, from `@/lib/search/embed` (Task 3); `prisma` from `@/lib/db`.

- [ ] **Step 1: Write the script**

```ts
import "dotenv/config";
import { prisma } from "@/lib/db";
import { buildProductEmbeddingText, generateAndStoreEmbedding } from "@/lib/search/embed";

const DELAY_MS = 250; // stay under Gemini free-tier per-minute rate limits

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const missing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Product" WHERE embedding IS NULL
  `;
  console.log(`Backfilling embeddings for ${missing.length} product(s)...`);

  for (const { id } of missing) {
    const product = await prisma.product.findUniqueOrThrow({
      where: { id },
      include: { category: { select: { name: true } } },
    });

    const text = buildProductEmbeddingText(product, product.category.name);
    const stored = await generateAndStoreEmbedding(id, text);

    console.log(stored ? `  embedded ${product.slug}` : `  skip ${product.slug}: embedding call failed`);
    await sleep(DELAY_MS);
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add an npm script**

In `package.json`, in `"scripts"`, add:

```json
    "embed:backfill": "tsx prisma/backfill-embeddings.ts",
```

- [ ] **Step 3: Run it against the seeded catalog**

```bash
npm run embed:backfill
```

Expected: one `embedded <slug>` line per product missing an embedding (likely all seeded products, minus any you already edited in Task 4's verification), ending with `Done.`.

- [ ] **Step 4: Verify no products are missing an embedding**

```bash
docker compose exec db psql -U meridian -d meridian -c "SELECT COUNT(*) FROM \"Product\" WHERE embedding IS NULL;"
```

Expected: `0`.

- [ ] **Step 5: Commit**

```bash
git add prisma/backfill-embeddings.ts package.json
git commit -m "Add embedding backfill script for existing products"
```

---

### Task 6: Hybrid keyword + vector search in `searchProducts()`

**Files:**
- Modify: `lib/search/index.ts`

**Interfaces:**
- Consumes: `embedText` from `@/lib/search/embed` (Task 3); `Product.embedding` (Task 2, read via raw SQL).
- Produces: `searchProducts()` — signature unchanged from Phase 1 (`SearchParams` in, `{ products, total, page, perPage, totalPages }` out). This is the last task; no later task depends on new exports from here.

- [ ] **Step 1: Add the hybrid retrieval function**

In `lib/search/index.ts`, add `import { embedText } from "@/lib/search/embed";` to the top of the file alongside the existing `Prisma`/`prisma` imports. Then add the following near (above or below) the existing `searchProducts` — it's a private helper, not exported:

```ts
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
```

- [ ] **Step 2: Call it from `searchProducts()` for relevance-sorted text queries**

Modify the top of `searchProducts` (everything after is the existing Phase-1 body, unchanged):

```ts
export async function searchProducts(params: SearchParams) {
  if (params.q && (params.sort ?? "relevance") === "relevance") {
    const hybrid = await hybridSearchProducts({ ...params, q: params.q });
    if (hybrid) return hybrid;
    // Gemini call failed — fall through to the unmodified ILIKE path below.
  }

  const page = Math.max(1, params.page ?? 1);
  // ... rest of the existing function body is unchanged ...
```

- [ ] **Step 3: Verify a conceptual query surfaces a non-keyword match**

Pick a seeded product whose name/description does *not* contain an obvious synonym (e.g. a wool coat that never says "jacket" — check `prisma/seed-data.ts` for a real example matching your catalog), then:

```bash
npm run dev
```

Visit `http://localhost:3000/search?q=cozy+winter+jacket` (or your chosen conceptual query) and confirm the relevant product appears in results despite no keyword overlap. Then visit a query for an exact product name/brand and confirm it still ranks first (keyword signal still works).

- [ ] **Step 4: Verify graceful fallback on embedding failure**

Temporarily set `GEMINI_API_KEY="invalid-key"` in `.env`, restart `npm run dev`, repeat the conceptual-query search from Step 3.

Expected: the page still renders results (Phase-1 ILIKE behavior — likely fewer/no matches for a non-keyword query, but no error page, no 500). Check the server console for the `[embedText] Gemini embedding call failed:` log. Restore the real `GEMINI_API_KEY` afterward.

- [ ] **Step 5: Verify non-relevance sorts are untouched**

Visit `http://localhost:3000/search?q=<anything>&sort=price_asc` and confirm results load normally (this path never calls `embedText` — Step 2's condition guards on `sort === "relevance"`).

- [ ] **Step 6: Commit**

```bash
git add lib/search/index.ts
git commit -m "Add hybrid keyword+vector ranking to searchProducts()"
```

---

## Post-plan verification checklist

- [ ] `prisma migrate reset && prisma db seed && npm run embed:backfill` → every product has an embedding, no errors
- [ ] A conceptual search query (no keyword overlap) surfaces the right product
- [ ] An exact brand/SKU search still ranks that product first
- [ ] `sort=price_asc`/`newest`/`rating` results are unaffected (byte-identical to before this feature, since those paths never call `embedText`)
- [ ] Editing a product in `/admin/products` regenerates its embedding
- [ ] Search still works (degrades to keyword-only) with an invalid `GEMINI_API_KEY`
