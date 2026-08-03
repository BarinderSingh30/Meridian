# Storefront functionality — Phase 2 (make the visual-only features real)

## Overview

The Dense Teal visual redesign (`2026-08-03-dense-teal-visual-redesign-design.md`) restyled every page but explicitly deferred a list of features that look present in the mockups/markup but do nothing. This phase builds the storefront half of that list — Home, Category, Search, Product Detail, Cart, and Checkout — for real: new Server Actions, one new query extension, three new Prisma models/fields, and the page-level wiring to use them.

Account, Admin, and Static/legal + Auth are separate follow-up sections (not in this spec), to be brainstormed and planned individually after this one ships, per the existing deferred-features list.

Codebase note: not everything on the old deferred list is still deferred — a re-check against current code found active-filter chips (price/rating/in-stock, in `components/product-results.tsx`) were already implemented for real during the restyle. This spec only covers what's actually still inert or missing, confirmed by reading the current implementation, not by trusting the old list at face value.

## Schema changes

- **`Coupon`** (new model): `id`, `code String @unique`, `percentOff Int?`, `flatCents Int?` (exactly one of the two is set — enforced in the redemption code, not a DB constraint), `active Boolean @default(true)`, `expiresAt DateTime?`, `maxRedemptions Int?`, `timesRedeemed Int @default(0)`, `createdAt DateTime @default(now())`. No admin UI to create/manage codes in this phase (that's the Admin section's job, already on its deferred list) — codes are inserted via `prisma/seed.ts` or Prisma Studio for now; this phase only builds validation + redemption.
- **`Cart`**: add `couponCode String?` — persists the applied code across page loads until checkout or removal.
- **`Order`**: add `couponCode String?` and `shippingMethod String @default("standard")`.
- **`Product`**: add `specs Json?` — array of `{ label: string, value: string }`. A handful of seed products get example specs so the PDP table has something to render; editing this field is Admin's job (out of scope here, already on the Admin section's deferred list as "Product Edit specs editor").
- **`StockNotification`** (new model): `id`, `productId`, `email`, `createdAt DateTime @default(now())`. Capture-only — no automatic restock trigger (confirmed with user; admin can query this table manually for now).

## Product discovery (Home / Category / Search / PDP)

- **Quick add-to-cart on grid tiles**: `components/product-card.tsx` currently renders "Add to cart" as an inert `<span>` inside the card's whole-tile `<Link>`. Replace it with a `<form>` (stopping click propagation so it doesn't trigger the card's navigation) posting to the existing `addToCartAction` from `lib/actions/cart-actions.ts` — no new action needed.
- **Buy now (PDP)**: `app/(shell)/(storefront)/p/[slug]/page.tsx` has a `variant="dark"` "Buy now" button with no handler. Wire it to a form calling `addToCartAction`, then redirect to `/checkout` (per user decision — reuses the existing cart rather than an isolated single-item checkout).
- **Notify-me**: PDP's out-of-stock state today is a status line only, no capture form; the grid card's "Notify me" text is likewise inert. Add a real email-capture form in both places. New `notifyMeAction` (in `lib/actions/cart-actions.ts` or a new `lib/actions/notify-actions.ts`) inserts into `StockNotification` and sends a confirmation email via the existing `lib/resend.ts` helper (same provider already used for magic-link auth and order confirmations).
- **Brand facet**: `lib/search/index.ts`'s `SearchParams`/`buildFilterClauses` has no brand filter today despite `Product.brand` existing. Add `brands?: string[]`, thread it through both the hybrid and ILIKE query paths, add a checkbox group to `components/product-results.tsx`'s sidebar (same pattern as the existing rating radios), and extend `ACTIVE_FILTER_LABELS` so selected brands also show as removable chips.
- **Search "did you mean" + highlighting**: when `searchProducts` returns zero results for a text query, run a secondary `pg_trgm` `similarity(name, q)` lookup (extension already enabled) for the closest product name and surface it as "Did you mean: X?" linking to that corrected search. Highlight matched substrings in result names via a simple case-insensitive split-and-wrap (no NLP/tokenizer needed).
- **PDP specs table**: render `product.specs` as a plain two-column table under the description when present; renders nothing when null.
- **PDP delivery-by-PIN estimate**: small client component — 6-digit numeric input, validated client-side, mapped through a hardcoded PIN-prefix → delivery-day-range table (metro prefixes faster than the rest). No external courier API, no server round-trip.

## Cart & Checkout

- **Coupon/promo code**: cart's order-summary aside has no coupon markup today (new UI, not just wiring). Add a code input + "Apply" button. `applyCouponAction` validates the code against `Coupon` (active, not expired, under `maxRedemptions`), stores it on `Cart.couponCode`, and the page recomputes a live discount preview. `placeOrderAction` re-validates the code server-side at order time (so it can't be tampered with client-side or reused past its limit), copies `couponCode` + resulting `discountCents` onto the `Order`, and increments `Coupon.timesRedeemed`.
- **Clear cart**: new `clearCartAction` deleting all `CartItem` rows for the current cart; button placed next to the existing "Continue shopping" link.
- **Cross-sell row**: reuse `getRelatedProducts(categoryId, excludeProductId)` from `lib/products/queries.ts` — call once per distinct category present in the cart, merge results, dedupe, exclude anything already in the cart, cap at ~6. Rendered as a "You might also like" row below the line items.
- **Itemized order-summary breakdown**: cart page currently sets `Total = Subtotal` with a placeholder "calculated at checkout" line. Replace with real Subtotal / Shipping estimate (`calculateShippingCents`) / Discount (if a coupon is applied) / Total, shown consistently on both the cart page and checkout.
- **Checkout delivery-speed selection**: two hardcoded options — Standard (existing flat-rate logic: free above ₹4,500, else ₹549) and Express (fixed surcharge, faster estimate) — as a radio group in the checkout form. Selection is stored as `Order.shippingMethod` and determines which shipping calculation `placeOrderAction` uses, replacing the unconditional `calculateShippingCents` call.

## Verification

- Manual pass through each new interaction after implementation (add-to-cart from grid, buy-now, notify-me capture, brand filter + chip removal, search miss → did-you-mean, coupon apply/reject/expired, clear cart, delivery-speed selection affecting total).
- Run the `checkout-walkthrough` skill after the Cart & Checkout plan lands — this phase changes `placeOrderAction`'s shipping/discount math, exactly where regressions in the guest-to-paid-order flow would show up.
- No pre-existing automated test suite for this app; no new one introduced here (matches how Dense Teal Phase 1 verified — manual + the one end-to-end skill).

## Implementation plan split

Two plans, mirroring the Dense Teal precedent of splitting one spec across multiple plan docs:

1. **Product discovery** — schema foundation (all 4 schema changes) + Home/Category/Search/PDP items above.
2. **Cart & Checkout** — coupon, clear cart, cross-sell, order-summary breakdown, delivery-speed (depends on plan 1's schema work being merged first, since `Coupon` and `Order.shippingMethod` are shared).

## Deferred (explicitly not in this spec)

Account, Admin, and Static/legal + Auth sections — remain on the original deferred-features list in the Dense Teal spec, to be brainstormed individually, in that order or as the user reprioritizes.
