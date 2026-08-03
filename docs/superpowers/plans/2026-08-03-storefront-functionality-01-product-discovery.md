# Storefront Functionality — Plan 1: Product Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Home/Category/Search/PDP features that currently render but do nothing actually work: notify-me, search did-you-mean + highlighting, quick add-to-cart, buy-now, brand facet, PDP specs table, PDP delivery-by-PIN estimate. Also lays the full schema foundation (`Coupon`, `StockNotification`, `Product.specs`, `Cart.couponCode`, `Order.couponCode`/`shippingMethod`) that Plan 2 (Cart & Checkout) depends on.

**Architecture:** Every feature reuses an existing Server Action, query function, or established component pattern rather than introducing new infrastructure — `addToCartAction` for quick-add and buy-now, the existing `resend.ts` client for notify-me email, the already-enabled `pg_trgm` extension for did-you-mean, `getRelatedProducts`-style query additions for the brand facet. No client-side state library, no toast system — this codebase's pattern is server-rendered feedback via `revalidatePath`, with `"use client"` used only where a Server Action's result must be read directly (matching `CheckoutButton`).

**Tech Stack:** Next.js 16 (App Router, Server Actions), Prisma 7, PostgreSQL (`pg_trgm` extension already enabled), Resend (already configured for auth + order-confirmation email), Tailwind (Dense Teal design tokens already in `app/globals.css`).

**Task order note:** Tasks are ordered so nothing imports a component/function that a later task hasn't created yet — notify-me and highlighting (Tasks 2-3) land before the grid card (Task 4) that consumes both.

## Global Constraints

- This repo has no test framework (no `jest`/`vitest` in `package.json`). Do not add one. Every task's verification step is a manual/scripted check using tools already in this repo (`npm run dev`, `npx tsx`, `psql`/`docker compose exec`), matching how the semantic-search and Dense Teal plans verified their work.
- Design tokens are fixed: teal `#0D9488` is the only action color, `6px` card radius / `5px` button/input radius / `4px` badge radius, no shadows anywhere (per `2026-08-03-dense-teal-visual-redesign-design.md`). Match existing class patterns exactly — copy classnames from the surrounding code, don't invent new ones.
- `Product.brand`, `Order.subtotalCents/shippingCents/taxCents/discountCents/totalCents`, and `getRelatedProducts()` already exist — this plan extends them, it does not duplicate them.
- Coupon **creation** is out of scope for this plan (and for Plan 2) — no admin UI exists yet. Test coupons are inserted via `prisma/seed.ts` or Prisma Studio.
- `StockNotification` capture has no restock trigger in this phase (confirmed decision) — it only stores the row and sends a confirmation email.

---

## File Structure

- `prisma/schema.prisma` **(modify)** — new `Coupon`, `StockNotification` models; `Cart.couponCode`, `Order.couponCode`/`shippingMethod`, `Product.specs` fields.
- `prisma/migrations/<timestamp>_storefront_functionality_foundation/migration.sql` **(new)** — hand-written, all of the above in one migration.
- `prisma/seed-data.ts` **(modify)** — `SeedProduct.specs?` field + example specs on 2 products.
- `prisma/seed.ts` **(modify)** — pass `specs` through the upsert.
- `lib/email/notify-me.ts` **(new)** — `sendNotifyMeConfirmationEmail(email, productName)`, modeled on `lib/email/order-confirmation.ts`.
- `lib/actions/notify-actions.ts` **(new)** — `notifyMeAction(productId, email)`.
- `components/notify-me-form.tsx` **(new)** — client component calling `notifyMeAction` directly (same pattern as `CheckoutButton` calling `placeOrderAction`).
- `components/highlighted-text.tsx` **(new)** — `highlightMatches(text, query?)` — wraps matched substrings in `<mark>`.
- `lib/search/index.ts` **(modify)** — `brands` filter param; did-you-mean suggestion when a text query returns zero results.
- `components/product-card.tsx` **(modify)** — quick add-to-cart form + `NotifyMeForm`, pulled out of the card's whole-tile `Link` so they're independently clickable; name rendering uses the highlight helper.
- `components/buy-now-button.tsx` **(new)** — client component wiring "Buy now" to add-to-cart + redirect.
- `app/(shell)/(storefront)/p/[slug]/page.tsx` **(modify)** — wire "Buy now", add `NotifyMeForm` to the out-of-stock state, render the specs table, add `DeliveryEstimateForm`.
- `lib/products/queries.ts` **(modify)** — `getAvailableBrands()`.
- `components/product-results.tsx` **(modify)** — brand checkbox facet + brand chips; passes `highlightQuery` to `ProductCard`.
- `app/(shell)/(storefront)/search/page.tsx` **(modify)** — thread `brand` param through; render did-you-mean.
- `app/(shell)/(storefront)/c/[slug]/page.tsx` **(modify)** — thread `brand` param through.
- `components/delivery-estimate.ts` **(new)** — pure `estimateDelivery(pincode)` function, no server round-trip.
- `components/delivery-estimate-form.tsx` **(new)** — client component wrapping it.

