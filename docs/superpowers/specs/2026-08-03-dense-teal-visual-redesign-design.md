# Dense Teal visual redesign — Phase 1 (visual-only)

## Overview

Apply the "Dense Teal" design handoff (`design_handoff_meridian_dense_teal/`) to all 29 pages of the Meridian app plus its 4 shared chrome components, replacing the current unstyled shadcn default theme. This phase is **visual and structural markup only** — every page keeps its existing data-fetching, Server Actions, and functionality exactly as-is. New features shown in the mockups but not present in the app today are explicitly deferred (see "Deferred features" below) and will be scoped as separate follow-up projects, prioritized by the user after this phase ships.

Source of truth for visual values: `design_handoff_meridian_dense_teal/README.md` (design tokens), the 29 `.dc.html` files (exact per-page markup/copy), and `design_handoff_meridian_dense_teal/screenshots/*.png` (visual reference for comparison).

## Design tokens

Full token table lives in `design_handoff_meridian_dense_teal/README.md` — treat it as authoritative. Summary:

- **Color**: grey canvas (`#EEF1F4`), white surfaces, hairline borders (`#DBE2E8`), dark teal chrome (`#0F2027` / `#0A161B` / `#16323B`), single teal action color (`#0D9488`), status colors for danger/warn/success/info/neutral. Teal is the only action color; red is reserved for discounts/errors/destructive actions only.
- **Type**: Archivo (400/500/600/700/800) for all UI text, JetBrains Mono (400/500) for SKUs/order numbers/references/error codes. Full size scale in the README.
- **Geometry**: 6px card radius, 5px button/input radius, 4px badge radius, 1px hairline borders, 1.5px teal focus/selected border, **no shadows anywhere**.
- **Components**: 4 button variants (primary/secondary/dark/destructive), input/toggle/status-pill/table/empty-state specs — all detailed in the README.

## Foundation changes

- **`app/globals.css`**: replace the `:root` CSS custom properties (currently oklch grayscale shadcn defaults) with the Dense Teal palette, mapped onto the same variable names (`--background`, `--foreground`, `--border`, `--primary`, `--destructive`, `--muted`, etc.) so all shadcn-derived primitives inherit it automatically. Remove the unused `.dark` block — no dark-mode toggle exists anywhere in the app.
- **`app/layout.tsx`**: replace `Geist`/`Geist_Mono` (`next/font/google`) with `Archivo` (weights 400/500/600/700/800) and `JetBrains_Mono` (weights 400/500), keeping the same CSS variable wiring pattern.
- **`components/ui/button.tsx`**: remap `cva` variants to the design's 4 buttons:
  - `default` → primary (teal fill `#0D9488`, white text, 700 weight, hover `#0B7F75`)
  - `outline` → secondary (white fill, 1px border, `#475569` text, 600 weight)
  - new `dark` variant (`#0F2027` fill, white text) for Buy now / Apply-style actions
  - `destructive` → white fill, 1px `#DC2626` border, red text (not a red fill)
  - Keep `ghost`/`link`/`secondary` slots if still referenced elsewhere; restyle to match nearest design equivalent, don't remove without checking usages.
- **New shared primitives** (build once, reuse across account/admin pages rather than redefining per page): status pill (9px/700 uppercase, radius 3, color table per status), toggle switch (38×21 pill), table header/row styling (uppercase 10px/700 header, mono numeric/SKU columns, `#FFFBF5` attention-row tint), empty-state pattern (teal-tint icon circle, headline, muted body, button pair, centered).

## Shared chrome

- **`components/site-header.tsx`**: restructure into the 3-tier layout from `Chrome.dc.html` — utility bar (`#0A161B`, promo message + help/track-order/sell links), header (`#0F2027`, logo + search + account/orders/wishlist/cart/sign-out), category strip (`#16323B`, "All categories" + dynamic category list). All content already comes from existing queries (`auth()`, `getTopLevelCategories()`, `getCart()`) — this is markup/styling only, no new data needs.
- **`components/site-footer.tsx`**: restyle to the 5-column footer per `Footer.dc.html`.
- **Account nav**: extend or replace whatever `app/(shell)/account/layout.tsx` currently renders with the 220px `AccountNav` card per `AccountNav.dc.html`. Check for an existing nav component to restyle before creating a new one.
- **Admin nav**: extend or replace whatever `app/(shell)/admin/layout.tsx` currently renders with the 210px dark `AdminNav` sidebar per `AdminNav.dc.html`. Note: `AdminNav.dc.html` includes links to "Categories" and "Settings" admin sections that don't exist in the app yet — render those nav items as inert/non-functional (or omit if they'd 404) since building those sections is out of scope for this phase; see "Deferred features."

