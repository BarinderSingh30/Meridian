# Meridian

A production-grade, "Amazon-like" e-commerce storefront built as a portfolio project — full catalog browsing, cart, checkout with real payments (Razorpay), order history, reviews, wishlist, and a complete admin dashboard.

![Home page](docs/screenshots/home.jpg)
![Admin dashboard](docs/screenshots/admin-dashboard.jpg)

**Live demo:** [meridian-rho-roan.vercel.app](https://meridian-rho-roan.vercel.app/)

## Demo credentials

No OAuth/email setup required to explore the app — two seeded accounts sign in instantly from the [sign-in page](/signin):

| Role     | Email                    | Password                  |
| -------- | ------------------------- | -------------------------- |
| Customer | `demo@example.com`        | `demo-customer-password`   |
| Admin    | `admin-demo@example.com`  | `demo-admin-password`      |

Google OAuth and Resend magic-link sign-in also work if you configure your own credentials (see [Environment variables](#environment-variables)).

**Test payment:** at checkout, Razorpay's sandbox only accepts Indian test cards. Use Mastercard `5267 3181 8797 5449`, any future expiry, any CVV. Generic test numbers like `4111 1111 1111 1111` are rejected as international.

## Tech stack

- **Framework:** Next.js 16 (App Router, Server Actions, Turbopack)
- **Language:** TypeScript
- **Database:** PostgreSQL via [Neon](https://neon.tech) (serverless driver) — or local Postgres via Docker
- **ORM:** Prisma 7 with driver adapters (`@prisma/adapter-neon` / `@prisma/adapter-pg`)
- **Auth:** Auth.js v5 — Google OAuth, Resend magic links, and a demo `Credentials` provider
- **Payments:** Razorpay (Orders API + Checkout.js modal + webhook-verified confirmation)
- **Email:** Resend (order confirmations)
- **Styling:** Tailwind CSS + shadcn/ui (base-ui)
- **Deployment:** Vercel

## Architecture

- **Money is `Int` cents everywhere.** No floats, no `Decimal`. `lib/money.ts` formats for display.
- **Order-first, webhook-confirmed checkout.** Placing an order creates a `PENDING` order and a Razorpay order in the same request; only a signature-verified `payment.captured` webhook (`app/api/webhooks/razorpay/route.ts`) flips it to `PAID`, decrements stock (conditionally, so it's impossible to oversell), and clears the cart. An abandoned or failed payment leaves the cart and stock untouched.
- **Snapshotted orders.** Shipping address and line items are copied onto the `Order`/`OrderItem` rows at creation time, so an order stays readable and accurate even if a product is later edited, archived, or a user's address book changes.
- **Guest-friendly cart, auth-required checkout** (same UX as Amazon). A signed, opaque cookie (`cartToken`) identifies a guest cart; on sign-in, `events.signIn` merges it into the user's cart in one transaction and deletes the guest cart.
- **Defense in depth on `/admin`.** Auth.js v5's Prisma adapter isn't edge-compatible, so admin access can't be gated in middleware. It's checked in `app/admin/layout.tsx` (redirects non-admins) **and** re-checked with `requireAdmin()` inside every admin Server Action, since Server Actions are publicly reachable POST endpoints regardless of what the layout renders.
- **One search interface.** `lib/search/index.ts` exports a single `searchProducts()` used by both the search page and category pages (currently `ILIKE`/trigram-backed), so a future semantic-search implementation is a body swap, not an API change.
- **Denormalized rating aggregates.** `Product.ratingAvg`/`ratingCount` are recomputed inside the same transaction as any review create/update/delete/moderation action, so listing pages can sort by rating without a join.

## Getting started

### Option A — Docker (fastest, no Neon account needed)

```bash
docker compose up -d          # starts local Postgres with pgvector
cp .env.example .env          # fill in DATABASE_URL/DIRECT_URL for the local container (see below)
npx prisma migrate deploy
npx prisma db seed
npm install
npm run dev
```

With the compose Postgres running, point `.env` at it:

```
DATABASE_URL="postgresql://meridian:meridian@localhost:5432/meridian"
DIRECT_URL="postgresql://meridian:meridian@localhost:5432/meridian"
```

### Option B — Neon (matches production)

1. Create a [Neon](https://neon.tech) project and a `dev` branch. Copy the pooled connection string into `DATABASE_URL` and the unpooled (direct) string into `DIRECT_URL`.
2. `cp .env.example .env` and fill in the rest (see below).
3. `npm install`
4. `npx prisma migrate deploy`
5. `npx prisma db seed`
6. `npm run dev`

Either way, the app is at [http://localhost:3000](http://localhost:3000).

### Environment variables

See `.env.example` for the full list with comments. At minimum for local dev:

- `DATABASE_URL`, `DIRECT_URL` — Postgres connection strings
- `AUTH_SECRET` — generate with `npx auth secret`
- `DEMO_CUSTOMER_PASSWORD`, `DEMO_ADMIN_PASSWORD` — any value; gates the seeded demo accounts
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` — from a Razorpay test-mode account, only needed to exercise checkout
- `RAZORPAY_WEBHOOK_SECRET` — from the Razorpay dashboard webhook config; local webhook delivery needs a tunnel (e.g. `ngrok http 3000`) since Razorpay has no CLI-based local forwarder
- `AUTH_GOOGLE_ID`/`SECRET`, `AUTH_RESEND_KEY`/`EMAIL_FROM` — optional, only needed for Google/magic-link sign-in
- `BLOB_READ_WRITE_TOKEN` — optional; only needed if you wire up Vercel Blob uploads (see [Non-goals](#non-goals--scope-decisions))

### Building a production image

```bash
docker build --build-arg DATABASE_URL=... --build-arg DIRECT_URL=... -t meridian .
docker run -p 3000:3000 --env-file .env meridian
```

## Project structure

```
app/
  (storefront)/    home, category, product detail, search, cart, checkout
  (auth)/          sign-in, magic-link verify, auth error
  (static)/        about, contact, faq, terms, privacy, shipping-returns
  account/         orders, addresses, wishlist, settings (auth-gated)
  admin/           dashboard, products, orders, customers, reviews (role-gated)
  api/
    auth/[...nextauth]/   Auth.js route handler
    webhooks/razorpay/    payment confirmation (raw-body signature verification)
lib/
  actions/         Server Actions, grouped by domain
  admin/           admin-only data-layer queries
  search/          searchProducts() — the one search interface
  auth.ts          requireAdmin(), auth(), signIn/signOut
  money.ts shipping.ts   Int-cents helpers, flat-rate shipping calc
prisma/
  schema.prisma  seed.ts  migrations/
```

## Non-goals / scope decisions

Deliberately out of scope for this portfolio build — see the code/PR history for why:

- Product variants (size/color) — `Product` is a single SKU per row
- Multi-currency, real tax engine, carrier shipping rates (flat-rate shipping instead)
- Inventory reservation/backorder, returns/RMA flows
- Multi-vendor, i18n, rate-limiting infrastructure, PWA, A/B testing
- Guest checkout (cart is guest-friendly; checkout requires sign-in, matching Amazon's UX)
- Vercel Blob client-upload for admin product images — the admin product form uses plain image-URL fields instead, since `BLOB_READ_WRITE_TOKEN` is only auto-injected on Vercel and wasn't testable end-to-end in local dev; every seeded product already uses external image URLs
- A charting library (Recharts, etc.) for the admin dashboard — a small hand-rolled CSS bar chart covers the one revenue-over-time visualization

## Verification checklist

Run through this after any significant change (see the plan doc for the full version):

- [ ] `prisma migrate reset && prisma db seed` twice → identical, no duplicate slugs
- [ ] Guest adds to cart → signs in → cart merges exactly once → checkout → pays with the test card above → order appears in `/account/orders` as PAID → confirmation email sent → stock decremented → cart cleared
- [ ] Cancelling mid-payment leaves the order PENDING and the cart untouched
- [ ] A non-admin hitting `/admin` or POSTing directly to an admin Server Action is rejected
- [ ] Admin creates a product with images → it's visible and purchasable on the storefront
- [ ] Reviewing as a purchaser shows "Verified Purchase"; as a non-purchaser it doesn't; hiding a review in admin removes it from the public rating average