---

### Task 1: Schema foundation

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_storefront_functionality_foundation/migration.sql`
- Modify: `prisma/seed-data.ts`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Produces: `Coupon` model (consumed by Plan 2), `StockNotification` model (consumed by Task 2), `Product.specs: Prisma.JsonValue | null` (consumed by Task 7), `Cart.couponCode` / `Order.couponCode` / `Order.shippingMethod` (consumed by Plan 2 only — not touched in this plan beyond existing).

- [ ] **Step 1: Add the new models and fields to `prisma/schema.prisma`**

Add these two new models anywhere after the `Product`-adjacent models (e.g. right after `WishlistItem`):

```prisma
model Coupon {
  id              String    @id @default(cuid())
  code            String    @unique
  percentOff      Int?
  flatCents       Int?
  active          Boolean   @default(true)
  expiresAt       DateTime?
  maxRedemptions  Int?
  timesRedeemed   Int       @default(0)
  createdAt       DateTime  @default(now())
}

model StockNotification {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  email     String
  createdAt DateTime @default(now())

  @@index([productId])
}
```

Add `stockNotifications StockNotification[]` to the `Product` model's relation list (next to `wishlistItems`), and add the `specs` field right after `ratingCount`:

```prisma
  ratingAvg   Float @default(0)
  ratingCount Int   @default(0)

  // Flexible per-product spec sheet: array of {label, value} pairs, e.g.
  // [{"label":"Weight","value":"250g"}]. Admin editing UI is a separate,
  // later section — for now these are seeded or set directly.
  specs Json?
```

And add `stockNotifications StockNotification[]` next to `wishlistItems      WishlistItem[]` in `Product`.

Add `couponCode String?` to `Cart` (after `token`):

```prisma
model Cart {
  id     String  @id @default(cuid())
  userId String? @unique
  user   User?   @relation(fields: [userId], references: [id], onDelete: Cascade)
  token  String  @unique @default(cuid())
  couponCode String?

  items CartItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Add `couponCode String?` and `shippingMethod String @default("standard")` to `Order` (near `discountCents`):

```prisma
  subtotalCents Int
  shippingCents Int    @default(0)
  taxCents      Int    @default(0)
  discountCents Int    @default(0)
  totalCents    Int
  currency      String @default("inr")
  couponCode      String?
  shippingMethod  String @default("standard")
```

- [ ] **Step 2: Scaffold an empty migration**

```bash
npx prisma migrate dev --create-only --name storefront_functionality_foundation
```

This creates `prisma/migrations/<timestamp>_storefront_functionality_foundation/migration.sql`. Open it and check the generated SQL covers exactly: `CREATE TABLE "Coupon"`, `CREATE TABLE "StockNotification"` (+ FK + index), `ALTER TABLE "Product" ADD COLUMN "specs" JSONB`, `ALTER TABLE "Cart" ADD COLUMN "couponCode" TEXT`, `ALTER TABLE "Order" ADD COLUMN "couponCode" TEXT`, `ALTER TABLE "Order" ADD COLUMN "shippingMethod" TEXT NOT NULL DEFAULT 'standard'`.

**If the generated SQL also contains `DROP INDEX "Product_embedding_idx"`** (a known false-positive from the `Unsupported("vector(768)")` column — see the earlier investigation in this project's history), delete that line before applying. Confirm first with a read-only check:

```bash
npx prisma migrate status
```

Expected: `Database schema is up to date!` before you even run this migration — if it says otherwise, stop and investigate rather than applying blind.

- [ ] **Step 3: Apply the migration and regenerate the client**

```bash
npx prisma migrate dev
npx prisma generate
```

Expected: reports the migration applied, no drift warning, no `DROP INDEX` executed against `Product_embedding_idx`.

- [ ] **Step 4: Verify the schema**

```bash
npx prisma migrate status
```

Expected: `Database schema is up to date!`

- [ ] **Step 5: Add `specs` to the seed data type and two example products**

In `prisma/seed-data.ts`, add to the `SeedProduct` interface (after `images: string[];`):

```ts
  specs?: { label: string; value: string }[];
```

Find the `wireless-noise-cancelling-headphones` product object (search for `slug: "wireless-noise-cancelling-headphones"`) and add a `specs` array right after its `images` line:

```ts
    images: [img("wireless-noise-cancelling-headphones"), img("wireless-noise-cancelling-headphones-2")],
    specs: [
      { label: "Battery life", value: "40 hours" },
      { label: "Connectivity", value: "Bluetooth 5.3, multipoint" },
      { label: "Weight", value: "254g" },
      { label: "Noise cancellation", value: "Adaptive ANC" },
    ],
```

Pick one more product later in the file (e.g. the `14-inch-ultrabook-laptop` entry) and add a similarly-shaped `specs` array with 3-4 relevant rows (processor, RAM, storage, weight) using values consistent with its existing `description` text.

- [ ] **Step 6: Pass `specs` through the seed upsert**

In `prisma/seed.ts`, in the `PRODUCTS` loop, add `specs: p.specs` to both the `update` and `create` objects (next to `stockQuantity: p.stockQuantity,`):

```ts
      update: {
        name: p.name,
        description: p.description,
        brand: p.brand,
        sku: p.sku,
        priceCents: p.priceCents,
        compareAtPriceCents: p.compareAtPriceCents,
        stockQuantity: p.stockQuantity,
        specs: p.specs,
        categoryId,
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        brand: p.brand,
        sku: p.sku,
        priceCents: p.priceCents,
        compareAtPriceCents: p.compareAtPriceCents,
        stockQuantity: p.stockQuantity,
        specs: p.specs,
        categoryId,
      },
```

- [ ] **Step 7: Re-seed and verify**

```bash
npx prisma db seed
```

```bash
npx tsx -e "
import('./lib/db').then(async ({ prisma }) => {
  const p = await prisma.product.findUnique({ where: { slug: 'wireless-noise-cancelling-headphones' }, select: { specs: true } });
  console.log(JSON.stringify(p));
  await prisma.\$disconnect();
});
"
```

Expected: prints the 4-row specs array, not `null`.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma prisma/migrations prisma/seed-data.ts prisma/seed.ts
git commit -m "Add Coupon, StockNotification models and Product.specs / Cart.couponCode / Order.couponCode+shippingMethod fields"
```

---

### Task 2: Notify-me capture

**Files:**
- Create: `lib/email/notify-me.ts`
- Create: `lib/actions/notify-actions.ts`
- Create: `components/notify-me-form.tsx`
- Modify: `app/(shell)/(storefront)/p/[slug]/page.tsx`

**Interfaces:**
- Consumes: `StockNotification` model (Task 1), `resend` from `@/lib/resend`, `env.EMAIL_FROM` from `@/lib/env`.
- Produces: `notifyMeAction(productId: string, email: string): Promise<{ success: true } | { success: false; error: string }>` and `<NotifyMeForm productId={string} />` — both consumed by Task 4 (`ProductCard`).

- [ ] **Step 1: Write the confirmation email**

Create `lib/email/notify-me.ts`:

```ts
import { resend } from "@/lib/resend";
import { env } from "@/lib/env";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendNotifyMeConfirmationEmail(email: string, productName: string) {
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: `We'll let you know when ${productName} is back in stock`,
    html: `<p>Thanks for your interest in <strong>${escapeHtml(productName)}</strong>. We'll email this address as soon as it's back in stock.</p>`,
  });
}
```

- [ ] **Step 2: Write the Server Action**

Create `lib/actions/notify-actions.ts`:

```ts
"use server";

