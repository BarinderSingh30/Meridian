# Dense Teal Redesign — Plan 2: Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the 6 storefront pages (Home, Category, Product Detail, Cart, Search, Checkout) and their shared components to Dense Teal, using Plan 1's tokens/primitives, with zero new Server Actions or schema changes.

**Architecture:** Shared display components (`ProductCard`, `ProductResults`, `Pagination`, `Breadcrumbs`, `ProductGallery`, `ReviewForm`, `WishlistToggle`) get restyled first since all 6 pages compose from them. A new `QuantityStepper` client primitive replaces raw `<input type="number">` quantity fields on PDP and Cart. Pages then get restyled individually, each keeping its existing data-fetching calls unchanged (same query functions, same arguments, with two narrow exceptions noted in Global Constraints).

**Tech Stack:** Next.js 16 Server Components, Tailwind v4 (Dense Teal tokens from Plan 1), `@base-ui/react` primitives, Prisma (read-only, no schema changes).

## Global Constraints

- Builds on Plan 1 — `app/globals.css` tokens, `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/status-pill.tsx`, `components/ui/empty-state.tsx` already exist. Do not recreate them.
- No new Server Actions, API routes, or schema changes. Two narrow, deliberate exceptions to "data-fetching as-is," both justified below — no other query changes are in scope:
  - **`getFeaturedProducts`/`getNewArrivals` call sites on Home**: argument changed from `8` to `6` to match the design's 6-per-row grid. Same function, same shape, different `limit` value — not a new query.
  - **PDP uses `product.brand` and `product.sku`**: `getProductBySlug` in `lib/products/queries.ts` uses Prisma `include` (not `select`), which already returns every scalar column on `Product` — `brand` and `sku` are already present in the object today, just unused by the current page. No query change is needed to use them on the Product Detail page.
  - Grid cards (`ProductCard`) do NOT get a brand eyebrow, because `listItemSelect` in `lib/products/queries.ts` (used by `getFeaturedProducts`/`getNewArrivals`/`getRelatedProducts`) and the equivalent selects in `lib/search.ts`/`lib/wishlist.ts` explicitly restrict fields and don't include `brand`. Widening 4+ separate query selects to backfill a decorative label is real data-fetching-shape work, not markup — out of scope for this plan.