## Page groups & order

Each page is restyled to match its `.dc.html` file and screenshot, using its current data-fetching as-is. No new Server Actions, queries, route changes, or schema changes in this phase. Interactive-looking elements that imply unbuilt functionality (coupon field, FAQ search box, bulk-action checkboxes, notify-me capture, etc.) render per the design but stay inert — no network call, no error, just a no-op — per user decision during brainstorming.

1. **Foundation + shared chrome** (above)
2. **Storefront**: Home (`/`), Category (`/c/[slug]`), Product Detail (`/p/[slug]`), Cart (`/cart`), Search (`/search`), Checkout (`/checkout`)
3. **Account**: Overview (`/account`), Addresses (`/account/addresses`), Orders (`/account/orders`), Settings (`/account/settings`), Wishlist (`/account/wishlist`)
4. **Admin**: Dashboard (`/admin`), Products (`/admin/products`), Orders (`/admin/orders`), Customers (`/admin/customers`), Reviews (`/admin/reviews`), Customer Detail (`/admin/customers/[id]`), Product Edit (`/admin/products/[id]`), Order Detail (`/admin/orders/[id]`), New Product (`/admin/products/new`)
5. **Static/legal**: About (`/about`), Contact (`/contact`), FAQ (`/faq`), Privacy (`/privacy`), Shipping & Returns (`/shipping-returns`), Terms (`/terms`)
6. **Auth**: Sign In (`/signin`), Auth Error (`/auth-error`), Verify Request (`/verify-request`)

Route naming stays as-is (`/c/[slug]`, `/p/[slug]`, `/auth-error` etc.) — the design doc's route column uses different names (`/category/...`, `/product/...`, `/auth/error`) but that's the designer's shorthand, not a routing requirement.

## Verification

- **Visual**: after each group, run the dev server (`run` skill) and screenshot each live page for side-by-side comparison against `design_handoff_meridian_dense_teal/screenshots/`.
- **Functional regression**: after the storefront + checkout group, run the `checkout-walkthrough` skill to confirm the guest-to-paid-order flow still works end-to-end — styling changes to forms/buttons/layout are exactly where regressions get introduced.
- No new automated tests — this phase introduces no new logic, only markup/styling changes.

## Deferred features (not in this phase)

Full list from the functional-gap scan, to be discussed and prioritized by the user as separate follow-up projects after this phase ships:

- **Storefront**: quick add-to-cart on grid tiles, notify-me email capture for out-of-stock, buy-now button, brand filter facet, active-filter chips, PDP delivery-by-PIN estimate, PDP specs table, cart coupon/promo code, cart "clear cart", cart cross-sell row, itemized order-summary breakdown, search "did you mean" + term highlighting, checkout delivery-speed selection.
- **Static/legal**: real Contact form (currently static text), FAQ search box, self-service "Start a return" workflow.
- **Account**: Overview stat cards + order tracker, Addresses "import from last order," Orders search/date-filter/status-chips/guest-tracking/recommendations, Settings editable profile + notification toggles + session management + delete-account, Wishlist bulk "move to cart" + recommendations.
- **Admin**: Dashboard attention-queue/recent-orders/top-sellers/extra-KPIs/date-range/CSV export, Products bulk-action bar + filters + CSV import, Orders search/filters/status tiles/CSV export/packing slips, Customers KPI cards/search/segments/CSV export, Reviews moderation queue + reject/edit/reply actions (needs `ReviewStatus` schema change), Customer Detail KPIs/notes/suspend/activity feed/tickets, Product Edit specs editor/cost-margin/visibility toggles/performance stats/SEO fields/image upload, Order Detail fulfilment tracker/timeline+notes/refund/print actions, New Product 4-step wizard + checklist + live preview, Categories management (entirely new admin section), Admin Settings page (entirely new admin section).
- **Auth**: Auth Error actionable retry buttons + error-ref code, Verify Request resend/countdown/change-email.