import { prisma } from "@/lib/db";
import { sendNotifyMeConfirmationEmail } from "@/lib/email/notify-me";

export type NotifyMeResult = { success: true } | { success: false; error: string };

export async function notifyMeAction(productId: string, email: string): Promise<NotifyMeResult> {
  if (!productId || !email) return { success: false, error: "Missing product or email." };

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
  if (!product) return { success: false, error: "Product not found." };

  await prisma.stockNotification.create({ data: { productId, email } });
  await sendNotifyMeConfirmationEmail(email, product.name);

  return { success: true };
}
```

- [ ] **Step 3: Write the client form**

Create `components/notify-me-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { notifyMeAction } from "@/lib/actions/notify-actions";

export function NotifyMeForm({ productId }: { productId: string }) {
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    if (typeof email !== "string" || !email) return;

    setState("pending");
    const result = await notifyMeAction(productId, email);
    if (result.success) {
      setState("done");
    } else {
      setState("error");
      setError(result.error);
    }
  }

  if (state === "done") {
    return (
      <p className="w-full rounded-[4px] border border-border py-1.5 text-center text-[10px] font-semibold text-teal-dark">
        We&apos;ll email you
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <input
        type="email"
        name="email"
        required
        placeholder="you@email.com"
        className="w-full rounded-[4px] border border-border px-2 py-1.5 text-[10px] text-ink outline-none placeholder:text-muted-2 focus-visible:border-[1.5px] focus-visible:border-teal"
      />
      <button
        type="submit"
        disabled={state === "pending"}
        className="w-full rounded-[4px] border border-border py-1.5 text-center text-[10px] font-semibold text-muted-2 hover:bg-surface-muted disabled:opacity-50"
      >
        {state === "pending" ? "Sending..." : "Notify me"}
      </button>
      {state === "error" && <p className="text-[9px] font-medium text-danger">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 4: Add notify-me to the PDP's out-of-stock state**

In `app/(shell)/(storefront)/p/[slug]/page.tsx`, add the import:

```ts
import { NotifyMeForm } from "@/components/notify-me-form";
```

Find the out-of-stock status block:

```tsx
            {outOfStock ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-danger">
                <span className="size-1.5 rounded-full bg-danger" />
                Out of stock
              </div>
            ) : (
```

Change it to also render the form right after that `<div>`, still inside the same conditional:

```tsx
            {outOfStock ? (
              <>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-danger">
                  <span className="size-1.5 rounded-full bg-danger" />
                  Out of stock
                </div>
                <NotifyMeForm productId={product.id} />
              </>
            ) : (
```

- [ ] **Step 5: Verify**

```bash
npx prisma studio
```

Set an existing seeded product's `stockQuantity` to `0` (pick one you're not using for other manual tests). Then:

```bash
npm run dev
```

Visit that product's PDP, submit the notify-me form with a real email you can check, confirm it shows "We'll email you" and the confirmation email arrives. Then check the row was stored:

```bash
npx tsx -e "
import('./lib/db').then(async ({ prisma }) => {
  const rows = await prisma.stockNotification.findMany({ orderBy: { createdAt: 'desc' }, take: 1 });
  console.log(rows);
  await prisma.\$disconnect();
});
"
```

Expected: one row with the email you entered. Set the product's `stockQuantity` back afterward.

- [ ] **Step 6: Commit**

```bash
git add lib/email/notify-me.ts lib/actions/notify-actions.ts components/notify-me-form.tsx "app/(shell)/(storefront)/p/[slug]/page.tsx"
git commit -m "Add notify-me email capture for out-of-stock products"
```

---

### Task 3: Search "did you mean" + term highlighting

**Files:**
- Create: `components/highlighted-text.tsx`
- Modify: `lib/search/index.ts`
- Modify: `app/(shell)/(storefront)/search/page.tsx`

**Interfaces:**
- Produces: `highlightMatches(text: string, query?: string): React.ReactNode` — consumed by Task 4 (`ProductCard`) and Task 6 (`ProductResults`).
- Produces: `searchProducts()` result gains an optional `didYouMean?: string` field.
- Produces: `SearchParams.brands?: string[]` (added here alongside the did-you-mean refactor since both touch the same function; consumed by Task 6).

- [ ] **Step 1: Write the highlight helper**

Create `components/highlighted-text.tsx`:

```tsx
export function highlightMatches(text: string, query?: string): React.ReactNode {
  if (!query || query.trim().length < 2) return text;

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    part.toLowerCase() === query.trim().toLowerCase() ? (
      <mark key={i} className="rounded-[2px] bg-teal-tint text-teal-dark">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
```

- [ ] **Step 2: Add the `brands` filter param and the did-you-mean suggestion to `searchProducts`**

In `lib/search/index.ts`, add `brands?: string[];` to the `SearchParams` type (next to `categoryIds?: string[];`).

In `buildFilterClauses`, add after the `categoryIds` line:

```ts
  if (params.brands?.length) filters.push(Prisma.sql`brand IN (${Prisma.join(params.brands)})`);
```

(`buildFilterClauses` is shared by the hybrid path, so no separate change is needed there — the brand filter automatically applies to hybrid search too.)

Then restructure so both the hybrid and ILIKE branches funnel through a single return point that attaches `didYouMean` on a zero-result text query. Replace the function body from `export async function searchProducts(params: SearchParams) {` through its closing `}` with:

```ts
export async function searchProducts(params: SearchParams) {
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

async function searchProductsInner(params: SearchParams) {
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
```

(This is the same ILIKE-path body that was already there, renamed to `searchProductsInner` with the new `brands` line added — wrapped by a new outer `searchProducts` that adds the did-you-mean check.)

- [ ] **Step 3: Show the suggestion on the search page**

In `app/(shell)/(storefront)/search/page.tsx`, find:

```tsx
        {sp.q && <span className="text-xs text-ink-3">{results.total} products</span>}
```

Add right after it, still inside the same wrapping `<div>`:

```tsx
        {sp.q && results.total === 0 && "didYouMean" in results && results.didYouMean && (
          <p className="text-xs text-ink-3">
            Did you mean{" "}
            <a href={`/search?q=${encodeURIComponent(results.didYouMean)}`} className="font-semibold text-teal hover:text-teal-dark">
              {results.didYouMean}
            </a>
            ?
          </p>
        )}
```

- [ ] **Step 4: Verify highlighting**

```bash
npm run dev
```

Since `ProductCard` doesn't consume `highlightMatches` until Task 4, verify this function in isolation for now:

```bash
npx tsx -e "
import('./components/highlighted-text').then(() => console.log('module loads OK — full visual check happens in Task 4'));
"
```

- [ ] **Step 5: Verify did-you-mean and brand filtering**

Visit `/search?q=headphonez` (a deliberate near-miss typo of a real seeded product name/brand) — confirm zero results render along with a "Did you mean: ...?" link, and clicking it re-searches with the corrected term and returns real results. Then confirm the existing search flow (e.g. `/search?q=headphones`) still returns results unaffected by the refactor.

- [ ] **Step 6: Commit**

```bash
git add components/highlighted-text.tsx lib/search/index.ts "app/(shell)/(storefront)/search/page.tsx"
git commit -m "Add search did-you-mean suggestion, brands filter param, and result-name highlight helper"
```

---

### Task 4: Quick add-to-cart on grid tiles

**Files:**
- Modify: `components/product-card.tsx`

**Interfaces:**
- Consumes: `addToCartAction` from `@/lib/actions/cart-actions` (already exists, unchanged signature — reads `productId`/`quantity` from `FormData`, defaults quantity to 1 when absent), `NotifyMeForm` (Task 2), `highlightMatches` (Task 3).
- Produces: `ProductCard`'s `highlightQuery?: string` prop, consumed by Task 6 (`ProductResults`).

- [ ] **Step 1: Restructure `ProductCard` so the action row is a sibling of the card's `Link`, not nested inside it**

Replace the full contents of `components/product-card.tsx` with:

```tsx
import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { StarRating } from "@/components/star-rating";
import { WishlistToggle } from "@/components/wishlist-toggle";
import { NotifyMeForm } from "@/components/notify-me-form";
import { addToCartAction } from "@/lib/actions/cart-actions";
import { highlightMatches } from "@/components/highlighted-text";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  stockQuantity: number;
  ratingAvg: number;
  ratingCount: number;
  images: { url: string; altText: string | null }[];
};

export function ProductCard({
  product,
  isWishlisted = false,
  highlightQuery,
}: {
  product: ProductCardData;
  isWishlisted?: boolean;
  highlightQuery?: string;
}) {
  const image = product.images[0];
  const outOfStock = product.stockQuantity <= 0;
  const hasDiscount = product.compareAtPriceCents !== null && product.compareAtPriceCents > product.priceCents;
  const discountPct = hasDiscount
    ? Math.round((1 - product.priceCents / product.compareAtPriceCents!) * 100)
    : 0;

  return (
    <div className="group relative overflow-hidden rounded-[6px] border border-border bg-surface hover:border-[#CBD5E1]">
      <Link href={`/p/${product.slug}`} className="contents">
        <div className="relative aspect-square overflow-hidden bg-surface-muted">
          {image && (
            <Image
              src={image.url}
              alt={image.altText ?? product.name}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          )}
          {outOfStock ? (
            <span className="absolute top-1.5 left-1.5 rounded-[3px] bg-ink px-[5px] py-1 text-[9px] font-bold text-white">
              SOLD OUT
            </span>
          ) : hasDiscount ? (
            <span className="absolute top-1.5 left-1.5 rounded-[3px] bg-danger px-[5px] py-1 text-[9px] font-bold text-white">
              -{discountPct}%
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-[5px] p-[9px] pb-0">
          <p className="line-clamp-2 min-h-[29px] text-[11px] leading-[1.3] font-medium text-[#1e293b]">
            {highlightMatches(product.name, highlightQuery)}
          </p>
          {product.ratingCount > 0 && (
            <StarRating rating={product.ratingAvg} count={product.ratingCount} className="text-[10px] text-ink-3" />
          )}
          <div className="flex items-baseline gap-[5px]">
            <span className="text-[15px] font-extrabold tracking-tight text-ink">{formatMoney(product.priceCents)}</span>
            {hasDiscount && (
              <span className="text-[10px] text-muted-2 line-through">{formatMoney(product.compareAtPriceCents!)}</span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-[9px] pt-[5px]">
        {outOfStock ? (
          <NotifyMeForm productId={product.id} />
        ) : (
          <form action={addToCartAction}>
            <input type="hidden" name="productId" value={product.id} />
            <button
              type="submit"
              className="w-full rounded-[4px] bg-teal py-[7px] text-center text-[10px] font-semibold text-white hover:bg-teal-dark"
            >
              Add to cart
            </button>
          </form>
        )}
      </div>

      <WishlistToggle productId={product.id} isWishlisted={isWishlisted} className="absolute top-2 right-2" />
    </div>
  );
}
```

- [ ] **Step 2: Verify quick add-to-cart end-to-end**

```bash
npm run dev
```

In the browser, go to `/` (Home), find an in-stock product tile, click "Add to cart" directly on the grid (not the product name/image) — confirm the page does NOT navigate to the PDP, and the cart count badge in the header increments. Then visit `/cart` and confirm the item is there. Also find an out-of-stock tile and confirm its notify-me mini-form (from Task 2) renders and works the same as it does on the PDP.

- [ ] **Step 3: Commit**

```bash
git add components/product-card.tsx
git commit -m "Add working quick add-to-cart button to ProductCard grid tiles"
```

---

### Task 5: Buy-now button

**Files:**
- Create: `components/buy-now-button.tsx`
- Modify: `app/(shell)/(storefront)/p/[slug]/page.tsx`

**Interfaces:**
- Consumes: `addToCartAction` from `@/lib/actions/cart-actions` (unchanged).

- [ ] **Step 1: Add a client-side buy-now handler**

`addToCartAction` is a plain form action with no return value to redirect on, so buy-now needs a tiny client component that calls it directly then navigates — same pattern as `CheckoutButton` calling `placeOrderAction`.

Create `components/buy-now-button.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/lib/actions/cart-actions";
import { Button } from "@/components/ui/button";

export function BuyNowButton({ productId, disabled }: { productId: string; disabled: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const formData = new FormData();
    formData.set("productId", productId);
    await addToCartAction(formData);
    router.push("/checkout");
  }

  return (
    <Button type="button" variant="dark" disabled={disabled || pending} onClick={handleClick} className="w-full">
      {pending ? "Adding..." : "Buy now"}
    </Button>
  );
}
```

- [ ] **Step 2: Replace the inert button on the PDP**

In `app/(shell)/(storefront)/p/[slug]/page.tsx`, add the import:

```ts
import { BuyNowButton } from "@/components/buy-now-button";
```

Replace:

```tsx
            <Button type="button" variant="dark" disabled={outOfStock} className="w-full">
              Buy now
            </Button>
```

with:

```tsx
            <BuyNowButton productId={product.id} disabled={outOfStock} />
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Visit any in-stock PDP, click "Buy now" — confirm it lands on `/checkout` with that product (plus anything already in the cart) in the order summary.

- [ ] **Step 4: Commit**

```bash
git add components/buy-now-button.tsx "app/(shell)/(storefront)/p/[slug]/page.tsx"
git commit -m "Wire PDP Buy now button to add-to-cart + redirect to checkout"
```

---

### Task 6: Brand facet

**Files:**
- Modify: `lib/products/queries.ts`
- Modify: `components/product-results.tsx`
- Modify: `app/(shell)/(storefront)/search/page.tsx`
- Modify: `app/(shell)/(storefront)/c/[slug]/page.tsx`

**Interfaces:**
- Consumes: `SearchParams.brands` (Task 3), `highlightMatches` (Task 3, passed through to `ProductCard`'s `highlightQuery` prop from Task 4).
- Produces: `getAvailableBrands(): Promise<string[]>` (used by both pages).

- [ ] **Step 1: Add a query for the list of available brands**

In `lib/products/queries.ts`, add:

```ts
export async function getAvailableBrands() {
  const rows = await prisma.product.findMany({
    where: { status: "ACTIVE", brand: { not: null } },
    select: { brand: true },
    distinct: ["brand"],
    orderBy: { brand: "asc" },
  });
  return rows.map((r) => r.brand!);
}
```

- [ ] **Step 2: Add the brand checkbox facet + chips to `ProductResults`**

In `components/product-results.tsx`, change the props to accept the brand list and treat `brand` as a possibly-multi-valued param:

```ts
export type ResultsSearchParams = {
  q?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock?: string;
  brand?: string | string[];
  page?: string;
};
```

Add a `brands: string[]` prop to `ProductResults`'s params (the full available list, for rendering checkboxes):

```ts
export async function ProductResults({
  basePath,
  searchParams,
  results,
  sort,
  sidebarTop,
  brands,
}: {
  basePath: string;
  searchParams: ResultsSearchParams;
  results: Results;
  sort: SortOption;
  sidebarTop?: React.ReactNode;
  brands: string[];
}) {
```

Right after `const wishlistedIds = ...`, normalize the selected brands to an array:

```ts
  const selectedBrands = Array.isArray(searchParams.brand)
    ? searchParams.brand
    : searchParams.brand
      ? [searchParams.brand]
      : [];
```

Update `buildHref` to serialize array values (repeated `key=value` params, the native HTML multi-checkbox format) instead of only strings:

```ts
  function buildHref(overrides: Record<string, string | string[] | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...searchParams, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (Array.isArray(value)) {
        for (const v of value) if (v) params.append(key, v);
      } else if (value) {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }
```

Add a brand fieldset to the filter form (only render it if there are brands to show), right after the "MINIMUM RATING" fieldset:

```tsx
          {brands.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="text-[11px] font-bold tracking-[0.08em] text-ink">BRAND</legend>
              <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto text-xs text-ink-3">
                {brands.map((brand) => (
                  <label key={brand} className="flex items-center gap-2">
                    <input type="checkbox" name="brand" value={brand} defaultChecked={selectedBrands.includes(brand)} />
                    {brand}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
```

Add brand chips alongside the existing `activeFilters` chips — right after the `activeFilters` computation, add:

```ts
  const brandChips = selectedBrands.map((brand) => ({
    key: `brand-${brand}`,
    text: brand,
    href: buildHref({ brand: selectedBrands.filter((b) => b !== brand), page: undefined }),
  }));
```

Change the existing `activeFilters.map(...)` chip-rendering block to also render `brandChips` (both use the same chip markup, so render them from one combined array). Replace:

```tsx
            {activeFilters.map((filter) => (
              <Link
                key={filter.key}
                href={buildHref({ [filter.key]: undefined, page: undefined })}
                className="rounded-full bg-teal-tint px-[10px] py-[7px] text-[11px] font-semibold text-teal-dark"
              >
                {filter.text} ✕
              </Link>
            ))}
```

with:

```tsx
            {[
              ...activeFilters.map((f) => ({ key: f.key, text: f.text, href: buildHref({ [f.key]: undefined, page: undefined }) })),
              ...brandChips,
            ].map((chip) => (
              <Link
                key={chip.key}
                href={chip.href}
                className="rounded-full bg-teal-tint px-[10px] py-[7px] text-[11px] font-semibold text-teal-dark"
              >
                {chip.text} ✕
              </Link>
            ))}
```

Finally, pass `highlightQuery` through to each card:

```tsx
              <ProductCard key={product.id} product={product} isWishlisted={wishlistedIds.has(product.id)} highlightQuery={searchParams.q} />
```

- [ ] **Step 3: Thread `brands` through both pages**

In `app/(shell)/(storefront)/search/page.tsx`: add `import { getAvailableBrands } from "@/lib/products/queries";`, add `brand?: string | string[];` to `SearchParamsType`, compute `const brands = Array.isArray(sp.brand) ? sp.brand : sp.brand ? [sp.brand] : [];`, pass `brands` into the `searchProducts({...})` call, fetch `const availableBrands = await getAvailableBrands();` before the return, and pass `brands={availableBrands}` to `<ProductResults>`.

In `app/(shell)/(storefront)/c/[slug]/page.tsx`: same changes — add `brand?: string | string[];` to `SearchParamsType`, compute `brands` the same way, pass into `searchProducts({...})`, fetch `getAvailableBrands()`, pass `brands={availableBrands}` to `<ProductResults>`.

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Visit `/search?q=headphones`, check two brand checkboxes, click "Apply filters" — confirm the URL has `brand=X&brand=Y`, results narrow to those brands, and two removable chips appear. Click a chip's ✕ — confirm only that brand is removed, the other stays selected. Repeat on a `/c/[slug]` category page. Also confirm the highlighted product names (Task 3's `highlightMatches`, now wired via Task 4's `ProductCard`) show up correctly in these filtered results.

- [ ] **Step 5: Commit**

```bash
git add lib/products/queries.ts components/product-results.tsx "app/(shell)/(storefront)/search/page.tsx" "app/(shell)/(storefront)/c/[slug]/page.tsx"
git commit -m "Add brand facet with removable filter chips to category/search results"
```

---

### Task 7: PDP specs table

**Files:**
- Modify: `app/(shell)/(storefront)/p/[slug]/page.tsx`

**Interfaces:**
- Consumes: `product.specs` (from `getProductBySlug`, Task 1's schema field — already returned automatically since `specs` is a plain scalar column and `getProductBySlug` uses `include`, which doesn't restrict scalar fields).

- [ ] **Step 1: Render the specs table under the description**

In `app/(shell)/(storefront)/p/[slug]/page.tsx`, add this right after the closing `</div>` of the description/price block (the `<div className="flex flex-col gap-3 rounded-[6px] border border-border bg-surface p-[18px]">` that contains the product title/price/description), before the Reviews section:

```tsx
          {Array.isArray(product.specs) && product.specs.length > 0 && (
            <div className="flex flex-col gap-3 rounded-[6px] border border-border bg-surface p-[18px]">
              <h2 className="text-sm font-bold tracking-tight">Specifications</h2>
              <table className="text-xs">
                <tbody>
                  {(product.specs as { label: string; value: string }[]).map((spec) => (
                    <tr key={spec.label} className="border-b border-border-subtle last:border-0">
                      <td className="py-2 pr-4 font-medium text-ink-3">{spec.label}</td>
                      <td className="py-2 text-ink">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Visit `/p/wireless-noise-cancelling-headphones` (seeded with specs in Task 1) — confirm a "Specifications" card renders with the 4 rows. Visit any other product without specs — confirm no empty/broken card renders.

- [ ] **Step 3: Commit**

```bash
git add "app/(shell)/(storefront)/p/[slug]/page.tsx"
git commit -m "Render PDP specifications table from Product.specs"
```

---

### Task 8: PDP delivery-by-PIN estimate

**Files:**
- Create: `lib/delivery-estimate.ts`
- Create: `components/delivery-estimate-form.tsx`
- Modify: `app/(shell)/(storefront)/p/[slug]/page.tsx`

**Interfaces:**
- Produces: `estimateDelivery(pincode: string): { zone: string; minDays: number; maxDays: number } | null` — pure function, no server round-trip, consumed only by `DeliveryEstimateForm`.

- [ ] **Step 1: Write the pure estimate function**

Create `lib/delivery-estimate.ts`:

```ts
export type DeliveryEstimate = { zone: string; minDays: number; maxDays: number };

// 2-digit PIN-code prefix -> metro zone name. No courier API (YAGNI) - a
// small static table is enough to make the estimate feel real per-PIN
// rather than a single constant string for every input.
const METRO_ZONES: Record<string, string> = {
  "11": "Delhi NCR",
  "40": "Mumbai",
  "41": "Pune",
  "56": "Bengaluru",
  "60": "Chennai",
  "50": "Hyderabad",
  "70": "Kolkata",
  "38": "Ahmedabad",
};

export function estimateDelivery(pincode: string): DeliveryEstimate | null {
  if (!/^\d{6}$/.test(pincode)) return null;

  const prefix = pincode.slice(0, 2);
  const zone = METRO_ZONES[prefix];
  return zone ? { zone, minDays: 2, maxDays: 3 } : { zone: "Rest of India", minDays: 4, maxDays: 6 };
}
```

- [ ] **Step 2: Write the client form**

Create `components/delivery-estimate-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { estimateDelivery, type DeliveryEstimate } from "@/lib/delivery-estimate";

export function DeliveryEstimateForm() {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<DeliveryEstimate | null | "invalid">(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const estimate = estimateDelivery(pincode);
    setResult(estimate ?? "invalid");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-border-subtle pt-3">
      <span className="text-xs font-semibold text-ink">Check delivery estimate</span>
      <div className="flex gap-1.5">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
          placeholder="6-digit PIN code"
          className="w-full rounded-[4px] border border-border px-2.5 py-2 text-xs text-ink outline-none placeholder:text-muted-2 focus-visible:border-[1.5px] focus-visible:border-teal"
        />
        <button
          type="submit"
          className="shrink-0 rounded-[4px] border border-border px-3 py-2 text-xs font-semibold text-ink-3 hover:bg-surface-muted"
        >
          Check
        </button>
      </div>
      {result === "invalid" && <p className="text-[11px] font-medium text-danger">Enter a valid 6-digit PIN code.</p>}
      {result && result !== "invalid" && (
        <p className="text-[11px] text-teal-dark">
          Delivery to {result.zone} in {result.minDays}-{result.maxDays} business days.
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 3: Add it to the PDP buy-box**

In `app/(shell)/(storefront)/p/[slug]/page.tsx`, add the import:

```ts
import { DeliveryEstimateForm } from "@/components/delivery-estimate-form";
```

Add `<DeliveryEstimateForm />` right after the `<WishlistToggle ... />` line, still inside the buy-box `<div>`:

```tsx
            <WishlistToggle productId={product.id} isWishlisted={wishlistedIds.has(product.id)} variant="button" />
            <DeliveryEstimateForm />
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Visit any PDP, enter a 6-digit PIN starting with `11` (e.g. `110001`) — confirm it shows "Delivery to Delhi NCR in 2-3 business days." Enter a non-metro PIN (e.g. `800001`) — confirm "Rest of India in 4-6 business days." Enter fewer than 6 digits — confirm the validation message.

- [ ] **Step 5: Commit**

```bash
git add lib/delivery-estimate.ts components/delivery-estimate-form.tsx "app/(shell)/(storefront)/p/[slug]/page.tsx"
git commit -m "Add PDP delivery-by-PIN estimate"
```

---

## Post-plan verification checklist

- [ ] Grid quick add-to-cart works from Home, Category, and Search pages without navigating to the PDP
- [ ] PDP "Buy now" adds the item and lands on `/checkout`
- [ ] Notify-me (grid card and PDP) stores a `StockNotification` row and sends a real email via Resend
- [ ] Brand facet filters results and shows removable chips independent of other filters
- [ ] Searching a near-miss typo with zero results shows a working "Did you mean" link
- [ ] Search result names highlight the matched query substring; non-search pages are unaffected
- [ ] PDP specs table renders for seeded products with `specs` set, and renders nothing for products without it
- [ ] PDP delivery-by-PIN gives a metro estimate for `11`/`40`/`41`/`56`/`60`/`50`/`70`/`38` prefixes and a "Rest of India" estimate otherwise
- [ ] `npx prisma migrate status` reports up to date, with no unexpected `DROP INDEX "Product_embedding_idx"` ever applied
- [ ] Run the `checkout-walkthrough` skill once more before starting Plan 2, to confirm none of the above regressed the guest-to-paid-order flow

**Next:** once this plan is fully merged, continue with `docs/superpowers/plans/2026-08-03-storefront-functionality-02-cart-checkout.md` (Plan 2 — Cart & Checkout), which depends on the `Coupon` and `Order.shippingMethod` schema added in Task 1 here.