- No test runner in this project (see Plan 1's Global Constraints for detail) — verification per task is `npx tsc --noEmit`, `npm run lint`, and a real browser screenshot comparison against `design_handoff_meridian_dense_teal/screenshots/`.
- **Deviations from the design (fabricated-content guardrail):** the design mockup's placeholder copy includes numbers/claims/UI that don't correspond to real capability in this codebase. Per the approved spec, these render as their *real* equivalent or are omitted — never as fabricated data:
  - Home hero's "Bank offer" trust card (a specific "10% HDFC discount") is replaced with a generic "Secure payments" card — there is no real bank-offer system.
  - Home's 3 bottom promo cards ("New arrivals" / "Under ₹999" / "Highest rated") keep their card treatment but their body copy avoids invented stats (no fake "240 products added this week"), and — since none of the three map to a real distinct route (no price-band or top-rated filter route exists yet) — they render as plain, non-interactive cards. They are visually present per the design but carry no `href`.
  - Home's "Featured / Newest / Best rated" tab row above the deals grid: only "Featured" reflects the real query; "Newest" and "Best rated" render as plain muted (non-interactive) text since there's no alternate sort wired for that section.
  - Category grid tiles do not show a product-count badge (e.g. "15") — no count is fetched (see exceptions above).
  - PDP's "Delivery by Wed, 5 Aug to 560001" line is omitted — there's no real delivery-estimate/PIN-lookup capability; showing a fabricated date+location is actively misleading, not just an inert control.
  - PDP's "EMI from ₹1,289/month" and the Specifications table are omitted entirely — no EMI provider integration and no product-specs data model exist. A data table with invented values would misrepresent the actual product, which is different from an inert *button*; showing it isn't an option.
  - PDP's "Buy now" button and Cart's "Have a coupon?" field render **present but inert** (per the approved spec decision) — visible, styled, and a no-op on click, since neither has backing logic yet.
  - Cart's "Clear cart" action and "Frequently bought together" cross-sell row are omitted — no clear-cart action and no product-recommendation query exist; inventing either would mean fabricating either behavior or product suggestions.
  - Cart and Checkout order summaries show **Subtotal → Shipping → Total** only — no Discount/GST line items, because there is no coupon system and shipping/tax are not actually split out anywhere in the codebase (`calculateShippingCents` returns one flat number). Showing invented GST math would be a fabricated calculation, not a styling change.
  - Checkout's 4-step wizard progress header, delivery-speed radios (Standard vs. Express), inline payment-method tabs (UPI/Card/Net banking/COD), and the PIN-code error demo are all omitted. Checkout in this app is one page, not a multi-step flow; payment actually happens through the real Razorpay modal (`CheckoutButton`), not inline tabs; there is no alternate delivery speed or per-field validation wired up. Rendering any of these would show fake progress/choices that don't drive real behavior.
  - PDP's "1-year warranty" trust-card claim is replaced with "Secure payments" (matching the real payment-methods promise already made in the footer) — there's no tracked warranty program to honor that claim.

  Rationale in one line: an *inert control* (a button that does nothing yet) is fine per the approved spec; a *fabricated fact* (a date, a discount mechanism, a tax breakdown, a spec value) is not — the first is "not built yet," the second is "not true."

## File structure

- `components/ui/quantity-stepper.tsx` — **new**. Client component, `+`/`−` buttons around a number input.
- `components/product-card.tsx` — modify. Discount/sold-out badges, inert quick-add pill.
- `components/wishlist-toggle.tsx` — modify. Adds `variant: "icon" | "button"`.
- `components/pagination.tsx` — modify. Numbered page links.
- `components/breadcrumbs.tsx` — modify. Token colors only.
- `components/product-results.tsx` — modify. Restyled facet sidebar (+ optional `sidebarTop` slot), active-filter chips, restyled grid/sort/pagination.
- `components/review-form.tsx` — modify. Token colors only.
- `components/product-gallery.tsx` — modify. Card wrapper, active-thumbnail border color.
- `app/(shell)/(storefront)/page.tsx` — modify. Home.
- `app/(shell)/(storefront)/c/[slug]/page.tsx` — modify. Category (passes subcategory list into `ProductResults`' new `sidebarTop` slot).
- `app/(shell)/(storefront)/search/page.tsx` — modify. Search.
- `app/(shell)/(storefront)/p/[slug]/page.tsx` — modify. Product Detail.
- `app/(shell)/(storefront)/cart/page.tsx` — modify. Cart.
- `app/(shell)/(storefront)/checkout/page.tsx` — modify. Checkout.
- `components/star-rating.tsx`, `components/rating-distribution.tsx` — **untouched**. Both already use literal Tailwind colors (`amber-500`) that render correctly against the new tokens; no change needed.
- `components/checkout-button.tsx` — **untouched**. Already composes `Button` (restyled in Plan 1) and `text-destructive` (already mapped to Dense Teal's danger red); nothing left to change.

---

### Task 1: Add `QuantityStepper` primitive

**Files:**
- Create: `components/ui/quantity-stepper.tsx`

**Interfaces:**
- Produces: `QuantityStepper` client component — props `{ name: string; defaultValue?: number; min?: number; max?: number; disabled?: boolean; className?: string }`. Renders a bordered `−`/number/`+` control; the number input carries the given `name`, so it submits inside a surrounding `<form>` exactly like a raw `<input type="number">` did before. Consumed by Task 11 (PDP) and Task 12 (Cart).

- [ ] **Step 1: Create the component**

```tsx
"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

function QuantityStepper({
  name,
  defaultValue = 1,
  min = 1,
  max,
  disabled = false,
  className,
}: {
  name: string
  defaultValue?: number
  min?: number
  max?: number
  disabled?: boolean
  className?: string
}) {
  const [value, setValue] = useState(defaultValue)

  function clamp(next: number) {
    let clamped = Math.max(min, next)
    if (max !== undefined) clamped = Math.min(max, clamped)
    return clamped
  }

  return (
    <div
      className={cn(
        "flex items-center overflow-hidden rounded-[5px] border border-border",
        disabled && "opacity-50",
        className
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setValue((v) => clamp(v - 1))}
        className="px-3 py-2 text-sm font-semibold text-ink-3 hover:bg-surface-muted disabled:pointer-events-none"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        name={name}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => setValue(clamp(Number(e.target.value) || min))}
        className="w-10 border-x border-border py-2 text-center text-sm font-semibold text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setValue((v) => clamp(v + 1))}
        className="px-3 py-2 text-sm font-semibold text-ink-3 hover:bg-surface-muted disabled:pointer-events-none"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}

export { QuantityStepper }
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no new errors (no render site yet — this is infrastructure, consumed starting Task 11).

- [ ] **Step 3: Commit**

```bash
git add components/ui/quantity-stepper.tsx
git commit -m "Add QuantityStepper primitive"
```

---

### Task 2: Restyle `ProductCard` and `WishlistToggle`

**Files:**
- Modify: `components/product-card.tsx`
- Modify: `components/wishlist-toggle.tsx`

**Interfaces:**
- `ProductCard`: same props as before (`product: ProductCardData`, `isWishlisted?: boolean`) — no signature change, only markup/styling. Computes `hasDiscount`/`discountPct` from already-present `compareAtPriceCents`/`priceCents` fields (no new data).
- `WishlistToggle`: adds `variant?: "icon" | "button"` (defaults to `"icon"`, matching current grid-card usage everywhere it's already called without a variant). `"button"` variant is a new, real, functional full-width toggle button (same `toggleWishlistAction`) — first consumer is Task 11 (PDP buy box).

Reference: `design_handoff_meridian_dense_teal/02 Category.dc.html` (grid tile markup — identical tile style is reused by Home/Search/Wishlist).

- [ ] **Step 1: Replace `components/product-card.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { StarRating } from "@/components/star-rating";
import { WishlistToggle } from "@/components/wishlist-toggle";

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
}: {
  product: ProductCardData;
  isWishlisted?: boolean;
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

        <div className="flex flex-col gap-[5px] p-[9px]">
          <p className="line-clamp-2 min-h-[29px] text-[11px] leading-[1.3] font-medium text-[#1e293b]">
            {product.name}
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
          {outOfStock ? (
            <span className="rounded-[4px] border border-border py-1.5 text-center text-[10px] font-semibold text-muted-2">
              Notify me
            </span>
          ) : (
            <span className="rounded-[4px] bg-teal py-[7px] text-center text-[10px] font-semibold text-white">
              Add to cart
            </span>
          )}
        </div>
      </Link>

      <WishlistToggle productId={product.id} isWishlisted={isWishlisted} className="absolute top-2 right-2" />
    </div>
  );
}
```

- [ ] **Step 2: Replace `components/wishlist-toggle.tsx`**

```tsx
import { toggleWishlistAction } from "@/lib/actions/wishlist-actions";
import { cn } from "@/lib/utils";

export function WishlistToggle({
  productId,
  isWishlisted,
  variant = "icon",
  className,
}: {
  productId: string;
  isWishlisted: boolean;
  variant?: "icon" | "button";
  className?: string;
}) {
  return (
    <form action={toggleWishlistAction} className={className}>
      <input type="hidden" name="productId" value={productId} />
      {variant === "icon" ? (
        <button
          type="submit"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          className={cn(
            "flex size-[22px] items-center justify-center rounded-full bg-surface text-sm leading-none hover:bg-surface-muted",
            isWishlisted ? "text-danger" : "text-ink-3"
          )}
        >
          {isWishlisted ? "♥" : "♡"}
        </button>
      ) : (
        <button
          type="submit"
          aria-pressed={isWishlisted}
          className="w-full rounded-[5px] border border-border py-[11px] text-xs font-semibold text-ink-3 hover:bg-surface-muted"
        >
          {isWishlisted ? "♥ Saved to wishlist" : "♡ Save to wishlist"}
        </button>
      )}
    </form>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no new errors — `components/admin/product-form.tsx` and any other `ProductCard`/`WishlistToggle` call sites (Home, Wishlist page from Plan 1) must still typecheck since only styling changed, no prop removed.

Browser check: reload `/` — grid tiles should show the new border/badge/pill treatment. Click a wishlist heart icon on a product tile and confirm it still toggles (regression check on real `toggleWishlistAction`).

- [ ] **Step 4: Commit**

```bash
git add components/product-card.tsx components/wishlist-toggle.tsx
git commit -m "Restyle ProductCard and add WishlistToggle button variant"
```

---

### Task 3: Restyle `Pagination` with numbered pages

**Files:**
- Modify: `components/pagination.tsx`

**Interfaces:**
- Same props (`page`, `totalPages`, `buildHref`). Now renders a numbered link per page (1..totalPages) instead of just Prev/"Page X of Y"/Next — still built entirely from the `page`/`totalPages` numbers already computed by callers, no new data.

- [ ] **Step 1: Replace the file**

```tsx
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between rounded-[6px] border border-border bg-surface px-[14px] py-[11px] text-xs text-ink-3"
    >
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-[5px] text-xs font-semibold">
        <PageLink page={page - 1} disabled={page <= 1} buildHref={buildHref}>
          Prev
        </PageLink>
        {pages.map((p) => (
          <Link
            key={p}
            href={buildHref(p)}
            className={cn(
              "rounded-[4px] px-3 py-2",
              p === page ? "bg-chrome-deep text-white" : "border border-border text-ink-3 hover:bg-surface-muted"
            )}
          >
            {p}
          </Link>
        ))}
        <PageLink page={page + 1} disabled={page >= totalPages} buildHref={buildHref}>
          Next
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  page,
  disabled,
  buildHref,
  children,
}: {
  page: number;
  disabled: boolean;
  buildHref: (page: number) => string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="rounded-[4px] border border-border px-3 py-2 text-muted-2">{children}</span>;
  }
  return (
    <Link href={buildHref(page)} className="rounded-[4px] border border-border px-3 py-2 text-ink-3 hover:bg-surface-muted">
      {children}
    </Link>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/pagination.tsx
git commit -m "Restyle Pagination with numbered page links"
```

---

### Task 4: Restyle `Breadcrumbs`

**Files:**
- Modify: `components/breadcrumbs.tsx`

- [ ] **Step 1: Replace the file**

```tsx
import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[11px] text-muted-2">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-teal">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-ink" : undefined} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/breadcrumbs.tsx
git commit -m "Restyle Breadcrumbs to Dense Teal tokens"
```

---

### Task 5: Restyle `ProductResults` (facet sidebar, active-filter chips, sort, grid)

**Files:**
- Modify: `components/product-results.tsx`

**Interfaces:**
- Adds one new optional prop: `sidebarTop?: React.ReactNode`, rendered above the Price facet inside the same `<form>`. First consumer: Task 9 (Category page, passing its subcategory list). Search (Task 10) passes nothing.
- Adds real, working **active-filter chips**: computed directly from `searchParams` (`inStock`, `minPrice`, `maxPrice`, `minRating`) already passed into this component — each chip links to `buildHref` with that one param cleared. This is genuine working functionality (not the deferred kind), since it only reads/writes query params the page already fully supports.
- Rating facet changes from a `<select>` to radio buttons (`4★ & up` / `3★ & up` / `Any`) — same `minRating` semantics, submitted the same way (via the existing "Apply filters" submit, not on-change, matching the design's documented interaction rule).
- Adds a real "Clear" link (plain link to `basePath` with no query params — clears all filters).
- Grid goes from `grid-cols-2 sm:grid-cols-3` (max 3/row) to `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (4/row at desktop, matching the design).

Reference: `design_handoff_meridian_dense_teal/02 Category.dc.html` (sidebar + filter bar + grid), `design_handoff_meridian_dense_teal/05 Search Results.dc.html` (same components, no subcategory facet).

- [ ] **Step 1: Replace the file**

```tsx
import Link from "next/link";
import type { SortOption, searchProducts } from "@/lib/search";
import { getWishlistedProductIds } from "@/lib/wishlist";
import { ProductCard } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";

export type ResultsSearchParams = {
  q?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock?: string;
  page?: string;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "rating", label: "Avg. rating" },
];

const ACTIVE_FILTER_LABELS: { key: keyof ResultsSearchParams; label: (value: string) => string }[] = [
  { key: "inStock", label: () => "In stock only" },
  { key: "minPrice", label: (v) => `Min ₹${v}` },
  { key: "maxPrice", label: (v) => `Max ₹${v}` },
  { key: "minRating", label: (v) => `${v}★ & up` },
];

type Results = Awaited<ReturnType<typeof searchProducts>>;

export async function ProductResults({
  basePath,
  searchParams,
  results,
  sort,
  sidebarTop,
}: {
  basePath: string;
  searchParams: ResultsSearchParams;
  results: Results;
  sort: SortOption;
  sidebarTop?: React.ReactNode;
}) {
  const wishlistedIds = await getWishlistedProductIds();

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...searchParams, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }

  const activeFilters = ACTIVE_FILTER_LABELS.filter(({ key }) => searchParams[key]).map(({ key, label }) => ({
    key,
    text: label(searchParams[key]!),
  }));

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-3">
        <form
          action={basePath}
          method="GET"
          className="flex flex-col gap-4 rounded-[6px] border border-border bg-surface p-[14px]"
        >
          {searchParams.q !== undefined && <input type="hidden" name="q" value={searchParams.q} />}
          <input type="hidden" name="sort" value={searchParams.sort ?? ""} />

          {sidebarTop}

          <fieldset className="flex flex-col gap-2">
            <legend className="text-[11px] font-bold tracking-[0.08em] text-ink">PRICE</legend>
            <div className="flex items-center gap-1.5">
              <label className="sr-only" htmlFor="minPrice">
                Minimum price
              </label>
              <input
                id="minPrice"
                type="number"
                name="minPrice"
                placeholder="Min"
                defaultValue={searchParams.minPrice}
                min={0}
                className="w-full rounded-[4px] border border-border px-2 py-2 text-[11px] text-ink placeholder:text-muted-2 outline-none focus-visible:border-[1.5px] focus-visible:border-teal"
              />
              <span className="text-muted-2" aria-hidden="true">
                &mdash;
              </span>
              <label className="sr-only" htmlFor="maxPrice">
                Maximum price
              </label>
              <input
                id="maxPrice"
                type="number"
                name="maxPrice"
                placeholder="Max"
                defaultValue={searchParams.maxPrice}
                min={0}
                className="w-full rounded-[4px] border border-border px-2 py-2 text-[11px] text-ink placeholder:text-muted-2 outline-none focus-visible:border-[1.5px] focus-visible:border-teal"
              />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-[11px] font-bold tracking-[0.08em] text-ink">MINIMUM RATING</legend>
            <div className="flex flex-col gap-[7px] text-xs text-ink-3">
              {[4, 3].map((n) => (
                <label key={n} className="flex items-center gap-2">
                  <input type="radio" name="minRating" value={n} defaultChecked={searchParams.minRating === String(n)} />
                  {n}★ &amp; up
                </label>
              ))}
              <label className="flex items-center gap-2">
                <input type="radio" name="minRating" value="" defaultChecked={!searchParams.minRating} />
                Any
              </label>
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-xs text-ink-3">
            <input type="checkbox" name="inStock" value="1" defaultChecked={searchParams.inStock === "1"} />
            In stock only
          </label>

          <div className="flex gap-1.5">
            <Button type="submit" size="sm" className="flex-1">
              Apply filters
            </Button>
            <Link href={basePath}>
              <Button type="button" variant="outline" size="sm">
                Clear
              </Button>
            </Link>
          </div>
        </form>
      </aside>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-border bg-surface px-[14px] py-[9px]">
          <div className="flex flex-wrap gap-1.5">
            {activeFilters.map((filter) => (
              <Link
                key={filter.key}
                href={buildHref({ [filter.key]: undefined, page: undefined })}
                className="rounded-full bg-teal-tint px-[10px] py-[7px] text-[11px] font-semibold text-teal-dark"
              >
                {filter.text} ✕
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3.5 text-xs font-medium text-ink-3">
            <span className="text-muted-2">Sort:</span>
            {SORT_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={buildHref({ sort: option.value === "relevance" ? undefined : option.value, page: undefined })}
                className={sort === option.value ? "font-bold text-teal" : "hover:text-ink"}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        {results.products.length === 0 ? (
          <p className="rounded-[6px] border border-border bg-surface py-16 text-center text-sm text-ink-3">
            No products match these filters.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-[10px] md:grid-cols-3 lg:grid-cols-4">
            {results.products.map((product) => (
              <ProductCard key={product.id} product={product} isWishlisted={wishlistedIds.has(product.id)} />
            ))}
          </div>
        )}

        <Pagination
          page={results.page}
          totalPages={results.totalPages}
          buildHref={(p) => buildHref({ page: p === 1 ? undefined : String(p) })}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/product-results.tsx
git commit -m "Restyle ProductResults: facet sidebar, active-filter chips, 4-col grid"
```

---

### Task 6: Restyle `ReviewForm`

**Files:**
- Modify: `components/review-form.tsx`

- [ ] **Step 1: Replace the file**

```tsx
import { submitReviewAction, deleteReviewAction } from "@/lib/actions/review-actions";
import { Button } from "@/components/ui/button";

export function ReviewForm({
  productId,
  slug,
  existing,
}: {
  productId: string;
  slug: string;
  existing?: { rating: number; title: string | null; body: string } | null;
}) {
  return (
    <div className="rounded-[5px] border border-border-subtle bg-surface-muted p-3.5">
      <h3 className="text-xs font-bold text-ink">{existing ? "Edit your review" : "Write a review"}</h3>
      <form action={submitReviewAction} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="slug" value={slug} />

        <label className="block text-xs">
          <span className="mb-1 block font-medium text-ink-3">Rating</span>
          <select
            name="rating"
            defaultValue={existing?.rating ?? 5}
            required
            className="rounded-[5px] border border-border bg-surface px-2.5 py-2 text-xs text-ink outline-none focus-visible:border-[1.5px] focus-visible:border-teal"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs">
          <span className="mb-1 block font-medium text-ink-3">Title (optional)</span>
          <input
            type="text"
            name="title"
            defaultValue={existing?.title ?? ""}
            className="w-full rounded-[5px] border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus-visible:border-[1.5px] focus-visible:border-teal"
          />
        </label>

        <label className="block text-xs">
          <span className="mb-1 block font-medium text-ink-3">Review</span>
          <textarea
            name="body"
            required
            rows={3}
            defaultValue={existing?.body ?? ""}
            className="w-full rounded-[5px] border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus-visible:border-[1.5px] focus-visible:border-teal"
          />
        </label>

        <div className="flex gap-2">
          <Button type="submit" size="sm">
            {existing ? "Update review" : "Post review"}
          </Button>
        </div>
      </form>

      {existing && (
        <form action={deleteReviewAction} className="mt-2">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="slug" value={slug} />
          <Button type="submit" variant="ghost" size="sm">
            Delete review
          </Button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/review-form.tsx
git commit -m "Restyle ReviewForm to Dense Teal tokens"
```

---

### Task 7: Restyle `ProductGallery`

**Files:**
- Modify: `components/product-gallery.tsx`

- [ ] **Step 1: Replace the file**

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  productName,
}: {
  images: { url: string; altText: string | null }[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  return (
    <div className="flex flex-col gap-2.5 rounded-[6px] border border-border bg-surface p-3">
      <div className="relative aspect-square overflow-hidden rounded-[4px] bg-surface-muted">
        {active && (
          <Image
            src={active.url}
            alt={active.altText ?? productName}
            fill
            sizes="(min-width: 1024px) 40vw, 90vw"
            priority
            className="object-cover"
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={image.url + index}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-pressed={index === activeIndex}
              className={cn(
                "relative aspect-square overflow-hidden rounded-[4px] border-2",
                index === activeIndex ? "border-teal" : "border-border"
              )}
            >
              <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/product-gallery.tsx
git commit -m "Restyle ProductGallery to Dense Teal tokens"
```

---

### Task 8: Restyle Home page

**Files:**
- Modify: `app/(shell)/(storefront)/page.tsx`

Reference: `design_handoff_meridian_dense_teal/01 Home.dc.html`, `screenshots/01 Home.png`.

- [ ] **Step 1: Replace the file**

```tsx
import Link from "next/link";
import Image from "next/image";
import { getTopLevelCategories } from "@/lib/categories/queries";
import { getFeaturedProducts, getNewArrivals } from "@/lib/products/queries";
import { getWishlistedProductIds } from "@/lib/wishlist";
import { ProductCard } from "@/components/product-card";

export default async function HomePage() {
  const [categories, featured, newArrivals, wishlistedIds] = await Promise.all([
    getTopLevelCategories(),
    getFeaturedProducts(6),
    getNewArrivals(6),
    getWishlistedProductIds(),
  ]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_300px]">
        <div className="flex min-h-[210px] flex-col justify-center gap-3 rounded-[6px] bg-chrome-deep px-8 py-[30px] text-white">
          <span className="text-[10px] font-bold tracking-[0.14em] text-teal-bright">MERIDIAN MARKETPLACE</span>
          <h1 className="max-w-[16ch] text-[38px] leading-[1.03] font-extrabold tracking-tight">
            Everything you need, shipped fast.
          </h1>
          <p className="max-w-[46ch] text-sm leading-relaxed text-[#a8bcc2]">
            Shop electronics, home goods, books, and more — all in one place.
          </p>
          <div className="mt-1.5 flex gap-2">
            <a href="#deals-of-the-day" className="rounded-[5px] bg-teal-bright px-5 py-3 text-xs font-bold text-[#06251f]">
              Shop deals
            </a>
            <a
              href="#shop-by-category"
              className="rounded-[5px] border border-[#2f4b55] px-5 py-3 text-xs font-semibold text-white"
            >
              Browse all categories
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <TrustCard title="Secure payments" body="Visa, Mastercard, UPI and net banking, all encrypted." />
          <TrustCard title="7-day returns" body="No-questions returns on every eligible order." />
          <TrustCard title="Track your order" body="Live updates from dispatch to doorstep." />
        </div>
      </div>

      <section id="shop-by-category" className="rounded-[6px] border border-border bg-surface p-4">
        <h2 className="mb-3 text-base font-bold tracking-tight">Shop by category</h2>
        <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/c/${category.slug}`}
              className="overflow-hidden rounded-[6px] border border-border hover:border-[#CBD5E1]"
            >
              <div className="relative aspect-[4/3] bg-surface-muted">
                {category.imageUrl && (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    sizes="(min-width: 1024px) 20vw, 33vw"
                    className="object-cover"
                  />
                )}
              </div>
              <p className="px-2.5 py-2 text-xs font-semibold">{category.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section id="deals-of-the-day" className="rounded-[6px] border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight">Deals of the day</h2>
            <div className="flex gap-3.5 text-xs font-medium">
              <span className="font-bold text-teal">Featured</span>
              <span className="text-muted-2">Newest</span>
              <span className="text-muted-2">Best rated</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} isWishlisted={wishlistedIds.has(product.id)} />
            ))}
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="rounded-[6px] border border-border bg-surface p-4">
          <h2 className="mb-3 text-base font-bold tracking-tight">New arrivals</h2>
          <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} isWishlisted={wishlistedIds.has(product.id)} />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PromoCard title="New arrivals" body="Explore the latest additions across Electronics and Home." />
        <PromoCard title="Everyday essentials" body="Grocery top-ups, stationery and home basics." />
        <PromoCard title="Highest rated" body="Products rated highly by verified buyers." />
      </div>
    </div>
  );
}

function TrustCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-1 rounded-[6px] border border-border bg-surface px-4 py-3.5">
      <span className="text-[13px] font-bold">{title}</span>
      <span className="text-[11px] leading-relaxed text-ink-3">{body}</span>
    </div>
  );
}

function PromoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[6px] border border-border bg-surface p-4">
      <span className="text-[13px] font-bold">{title}</span>
      <span className="text-xs leading-relaxed text-ink-3">{body}</span>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no new errors.

Browser check: reload `/`. Compare against `design_handoff_meridian_dense_teal/screenshots/01 Home.png` — dark hero with two buttons, 3 trust cards, category grid (5/row), deals grid (6/row), a second "New arrivals" grid (6/row, additional vs. the mockup — real functionality kept), 3 promo cards. Click "Shop deals" and confirm it scroll-jumps to the deals section; click a category tile and confirm it navigates to `/c/[slug]`.

- [ ] **Step 3: Commit**

```bash
git add "app/(shell)/(storefront)/page.tsx"
git commit -m "Restyle Home page to Dense Teal"
```

---

### Task 9: Restyle Category page

**Files:**
- Modify: `app/(shell)/(storefront)/c/[slug]/page.tsx`

Reference: `design_handoff_meridian_dense_teal/02 Category.dc.html`, `screenshots/02 Category.png`.

- [ ] **Step 1: Replace the file**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryAncestors, getCategoryBySlug } from "@/lib/categories/queries";
import { searchProducts, type SortOption } from "@/lib/search";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { jsonLdScriptProps } from "@/lib/json-ld";
import { ProductResults } from "@/components/product-results";

type Params = Promise<{ slug: string }>;
type SearchParamsType = Promise<{
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock?: string;
  page?: string;
}>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: `Shop ${category.name} at Meridian.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParamsType;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const ancestors = await getCategoryAncestors(category);
  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  const sort = (sp.sort as SortOption) ?? "relevance";
  const page = sp.page ? Math.max(1, Number(sp.page) || 1) : 1;
  const minPriceCents = sp.minPrice ? Math.round(Number(sp.minPrice) * 100) : undefined;
  const maxPriceCents = sp.maxPrice ? Math.round(Number(sp.maxPrice) * 100) : undefined;
  const minRating = sp.minRating ? Number(sp.minRating) : undefined;
  const inStockOnly = sp.inStock === "1";

  const results = await searchProducts({
    categoryIds,
    sort,
    page,
    minPriceCents,
    maxPriceCents,
    minRating,
    inStockOnly,
  });

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    ...ancestors.map((a) => ({ label: a.name, href: `/c/${a.slug}` })),
    { label: category.name },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  };

  const subcategoryFacet = category.children.length > 0 && (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-bold tracking-[0.08em] text-ink">SUBCATEGORY</span>
      <div className="flex flex-col gap-1.5 text-xs text-ink-3">
        <Link href={`/c/${category.slug}`} className="font-semibold text-teal">
          All {category.name}
        </Link>
        {category.children.map((child) => (
          <Link key={child.id} href={`/c/${child.slug}`} className="hover:text-ink">
            {child.name}
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 p-3">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(jsonLd)} />

      <div className="flex flex-col gap-2 rounded-[6px] border border-border bg-surface px-4 py-3.5">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">{category.name}</h1>
          <span className="text-xs text-ink-3">
            {results.total} products · showing {(results.page - 1) * results.perPage + 1}–
            {Math.min(results.page * results.perPage, results.total)}
          </span>
        </div>
      </div>

      <ProductResults
        basePath={`/c/${slug}`}
        searchParams={sp}
        results={results}
        sort={sort}
        sidebarTop={subcategoryFacet || undefined}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no new errors.

Browser check: visit a category with subcategories (e.g. `/c/electronics`). Compare against `design_handoff_meridian_dense_teal/screenshots/02 Category.png` — header card with breadcrumb/title/count, sidebar with subcategory list + price + rating + in-stock facets, 4-col grid, numbered pagination if >1 page. Apply a filter (e.g. check "In stock only" and submit) and confirm the URL updates and an active-filter chip appears with a working ✕ remove link.

- [ ] **Step 3: Commit**

```bash
git add "app/(shell)/(storefront)/c/[slug]/page.tsx"
git commit -m "Restyle Category page to Dense Teal"
```

---

### Task 10: Restyle Search page

**Files:**
- Modify: `app/(shell)/(storefront)/search/page.tsx`

Reference: `design_handoff_meridian_dense_teal/05 Search Results.dc.html`, `screenshots/05 Search Results.png`. Note: the "did you mean" suggestion and `<mark>` term-highlighting shown in the mockup are deferred — there's no spelling-correction or term-matching logic to compute them from.

- [ ] **Step 1: Replace the file**

```tsx
import type { Metadata } from "next";
import { searchProducts, type SortOption } from "@/lib/search";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductResults } from "@/components/product-results";

type SearchParamsType = Promise<{
  q?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock?: string;
  page?: string;
}>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParamsType }): Promise<Metadata> {
  const sp = await searchParams;
  return {
    title: sp.q ? `Search results for "${sp.q}"` : "Search",
  };
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParamsType }) {
  const sp = await searchParams;

  const sort = (sp.sort as SortOption) ?? "relevance";
  const page = sp.page ? Math.max(1, Number(sp.page) || 1) : 1;
  const minPriceCents = sp.minPrice ? Math.round(Number(sp.minPrice) * 100) : undefined;
  const maxPriceCents = sp.maxPrice ? Math.round(Number(sp.maxPrice) * 100) : undefined;
  const minRating = sp.minRating ? Number(sp.minRating) : undefined;
  const inStockOnly = sp.inStock === "1";

  const results = sp.q
    ? await searchProducts({
        q: sp.q,
        sort,
        page,
        minPriceCents,
        maxPriceCents,
        minRating,
        inStockOnly,
      })
    : { products: [], total: 0, page: 1, perPage: 24, totalPages: 1 };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex flex-col gap-1 rounded-[6px] border border-border bg-surface px-4 py-3.5">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
        <h1 className="mt-1 text-xl font-extrabold tracking-tight">{sp.q ? `Results for "${sp.q}"` : "Search"}</h1>
        {sp.q && <span className="text-xs text-ink-3">{results.total} products</span>}
      </div>

      {sp.q ? (
        <ProductResults basePath="/search" searchParams={sp} results={results} sort={sort} />
      ) : (
        <p className="rounded-[6px] border border-border bg-surface py-16 text-center text-sm text-ink-3">
          Enter a search term above to find products.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no new errors.

Browser check: visit `/search?q=camera`. Compare against the design screenshot's grid/sidebar/sort treatment (chip highlighting and "did you mean" intentionally absent, per the note above).

- [ ] **Step 3: Commit**

```bash
git add "app/(shell)/(storefront)/search/page.tsx"
git commit -m "Restyle Search page to Dense Teal"
```

---

### Task 11: Restyle Product Detail page

**Files:**
- Modify: `app/(shell)/(storefront)/p/[slug]/page.tsx`

**Interfaces:**
- Consumes: `QuantityStepper` (Task 1), restyled `ProductCard`/`WishlistToggle` (Task 2, using `variant="button"` in the buy box), restyled `ProductGallery` (Task 7), restyled `Breadcrumbs`/`ReviewForm`.

Reference: `design_handoff_meridian_dense_teal/03 Product Detail.dc.html`, `screenshots/03 Product Detail.png`. Specifications table, delivery-by-PIN line, and EMI line are omitted per the Global Constraints fabricated-content guardrail. "Buy now" renders present-but-inert.

- [ ] **Step 1: Replace the file**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/lib/products/queries";
import { getCategoryAncestors } from "@/lib/categories/queries";
import { formatMoney } from "@/lib/money";
import { jsonLdScriptProps } from "@/lib/json-ld";
import { addToCartAction } from "@/lib/actions/cart-actions";
import { getWishlistedProductIds } from "@/lib/wishlist";
import { getRatingDistribution, getMyReview } from "@/lib/reviews";
import { auth } from "@/lib/auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { StarRating } from "@/components/star-rating";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { WishlistToggle } from "@/components/wishlist-toggle";
import { RatingDistribution } from "@/components/rating-distribution";
import { ReviewForm } from "@/components/review-form";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Button } from "@/components/ui/button";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: product.images[0] ? { images: [product.images[0].url] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const session = await auth();
  const [ancestors, related, wishlistedIds, ratingDistribution, myReview] = await Promise.all([
    getCategoryAncestors(product.category),
    getRelatedProducts(product.category.id, product.id),
    getWishlistedProductIds(),
    getRatingDistribution(product.id),
    session?.user?.id ? getMyReview(session.user.id, product.id) : Promise.resolve(null),
  ]);

  const outOfStock = product.stockQuantity <= 0;
  const hasDiscount = product.compareAtPriceCents !== null && product.compareAtPriceCents > product.priceCents;
  const discountPct = hasDiscount
    ? Math.round((1 - product.priceCents / product.compareAtPriceCents!) * 100)
    : 0;

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    ...ancestors.map((a) => ({ label: a.name, href: `/c/${a.slug}` })),
    { label: product.category.name, href: `/c/${product.category.slug}` },
    { label: product.name },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.priceCents / 100).toFixed(2),
      availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg.toFixed(1),
            reviewCount: product.ratingCount,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  };

  const otherReviews = product.reviews.filter((r) => r.userId !== session?.user?.id);

  return (
    <div className="flex flex-col gap-3 p-3">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(jsonLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(breadcrumbJsonLd)} />

      <Breadcrumbs items={breadcrumbItems} />

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[460px_1fr_300px]">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 rounded-[6px] border border-border bg-surface p-[18px]">
            {product.brand && (
              <span className="text-[10px] font-semibold tracking-[0.1em] text-teal">{product.brand.toUpperCase()}</span>
            )}
            <h1 className="text-[26px] leading-[1.15] font-extrabold tracking-tight">{product.name}</h1>

            <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-ink-3">
              {product.ratingCount > 0 && (
                <>
                  <StarRating rating={product.ratingAvg} count={product.ratingCount} />
                  <span className="text-border">|</span>
                </>
              )}
              {product.sku && <span className="font-mono">SKU {product.sku}</span>}
            </div>

            <div className="flex items-baseline gap-2.5 border-t border-border-subtle pt-3.5">
              <span className="text-[32px] font-extrabold tracking-tight">{formatMoney(product.priceCents)}</span>
              {hasDiscount && (
                <>
                  <span className="text-[15px] text-muted-2 line-through">
                    {formatMoney(product.compareAtPriceCents!)}
                  </span>
                  <span className="rounded-[4px] bg-danger-tint px-2 py-1.5 text-[11px] font-bold text-danger-dark">
                    SAVE {formatMoney(product.compareAtPriceCents! - product.priceCents)} ({discountPct}%)
                  </span>
                </>
              )}
            </div>

            <p className="max-w-[62ch] text-[13px] leading-relaxed whitespace-pre-line text-ink-2">
              {product.description}
            </p>
          </div>

          <div className="flex flex-col gap-3.5 rounded-[6px] border border-border bg-surface p-[18px]">
            <h2 className="text-sm font-bold tracking-tight">
              Reviews {product.ratingCount > 0 && `(${product.ratingCount})`}
            </h2>

            {product.ratingCount > 0 && (
              <div className="flex items-center gap-4 rounded-[5px] bg-surface-muted p-3.5">
                <span className="text-[26px] font-extrabold">{product.ratingAvg.toFixed(1)}</span>
                <div className="flex-1">
                  <RatingDistribution distribution={ratingDistribution} total={product.ratingCount} />
                </div>
              </div>
            )}

            {session?.user?.id ? (
              <ReviewForm productId={product.id} slug={product.slug} existing={myReview} />
            ) : (
              <p className="text-xs text-ink-3">
                <Link href="/signin" className="font-semibold text-teal hover:text-teal-dark">
                  Sign in
                </Link>{" "}
                to write a review.
              </p>
            )}

            {otherReviews.length === 0 ? (
              <p className="text-xs text-ink-3">No reviews yet.</p>
            ) : (
              <div className="flex flex-col gap-3 border-t border-border-subtle pt-3">
                {otherReviews.map((review) => (
                  <div key={review.id} className="flex flex-col gap-1.5 border-b border-border-subtle pb-3 last:border-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xs font-semibold">{review.user.name ?? "Anonymous"}</span>
                      <StarRating rating={review.rating} />
                      {review.isVerifiedPurchase && (
                        <span className="rounded-[3px] bg-teal-tint px-1.5 py-1 text-[9px] font-bold text-teal-dark">
                          VERIFIED BUYER
                        </span>
                      )}
                    </div>
                    {review.title && <p className="text-xs font-semibold">{review.title}</p>}
                    <p className="text-xs leading-relaxed text-ink-2">{review.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 rounded-[6px] border border-border bg-surface p-4">
            <span className="text-[22px] font-extrabold tracking-tight">{formatMoney(product.priceCents)}</span>

            {outOfStock ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-danger">
                <span className="size-1.5 rounded-full bg-danger" />
                Out of stock
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-dark">
                <span className="size-1.5 rounded-full bg-teal" />
                In stock · {product.stockQuantity} available
              </div>
            )}

            <form action={addToCartAction} className="flex flex-col gap-3 border-t border-border-subtle pt-3">
              <input type="hidden" name="productId" value={product.id} />
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-ink-3">Qty</span>
                <QuantityStepper
                  name="quantity"
                  defaultValue={1}
                  min={1}
                  max={product.stockQuantity || undefined}
                  disabled={outOfStock}
                />
              </div>
              <Button type="submit" disabled={outOfStock} className="w-full">
                {outOfStock ? "Out of stock" : "Add to cart"}
              </Button>
            </form>
            <Button type="button" variant="dark" disabled={outOfStock} className="w-full">
              Buy now
            </Button>
            <WishlistToggle productId={product.id} isWishlisted={wishlistedIds.has(product.id)} variant="button" />
          </div>

          <div className="flex flex-col gap-2.5 rounded-[6px] border border-border bg-surface p-4 text-[11px] leading-relaxed text-ink-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-ink">Free delivery</span>
              <span>On orders over ₹499</span>
            </div>
            <div className="flex flex-col gap-0.5 border-t border-border-subtle pt-2.5">
              <span className="text-xs font-semibold text-ink">7-day returns</span>
              <span>Free pickup from your address</span>
            </div>
            <div className="flex flex-col gap-0.5 border-t border-border-subtle pt-2.5">
              <span className="text-xs font-semibold text-ink">Secure payments</span>
              <span>Visa, Mastercard, UPI, net banking</span>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="rounded-[6px] border border-border bg-surface p-4">
          <h2 className="mb-3 text-[15px] font-bold tracking-tight">Customers also viewed</h2>
          <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} isWishlisted={wishlistedIds.has(item.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no new errors.

Browser check: visit any `/p/[slug]` (use a real product slug from the seed data — e.g. `compact-4k-action-camera`, seen earlier this session). Compare against `design_handoff_meridian_dense_teal/screenshots/03 Product Detail.png`. Use the quantity stepper `+`/`−` and confirm it clamps at `1` and at `stockQuantity`. Click "Add to cart" and confirm it still adds the item (regression check — real Server Action). Click "Buy now" and confirm it's visibly present but does nothing (no navigation, no error).

- [ ] **Step 3: Commit**

```bash
git add "app/(shell)/(storefront)/p/[slug]/page.tsx"
git commit -m "Restyle Product Detail page to Dense Teal"
```

---

### Task 12: Restyle Cart page

**Files:**
- Modify: `app/(shell)/(storefront)/cart/page.tsx`

Reference: `design_handoff_meridian_dense_teal/04 Cart.dc.html`, `screenshots/04 Cart.png`. Coupon field renders present-but-inert per Global Constraints; "Clear cart" and "Frequently bought together" are omitted (no backing action/query).

- [ ] **Step 1: Replace the file**

```tsx
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getCart } from "@/lib/cart";
import { updateCartItemAction, removeCartItemAction } from "@/lib/actions/cart-actions";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";

export const metadata: Metadata = {
  title: "Cart",
};

export default async function CartPage() {
  const cart = await getCart();
  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md p-3 py-16 text-center">
        <h1 className="text-xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-ink-3">Browse the catalog and add something you like.</p>
        <Link href="/" className="mt-6 inline-block">
          <Button type="button">Continue shopping</Button>
        </Link>
      </div>
    );
  }

  const subtotalCents = items.reduce((sum, item) => sum + item.quantity * item.product.priceCents, 0);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-baseline gap-3">
        <h1 className="text-[22px] font-extrabold tracking-tight">Your cart</h1>
        <span className="text-xs text-ink-3">{items.length} items</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-3">
          <div className="rounded-[6px] border border-border bg-surface">
            <div className="grid grid-cols-[1fr_120px_130px_40px] gap-3 border-b border-border-subtle px-4 py-2.5 text-[10px] font-bold tracking-[0.08em] text-ink-3">
              <span>PRODUCT</span>
              <span className="text-center">QUANTITY</span>
              <span className="text-right">SUBTOTAL</span>
              <span />
            </div>

            {items.map((item) => {
              const image = item.product.images[0];
              const outOfStock = item.product.stockQuantity <= 0;
              const overStock = item.quantity > item.product.stockQuantity;

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_120px_130px_40px] items-center gap-3 border-b border-border-subtle px-4 py-3.5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/p/${item.product.slug}`}
                      className="relative size-[68px] shrink-0 overflow-hidden rounded-[4px] bg-surface-muted"
                    >
                      {image && (
                        <Image src={image.url} alt={image.altText ?? item.product.name} fill sizes="68px" className="object-cover" />
                      )}
                    </Link>
                    <div className="flex flex-col gap-1">
                      <Link href={`/p/${item.product.slug}`} className="text-[13px] font-semibold hover:text-teal">
                        {item.product.name}
                      </Link>
                      {outOfStock && (
                        <span className="text-[11px] font-medium text-danger">Out of stock - remove to continue</span>
                      )}
                      {!outOfStock && overStock && (
                        <span className="text-[11px] font-medium text-danger">Only {item.product.stockQuantity} left in stock</span>
                      )}
                      {!outOfStock && !overStock && <span className="text-[11px] font-medium text-teal-dark">In stock</span>}
                    </div>
                  </div>

                  <form action={updateCartItemAction} className="flex justify-center">
                    <input type="hidden" name="productId" value={item.productId} />
                    <QuantityStepper name="quantity" defaultValue={item.quantity} min={1} max={item.product.stockQuantity || undefined} />
                  </form>

                  <span className="text-right text-base font-extrabold tracking-tight">
                    {formatMoney(item.quantity * item.product.priceCents)}
                  </span>

                  <form action={removeCartItemAction} className="flex justify-center">
                    <input type="hidden" name="productId" value={item.productId} />
                    <button type="submit" aria-label="Remove item" className="text-sm text-muted-2 hover:text-danger">
                      ✕
                    </button>
                  </form>
                </div>
              );
            })}
          </div>

          <div className="rounded-[6px] border border-border bg-surface px-4 py-3">
            <Link href="/" className="text-xs font-semibold text-teal hover:text-teal-dark">
              ← Continue shopping
            </Link>
          </div>
        </div>

        <aside className="flex flex-col gap-2.5 rounded-[6px] border border-border bg-surface p-4">
          <h2 className="text-sm font-bold tracking-tight">Order summary</h2>
          <div className="flex justify-between text-xs text-ink-3">
            <span>Subtotal ({items.length} items)</span>
            <span className="font-semibold text-ink">{formatMoney(subtotalCents)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-border-subtle pt-3">
            <span className="text-sm font-bold">Total</span>
            <span className="text-[22px] font-extrabold tracking-tight">{formatMoney(subtotalCents)}</span>
          </div>
          <p className="text-[11px] text-muted-2">Shipping and taxes calculated at checkout.</p>
          <Link href="/checkout" className="mt-1 block">
            <Button type="button" className="w-full">
              Proceed to checkout
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no new errors.

Browser check: add an item to cart, visit `/cart`. Compare against `design_handoff_meridian_dense_teal/screenshots/04 Cart.png`. Use the quantity stepper and confirm it still submits `updateCartItemAction` correctly (regression check — line total should update on submit). Click remove (✕) and confirm the item is removed (regression check — real `removeCartItemAction`).

- [ ] **Step 3: Commit**

```bash
git add "app/(shell)/(storefront)/cart/page.tsx"
git commit -m "Restyle Cart page to Dense Teal"
```

---

### Task 13: Restyle Checkout page

**Files:**
- Modify: `app/(shell)/(storefront)/checkout/page.tsx`

Reference: `design_handoff_meridian_dense_teal/06 Checkout.dc.html`, `screenshots/06 Checkout.png`. The 4-step wizard header, delivery-speed radios, inline payment tabs, and PIN error demo are omitted per Global Constraints — real checkout here is one page, payment goes through the Razorpay modal via `CheckoutButton` (unchanged).

- [ ] **Step 1: Replace the file**

```tsx
import { redirect } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { getAddresses } from "@/lib/addresses";
import { calculateShippingCents } from "@/lib/shipping";
import { formatMoney } from "@/lib/money";
import { AddressForm } from "@/components/address-form";
import { CheckoutButton } from "@/components/checkout-button";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [cart, addresses] = await Promise.all([getCart(), getAddresses(session.user.id)]);
  if (!cart || cart.items.length === 0) redirect("/cart");

  const stockIssues = cart.items.filter(
    (item) => item.product.status !== "ACTIVE" || item.quantity > item.product.stockQuantity
  );

  const subtotalCents = cart.items.reduce((sum, item) => sum + item.quantity * item.product.priceCents, 0);
  const shippingCents = calculateShippingCents(subtotalCents);
  const totalCents = subtotalCents + shippingCents;

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  return (
    <div className="flex flex-col gap-3 p-3">
      <h1 className="text-xl font-extrabold tracking-tight">Checkout</h1>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-3">
          <section className="flex flex-col gap-3.5 rounded-[6px] border border-border bg-surface p-[18px]">
            <h2 className="text-base font-bold tracking-tight">Shipping address</h2>

            {addresses.length === 0 ? (
              <AddressForm />
            ) : (
              <form id="checkout-form" className="flex flex-col gap-2">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className="flex cursor-pointer items-start gap-3 rounded-[5px] border border-border p-3.5 text-xs text-ink-2 has-checked:border-[1.5px] has-checked:border-teal has-checked:bg-teal-tint/40"
                  >
                    <input
                      type="radio"
                      name="addressId"
                      value={address.id}
                      defaultChecked={address.id === defaultAddress?.id}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-semibold text-ink">{address.fullName}</span>
                      <br />
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                      <br />
                      {address.city}
                      {address.state ? `, ${address.state}` : ""} {address.postalCode}, {address.country}
                      {address.phone && (
                        <>
                          <br />
                          {address.phone}
                        </>
                      )}
                    </span>
                  </label>
                ))}
              </form>
            )}

            <a href="/account/addresses" className="text-xs font-semibold text-teal hover:text-teal-dark">
              Manage addresses
            </a>
          </section>

          <section className="flex flex-col gap-3 rounded-[6px] border border-border bg-surface p-[18px]">
            <h2 className="text-base font-bold tracking-tight">Order items</h2>
            <div className="flex flex-col divide-y divide-border-subtle">
              {cart.items.map((item) => {
                const image = item.product.images[0];
                const issue =
                  item.product.status !== "ACTIVE"
                    ? "No longer available"
                    : item.quantity > item.product.stockQuantity
                      ? `Only ${item.product.stockQuantity} left in stock`
                      : null;

                return (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-[4px] bg-surface-muted">
                      {image && (
                        <Image src={image.url} alt={image.altText ?? item.product.name} fill sizes="56px" className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-medium text-ink">{item.product.name}</p>
                      <p className="text-ink-3">Qty {item.quantity}</p>
                      {issue && <p className="font-medium text-danger">{issue}</p>}
                    </div>
                    <p className="text-sm font-semibold">{formatMoney(item.quantity * item.product.priceCents)}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-3">
          <div className="flex flex-col gap-2.5 rounded-[6px] border border-border bg-surface p-4">
            <h2 className="text-sm font-bold tracking-tight">Order summary</h2>
            <div className="flex flex-col gap-2 border-t border-border-subtle pt-3 text-xs text-ink-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-ink">{formatMoney(subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-teal-dark">{shippingCents === 0 ? "Free" : formatMoney(shippingCents)}</span>
              </div>
            </div>
            <div className="flex items-baseline justify-between border-t border-border-subtle pt-3">
              <span className="text-sm font-bold">Total</span>
              <span className="text-[22px] font-extrabold tracking-tight">{formatMoney(totalCents)}</span>
            </div>

            <CheckoutButton formId="checkout-form" disabled={addresses.length === 0 || stockIssues.length > 0} />
            {stockIssues.length > 0 && (
              <p className="text-xs font-medium text-danger">Resolve the stock issues above before placing your order.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(shell)/(storefront)/checkout/page.tsx"
git commit -m "Restyle Checkout page to Dense Teal"
```

---

### Task 14: Full storefront verification

**Files:** none (verification-only task)

- [ ] **Step 1: Run the full check suite**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all three pass — same pre-existing baseline noise as Plan 1 (3 signin/not-found lint errors; the untracked `design_handoff_meridian_dense_teal/support.js` file if present in the checkout directory being linted), zero new errors.

- [ ] **Step 2: Visual pass over all 6 pages**

Using the browser tools (or the `run` skill), screenshot and compare each against its design screenshot:
- `/` vs `01 Home.png`
- `/c/[slug]` vs `02 Category.png`
- `/p/[slug]` vs `03 Product Detail.png`
- `/cart` (with an item in cart) vs `04 Cart.png`
- `/search?q=...` vs `05 Search Results.png`
- `/checkout` (signed in, with an item in cart and a saved address) vs `06 Checkout.png`

- [ ] **Step 3: Run the checkout walkthrough**

Use the `checkout-walkthrough` skill to verify the guest-to-paid-order flow end-to-end. This is the regression check that matters most here — styling changes touched the cart quantity control, the address radio list, and the checkout summary, which is exactly where a checkout flow breaks silently.

- [ ] **Step 4: No commit needed for this task** (verification-only).

---

## After this plan

Once verified, the storefront (Home, Category, Product Detail, Cart, Search, Checkout) matches Dense Teal. Next: **Plan 3 — Account** (Overview, Addresses, Orders, Settings, Wishlist's populated-state grid — the empty state already shipped in Plan 1).
