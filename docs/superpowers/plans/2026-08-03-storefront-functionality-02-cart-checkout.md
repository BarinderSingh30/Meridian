# Storefront Functionality — Plan 2: Cart & Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Cart and Checkout's remaining inert/missing features real: promo code apply/remove, clear cart, a same-category cross-sell row, a true itemized Subtotal/Shipping/Discount/Total breakdown (today the cart page just sets `Total = Subtotal`), and a checkout delivery-speed choice that actually changes shipping cost and gets recorded on the `Order`.

**Prerequisite:** Plan 1 (`2026-08-03-storefront-functionality-01-product-discovery.md`) must be merged first — this plan uses the `Coupon` model and `Cart.couponCode` / `Order.couponCode` / `Order.shippingMethod` fields it added in Task 1.

**Architecture:** Coupon validation and shipping-cost math live in small pure/query modules (`lib/coupons.ts`, extended `lib/shipping.ts`) so both the cart page (preview) and `placeOrderAction` (source of truth at order time) call the exact same functions rather than duplicating logic. Coupon *application* needs inline error feedback (invalid/expired/limit-reached), so — matching this plan's `NotifyMeForm`/`CheckoutButton` precedent — it's a small `"use client"` component calling the Server Action directly and using `router.refresh()` to pick up the change, rather than a toast system (none exists in this codebase).

**Tech Stack:** Next.js 16 (App Router, Server Actions, `router.refresh()`), Prisma 7, existing `lib/money.ts` formatting.

## Global Constraints

- No test framework in this repo — verification steps are manual (`npm run dev` + browser) or scripted `npx tsx` checks, same as Plan 1.
- Coupon **creation** is out of scope here too — insert test coupons via Prisma Studio or `prisma/seed.ts` (see Task 1's verification step for the exact insert).
- Design tokens are fixed (teal `#0D9488` only action color, `5px` input/button radius, no shadows) — copy classnames from the surrounding code in each file, don't invent new ones.
- `calculateShippingCents(subtotalCents)` already exists in `lib/shipping.ts` and is called from `cart/page.tsx`, `checkout/page.tsx`, and `checkout-actions.ts` — this plan adds an optional second parameter with a default, so none of those three existing call sites need to change unless they're being touched anyway for the breakdown/speed-selector work.

---

## File Structure

- `lib/shipping.ts` **(modify)** — add `SHIPPING_METHODS`, `ShippingMethod` type, extend `calculateShippingCents(subtotalCents, method?)`.
- `lib/coupons.ts` **(new)** — `validateCoupon(code)`, `calculateDiscountCents(subtotalCents, coupon)`.
- `lib/cart.ts` **(modify)** — add `categoryId: true` to the cart item's product select (needed for cross-sell).
- `lib/actions/cart-actions.ts` **(modify)** — add `clearCartAction`, `applyCouponAction`, `removeCouponAction`.
- `components/coupon-form.tsx` **(new)** — client component calling `applyCouponAction` directly.
- `lib/products/queries.ts` **(modify)** — add `getCartCrossSell(items, limit?)`.
- `app/(shell)/(storefront)/cart/page.tsx` **(modify)** — clear-cart button, coupon apply/remove UI, cross-sell row, real Subtotal/Shipping/Discount/Total breakdown.
- `components/checkout-order-summary.tsx` **(new)** — client component: delivery-speed radios + live Subtotal/Shipping/Discount/Total recompute.
- `app/(shell)/(storefront)/checkout/page.tsx` **(modify)** — use `CheckoutOrderSummary` in place of the static summary block.
- `components/checkout-button.tsx` **(modify)** — read `shippingMethod` from the form, pass to `placeOrderAction`.
- `lib/actions/checkout-actions.ts` **(modify)** — `placeOrderAction` accepts `shippingMethod`, re-validates the cart's coupon, records `discountCents`/`couponCode`/`shippingMethod` on the `Order`, increments `Coupon.timesRedeemed`.

---

### Task 1: Shipping-speed and coupon domain logic

**Files:**
- Modify: `lib/shipping.ts`
- Create: `lib/coupons.ts`

**Interfaces:**
- Produces: `SHIPPING_METHODS: Record<ShippingMethod, { label: string; days: string; surchargeCents: number }>`, `type ShippingMethod = "standard" | "express"`, `calculateShippingCents(subtotalCents: number, method?: ShippingMethod): number` — consumed by Tasks 5 and 6.
- Produces: `validateCoupon(code: string): Promise<{ valid: true; coupon: { code: string; percentOff: number | null; flatCents: number | null } } | { valid: false; error: string }>`, `calculateDiscountCents(subtotalCents: number, coupon: { percentOff: number | null; flatCents: number | null }): number` — consumed by Tasks 3, 5, and 6.

- [ ] **Step 1: Extend `lib/shipping.ts` with delivery-speed options**

Replace the full contents of `lib/shipping.ts` with:

```ts
// Flat-rate shipping, matching the copy on /shipping-returns and /faq:
// free above ₹4,500, otherwise a flat ₹549 fee. No carrier-rate integration (YAGNI).
const FREE_SHIPPING_THRESHOLD_CENTS = 450000;
const FLAT_SHIPPING_FEE_CENTS = 54900;

// Fixed delivery-speed tiers (no admin-configurable shipping methods - YAGNI
// per spec decision). Express adds a flat surcharge on top of the standard
// flat-rate/free-above-threshold calculation below.
export const SHIPPING_METHODS = {
  standard: { label: "Standard", days: "4-6 business days", surchargeCents: 0 },
  express: { label: "Express", days: "1-2 business days", surchargeCents: 19900 },
} as const;

export type ShippingMethod = keyof typeof SHIPPING_METHODS;

export function calculateShippingCents(subtotalCents: number, method: ShippingMethod = "standard"): number {
  const base = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_FEE_CENTS;
  return base + SHIPPING_METHODS[method].surchargeCents;
}
```

- [ ] **Step 2: Write `lib/coupons.ts`**

```ts
import { prisma } from "@/lib/db";

export type CouponRecord = { code: string; percentOff: number | null; flatCents: number | null };

export type CouponValidation = { valid: true; coupon: CouponRecord } | { valid: false; error: string };

export async function validateCoupon(code: string): Promise<CouponValidation> {
  const normalized = code.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });

  if (!coupon) return { valid: false, error: "Invalid coupon code." };
  if (!coupon.active) return { valid: false, error: "This coupon is no longer active." };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, error: "This coupon has expired." };
  if (coupon.maxRedemptions !== null && coupon.timesRedeemed >= coupon.maxRedemptions) {
    return { valid: false, error: "This coupon has reached its redemption limit." };
  }

  return { valid: true, coupon };
}

export function calculateDiscountCents(subtotalCents: number, coupon: CouponRecord): number {
  if (coupon.percentOff) return Math.round(subtotalCents * (coupon.percentOff / 100));
  if (coupon.flatCents) return Math.min(coupon.flatCents, subtotalCents);
  return 0;
}
```

- [ ] **Step 3: Insert a test coupon and verify both functions**

```bash
npx tsx -e "
import('./lib/db').then(async ({ prisma }) => {
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { code: 'WELCOME10', percentOff: 10, active: true },
  });
  console.log('seeded WELCOME10');
  await prisma.\$disconnect();
});
"
```

```bash
npx tsx -e "
import('./lib/coupons').then(async (m) => {
  console.log(await m.validateCoupon('welcome10'));
  console.log(await m.validateCoupon('NOPE'));
  console.log(m.calculateDiscountCents(100000, { code: 'WELCOME10', percentOff: 10, flatCents: null }));
});
"
```

Expected: first call prints `{ valid: true, coupon: { code: 'WELCOME10', ... } }` (confirms case-insensitive lookup), second prints `{ valid: false, error: 'Invalid coupon code.' }`, third prints `10000` (10% of ₹1,000.00).

```bash
npx tsx -e "
import('./lib/shipping').then((m) => {
  console.log(m.calculateShippingCents(100000)); // below threshold, standard
  console.log(m.calculateShippingCents(100000, 'express')); // below threshold, express
  console.log(m.calculateShippingCents(500000)); // above threshold, standard
  console.log(m.calculateShippingCents(500000, 'express')); // above threshold, express surcharge still applies
});
"
```

Expected: `54900`, `74800`, `0`, `19900`.

- [ ] **Step 4: Commit**

```bash
git add lib/shipping.ts lib/coupons.ts
git commit -m "Add delivery-speed tiers and coupon validation/discount logic"
```

---

### Task 2: Clear cart

**Files:**
- Modify: `lib/actions/cart-actions.ts`
- Modify: `app/(shell)/(storefront)/cart/page.tsx`

**Interfaces:**
- Produces: `clearCartAction(formData: FormData): Promise<void>` (plain form action, no args needed from the caller — matches `removeCartItemAction`'s style).

- [ ] **Step 1: Add the action**

In `lib/actions/cart-actions.ts`, add at the end:

```ts
export async function clearCartAction() {
  const cart = await getOrCreateCart();
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  revalidatePath("/", "layout");
}
```

- [ ] **Step 2: Add the button to the cart page**

In `app/(shell)/(storefront)/cart/page.tsx`, add the import:

```ts
import { updateCartItemAction, removeCartItemAction, clearCartAction } from "@/lib/actions/cart-actions";
```

Find the "Continue shopping" footer block:

```tsx
          <div className="rounded-[6px] border border-border bg-surface px-4 py-3">
            <Link href="/" className="text-xs font-semibold text-teal hover:text-teal-dark">
              ← Continue shopping
            </Link>
          </div>
```

Replace it with:

```tsx
          <div className="flex items-center justify-between rounded-[6px] border border-border bg-surface px-4 py-3">
            <Link href="/" className="text-xs font-semibold text-teal hover:text-teal-dark">
              ← Continue shopping
            </Link>
            <form action={clearCartAction}>
              <button type="submit" className="text-xs font-semibold text-muted-2 hover:text-danger">
                Clear cart
              </button>
            </form>
          </div>
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Add a couple of items to the cart, visit `/cart`, click "Clear cart" — confirm all items are removed and the empty-cart state renders.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/cart-actions.ts "app/(shell)/(storefront)/cart/page.tsx"
git commit -m "Add clear-cart action and button"
```

---

### Task 3: Coupon apply/remove on the cart page

**Files:**
- Modify: `lib/actions/cart-actions.ts`
- Create: `components/coupon-form.tsx`
- Modify: `app/(shell)/(storefront)/cart/page.tsx`

**Interfaces:**
- Consumes: `validateCoupon` from `@/lib/coupons` (Task 1).
- Produces: `applyCouponAction(code: string): Promise<{ success: true } | { success: false; error: string }>` (called directly from `CouponForm`), `removeCouponAction(formData: FormData): Promise<void>` (plain form action).

- [ ] **Step 1: Add the actions**

In `lib/actions/cart-actions.ts`, add the import and both actions:

```ts
import { validateCoupon } from "@/lib/coupons";
```

```ts
export type ApplyCouponResult = { success: true } | { success: false; error: string };

export async function applyCouponAction(code: string): Promise<ApplyCouponResult> {
  const trimmed = code.trim();
  if (!trimmed) return { success: false, error: "Enter a coupon code." };

  const validation = await validateCoupon(trimmed);
  if (!validation.valid) return { success: false, error: validation.error };

  const cart = await getOrCreateCart();
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: validation.coupon.code } });
  revalidatePath("/cart");
  revalidatePath("/checkout");

  return { success: true };
}

export async function removeCouponAction() {
  const cart = await getOrCreateCart();
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  revalidatePath("/cart");
  revalidatePath("/checkout");
}
```

- [ ] **Step 2: Write the client form**

Create `components/coupon-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { applyCouponAction } from "@/lib/actions/cart-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CouponForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await applyCouponAction(code);

    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setCode("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <Input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Promo code"
          className="flex-1"
        />
        <Button type="submit" variant="outline" size="sm" disabled={pending || !code.trim()}>
          {pending ? "Applying..." : "Apply"}
        </Button>
      </div>
      {error && <p className="text-[11px] font-medium text-danger">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 3: Add applied/unapplied coupon UI to the cart page's order-summary aside**

In `app/(shell)/(storefront)/cart/page.tsx`, add the imports:

```ts
import { removeCouponAction } from "@/lib/actions/cart-actions";
import { CouponForm } from "@/components/coupon-form";
```

This task only adds the coupon input/applied-state UI; Task 5 rewrites the surrounding Subtotal/Shipping/Discount/Total block in the same aside, so leave the numeric lines as they are for now and just insert this block right after the `<h2 className="text-sm font-bold tracking-tight">Order summary</h2>` line:

```tsx
          {cart.couponCode ? (
            <div className="flex items-center justify-between rounded-[5px] bg-teal-tint/40 px-2.5 py-2 text-xs">
              <span className="font-semibold text-teal-dark">{cart.couponCode} applied</span>
              <form action={removeCouponAction}>
                <button type="submit" className="font-semibold text-muted-2 hover:text-danger">
                  Remove
                </button>
              </form>
            </div>
          ) : (
            <CouponForm />
          )}
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```

On `/cart`, enter `nope` and click Apply — confirm "Invalid coupon code." shows inline. Enter `WELCOME10` (seeded in Task 1) — confirm it switches to the "WELCOME10 applied" state with a Remove button, and clicking Remove switches back to the input.

- [ ] **Step 5: Commit**

```bash
git add lib/actions/cart-actions.ts components/coupon-form.tsx "app/(shell)/(storefront)/cart/page.tsx"
git commit -m "Add coupon apply/remove to the cart page"
```

---

### Task 4: Cross-sell row on the cart page

**Files:**
- Modify: `lib/cart.ts`
- Modify: `lib/products/queries.ts`
- Modify: `app/(shell)/(storefront)/cart/page.tsx`

**Interfaces:**
- Produces: `getCartCrossSell(items: { productId: string; categoryId: string }[], limit?: number)` — returns the same shape as `getFeaturedProducts()` (usable directly by `ProductCard`).

- [ ] **Step 1: Expose `categoryId` on cart items**

In `lib/cart.ts`, in `cartInclude.items.include.product.select`, add `categoryId: true`:

```ts
const cartInclude = {
  items: {
    orderBy: { id: "asc" as const },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          priceCents: true,
          stockQuantity: true,
          status: true,
          categoryId: true,
          images: { select: { url: true, altText: true }, orderBy: { position: "asc" as const }, take: 1 },
        },
      },
    },
  },
};
```

- [ ] **Step 2: Add the cross-sell query**

In `lib/products/queries.ts`, add:

```ts
export async function getCartCrossSell(items: { productId: string; categoryId: string }[], limit = 6) {
  if (items.length === 0) return [];

  const categoryIds = [...new Set(items.map((i) => i.categoryId))];
  const excludeIds = items.map((i) => i.productId);

  return prisma.product.findMany({
    where: { status: "ACTIVE", categoryId: { in: categoryIds }, id: { notIn: excludeIds } },
    orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: listItemSelect,
  });
}
```

- [ ] **Step 3: Render the row on the cart page**

In `app/(shell)/(storefront)/cart/page.tsx`, add the imports:

```ts
import { getCartCrossSell } from "@/lib/products/queries";
import { getWishlistedProductIds } from "@/lib/wishlist";
import { ProductCard } from "@/components/product-card";
```

Right after `const items = cart?.items ?? [];` (still before the empty-cart early return, since cross-sell only matters when there are items — but the empty-cart branch returns early anyway, so it's safe to compute cross-sell just after that early return instead), add, right after the empty-cart `if` block:

```ts
  const [crossSell, wishlistedIds] = await Promise.all([
    getCartCrossSell(items.map((item) => ({ productId: item.productId, categoryId: item.product.categoryId }))),
    getWishlistedProductIds(),
  ]);
```

Add the row after the closing `</div>` of the `grid grid-cols-1 items-start gap-3 lg:grid-cols-[1fr_340px]` block (i.e. as the last element in the page, a sibling of that grid, still inside the outer `flex flex-col gap-3 p-3` wrapper):

```tsx
      {crossSell.length > 0 && (
        <section className="rounded-[6px] border border-border bg-surface p-4">
          <h2 className="mb-3 text-[15px] font-bold tracking-tight">You might also like</h2>
          <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-6">
            {crossSell.map((item) => (
              <ProductCard key={item.id} product={item} isWishlisted={wishlistedIds.has(item.id)} />
            ))}
          </div>
        </section>
      )}
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Add a product to the cart, visit `/cart`, confirm a "You might also like" row appears below with other products from the same category, none of which are already in the cart.

- [ ] **Step 5: Commit**

```bash
git add lib/cart.ts lib/products/queries.ts "app/(shell)/(storefront)/cart/page.tsx"
git commit -m "Add same-category cross-sell row to the cart page"
```

---

### Task 5: Itemized order-summary breakdown on the cart page

**Files:**
- Modify: `app/(shell)/(storefront)/cart/page.tsx`

**Interfaces:**
- Consumes: `calculateShippingCents` (Task 1), `validateCoupon` + `calculateDiscountCents` (Task 1).

- [ ] **Step 1: Compute the real breakdown**

In `app/(shell)/(storefront)/cart/page.tsx`, add the imports:

```ts
import { calculateShippingCents } from "@/lib/shipping";
import { validateCoupon, calculateDiscountCents } from "@/lib/coupons";
```

Replace:

```ts
  const subtotalCents = items.reduce((sum, item) => sum + item.quantity * item.product.priceCents, 0);
```

with:

```ts
  const subtotalCents = items.reduce((sum, item) => sum + item.quantity * item.product.priceCents, 0);
  const shippingCents = calculateShippingCents(subtotalCents);

  let discountCents = 0;
  if (cart?.couponCode) {
    const validation = await validateCoupon(cart.couponCode);
    if (validation.valid) discountCents = calculateDiscountCents(subtotalCents, validation.coupon);
  }

  const totalCents = subtotalCents + shippingCents - discountCents;
```

- [ ] **Step 2: Replace the placeholder Total block with the real breakdown**

Replace:

```tsx
          <div className="flex justify-between text-xs text-ink-3">
            <span>Subtotal ({items.length} items)</span>
            <span className="font-semibold text-ink">{formatMoney(subtotalCents)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-border-subtle pt-3">
            <span className="text-sm font-bold">Total</span>
            <span className="text-[22px] font-extrabold tracking-tight">{formatMoney(subtotalCents)}</span>
          </div>
          <p className="text-[11px] text-muted-2">Shipping and taxes calculated at checkout.</p>
```

with:

```tsx
          <div className="flex flex-col gap-1.5 text-xs text-ink-3">
            <div className="flex justify-between">
              <span>Subtotal ({items.length} items)</span>
              <span className="font-semibold text-ink">{formatMoney(subtotalCents)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping estimate</span>
              <span className="font-semibold text-teal-dark">{shippingCents === 0 ? "Free" : formatMoney(shippingCents)}</span>
            </div>
            {discountCents > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="font-semibold text-danger">-{formatMoney(discountCents)}</span>
              </div>
            )}
          </div>
          <div className="flex items-baseline justify-between border-t border-border-subtle pt-3">
            <span className="text-sm font-bold">Total</span>
            <span className="text-[22px] font-extrabold tracking-tight">{formatMoney(totalCents)}</span>
          </div>
          <p className="text-[11px] text-muted-2">Final shipping speed is chosen at checkout.</p>
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Add items totaling under ₹4,500, visit `/cart` — confirm Shipping estimate shows ₹549.00 and Total = Subtotal + ₹549.00. Apply `WELCOME10` — confirm a Discount line appears and Total drops by 10% of the subtotal. Add enough items to cross ₹4,500 — confirm Shipping estimate shows "Free".

- [ ] **Step 4: Commit**

```bash
git add "app/(shell)/(storefront)/cart/page.tsx"
git commit -m "Show real Subtotal/Shipping/Discount/Total breakdown on the cart page"
```

---

### Task 6: Checkout delivery-speed selection + real breakdown + order recording

**Files:**
- Create: `components/checkout-order-summary.tsx`
- Modify: `app/(shell)/(storefront)/checkout/page.tsx`
- Modify: `components/checkout-button.tsx`
- Modify: `lib/actions/checkout-actions.ts`

**Interfaces:**
- Consumes: `SHIPPING_METHODS`, `ShippingMethod`, `calculateShippingCents` (Task 1); `calculateDiscountCents`, `validateCoupon` (Task 1).
- Produces: `placeOrderAction(addressId: string, shippingMethod: ShippingMethod): Promise<PlaceOrderResult>` — signature change from the current `placeOrderAction(addressId: string)`, consumed by `CheckoutButton` (this task).

- [ ] **Step 1: Write the interactive order-summary component**

Create `components/checkout-order-summary.tsx`:

```tsx
"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { calculateShippingCents, SHIPPING_METHODS, type ShippingMethod } from "@/lib/shipping";
import { CheckoutButton } from "@/components/checkout-button";

export function CheckoutOrderSummary({
  subtotalCents,
  discountCents,
  formId,
  checkoutDisabled,
}: {
  subtotalCents: number;
  discountCents: number;
  formId: string;
  checkoutDisabled: boolean;
}) {
  const [method, setMethod] = useState<ShippingMethod>("standard");
  const shippingCents = calculateShippingCents(subtotalCents, method);
  const totalCents = subtotalCents + shippingCents - discountCents;

  return (
    <div className="flex flex-col gap-2.5 rounded-[6px] border border-border bg-surface p-4">
      <h2 className="text-sm font-bold tracking-tight">Order summary</h2>

      <fieldset className="flex flex-col gap-2 border-t border-border-subtle pt-3">
        <legend className="mb-1 text-xs font-bold text-ink">Delivery speed</legend>
        {(Object.keys(SHIPPING_METHODS) as ShippingMethod[]).map((key) => {
          const option = SHIPPING_METHODS[key];
          const cost = calculateShippingCents(subtotalCents, key);
          return (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between gap-2 rounded-[5px] border border-border p-2.5 text-xs has-checked:border-[1.5px] has-checked:border-teal has-checked:bg-teal-tint/40"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  form={formId}
                  name="shippingMethod"
                  value={key}
                  defaultChecked={key === "standard"}
                  onChange={() => setMethod(key)}
                />
                <span>
                  <span className="font-semibold text-ink">{option.label}</span>
                  <br />
                  <span className="text-ink-3">{option.days}</span>
                </span>
              </span>
              <span className="font-semibold text-ink">{cost === 0 ? "Free" : formatMoney(cost)}</span>
            </label>
          );
        })}
      </fieldset>

      <div className="flex flex-col gap-2 border-t border-border-subtle pt-3 text-xs text-ink-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold text-ink">{formatMoney(subtotalCents)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="font-semibold text-teal-dark">{shippingCents === 0 ? "Free" : formatMoney(shippingCents)}</span>
        </div>
        {discountCents > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span className="font-semibold text-danger">-{formatMoney(discountCents)}</span>
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between border-t border-border-subtle pt-3">
        <span className="text-sm font-bold">Total</span>
        <span className="text-[22px] font-extrabold tracking-tight">{formatMoney(totalCents)}</span>
      </div>

      <CheckoutButton formId={formId} disabled={checkoutDisabled} />
    </div>
  );
}
```

Note: this duplicates the "Subtotal / Shipping / Discount / Total" markup shape from Task 5's cart page. That's an intentional small duplication, not an abstraction to force — the cart version is static (a Server Component, no delivery-speed choice yet), this one is interactive (`"use client"`, recomputes on radio change); merging them would mean passing render-prop children across a server/client boundary for a 15-line block, which is worse than the duplication.

- [ ] **Step 2: Use it on the checkout page**

In `app/(shell)/(storefront)/checkout/page.tsx`, add the import:

```ts
import { calculateDiscountCents, validateCoupon } from "@/lib/coupons";
import { CheckoutOrderSummary } from "@/components/checkout-order-summary";
```

Remove the now-unused `calculateShippingCents` import and the `shippingCents`/`totalCents` lines (the new component computes these itself), replacing:

```ts
  const subtotalCents = cart.items.reduce((sum, item) => sum + item.quantity * item.product.priceCents, 0);
  const shippingCents = calculateShippingCents(subtotalCents);
  const totalCents = subtotalCents + shippingCents;
```

with:

```ts
  const subtotalCents = cart.items.reduce((sum, item) => sum + item.quantity * item.product.priceCents, 0);

  let discountCents = 0;
  if (cart.couponCode) {
    const validation = await validateCoupon(cart.couponCode);
    if (validation.valid) discountCents = calculateDiscountCents(subtotalCents, validation.coupon);
  }
```

Replace the entire `<aside>` block:

```tsx
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
```

with:

```tsx
        <aside className="flex flex-col gap-3">
          <CheckoutOrderSummary
            subtotalCents={subtotalCents}
            discountCents={discountCents}
            formId="checkout-form"
            checkoutDisabled={addresses.length === 0 || stockIssues.length > 0}
          />
          {stockIssues.length > 0 && (
            <p className="text-xs font-medium text-danger">Resolve the stock issues above before placing your order.</p>
          )}
        </aside>
```

- [ ] **Step 3: Read `shippingMethod` in `CheckoutButton` and pass it through**

In `components/checkout-button.tsx`, add the import:

```ts
import type { ShippingMethod } from "@/lib/shipping";
```

Then update `handleClick`:

```tsx
  async function handleClick() {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    const formData = form ? new FormData(form) : null;
    const addressId = formData ? String(formData.get("addressId") ?? "") : "";
    const shippingMethod = (formData ? String(formData.get("shippingMethod") ?? "standard") : "standard") as ShippingMethod;
    if (!addressId) {
      setError("Choose a shipping address to continue.");
      return;
    }

    setPending(true);
    setError(null);

    const result = await placeOrderAction(addressId, shippingMethod);
```

(Only the first several lines of `handleClick` change — the rest of the function, from `if (!result.success)` onward, stays exactly as-is.)

- [ ] **Step 4: Update `placeOrderAction` to accept shipping method and record the coupon**

In `lib/actions/checkout-actions.ts`, update the imports:

```ts
import { calculateShippingCents, type ShippingMethod } from "@/lib/shipping";
import { validateCoupon, calculateDiscountCents } from "@/lib/coupons";
```

Replace the function signature and body from `export async function placeOrderAction` through the `prisma.order.create` call's closing `});`:

```ts
export async function placeOrderAction(addressId: string, shippingMethod: ShippingMethod): Promise<PlaceOrderResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in to check out." };
  if (!addressId) return { success: false, error: "Choose a shipping address to continue." };

  const [address, cart] = await Promise.all([
    prisma.address.findFirst({ where: { id: addressId, userId: session.user.id } }),
    getCart(),
  ]);

  if (!address) return { success: false, error: "Choose a shipping address to continue." };
  if (!cart || cart.items.length === 0) return { success: false, error: "Your cart is empty." };

  const hasStockIssue = cart.items.some(
    (item) => item.product.status !== "ACTIVE" || item.quantity > item.product.stockQuantity
  );
  if (hasStockIssue) {
    return { success: false, error: "Some items in your cart are no longer available. Review your cart." };
  }

  const subtotalCents = cart.items.reduce((sum, item) => sum + item.quantity * item.product.priceCents, 0);
  const shippingCents = calculateShippingCents(subtotalCents, shippingMethod);

  let discountCents = 0;
  let couponCode: string | null = null;
  if (cart.couponCode) {
    const validation = await validateCoupon(cart.couponCode);
    if (validation.valid) {
      discountCents = calculateDiscountCents(subtotalCents, validation.coupon);
      couponCode = validation.coupon.code;
    }
  }

  const totalCents = subtotalCents + shippingCents - discountCents;
  const orderNumber = generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: session.user.id,
      email: session.user.email ?? address.fullName,
      status: "PENDING",
      subtotalCents,
      shippingCents,
      taxCents: 0,
      discountCents,
      couponCode,
      shippingMethod,
      totalCents,
      currency: "inr",
      shipName: address.fullName,
      shipLine1: address.line1,
      shipLine2: address.line2,
      shipCity: address.city,
      shipState: address.state,
      shipPostalCode: address.postalCode,
      shipCountry: address.country,
      shipPhone: address.phone,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          productSlug: item.product.slug,
          productImageUrl: item.product.images[0]?.url,
          unitPriceCents: item.product.priceCents,
          quantity: item.quantity,
          lineTotalCents: item.quantity * item.product.priceCents,
        })),
      },
    },
  });

  if (couponCode) {
    await prisma.coupon.update({ where: { code: couponCode }, data: { timesRedeemed: { increment: 1 } } });
  }
```

(Everything after this — the Razorpay order creation and the return — stays exactly as it already is.)

- [ ] **Step 5: Verify**

```bash
npm run dev
```

Add items under ₹4,500 to the cart, apply `WELCOME10`, go to `/checkout`. Confirm: selecting "Standard" shows ₹549.00 shipping and a Discount line; selecting "Express" instantly updates shipping to ₹748.00 (₹549 + ₹199) and recomputes Total, live, without a page reload. Place the order (full Razorpay test-mode flow) and confirm afterward:

```bash
npx tsx -e "
import('./lib/db').then(async ({ prisma }) => {
  const order = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' }, select: { orderNumber: true, shippingMethod: true, couponCode: true, discountCents: true, shippingCents: true, totalCents: true } });
  console.log(order);
  await prisma.\$disconnect();
});
"
```

Expected: `shippingMethod` matches what you selected, `couponCode: 'WELCOME10'`, `discountCents` matches 10% of that order's subtotal, and `totalCents` = subtotal + shippingCents - discountCents.

- [ ] **Step 6: Commit**

```bash
git add components/checkout-order-summary.tsx "app/(shell)/(storefront)/checkout/page.tsx" components/checkout-button.tsx lib/actions/checkout-actions.ts
git commit -m "Add checkout delivery-speed selection and record coupon/shipping-method on Order"
```

---

## Post-plan verification checklist

- [ ] Cart: "Clear cart" empties all items
- [ ] Cart: invalid/expired/limit-reached coupon codes show a specific inline error; a valid code shows "applied" state with Remove
- [ ] Cart: "You might also like" shows same-category, in-stock products, excluding anything already in the cart
- [ ] Cart: Subtotal/Shipping estimate/Discount(if any)/Total are all real numbers, Total is no longer just Subtotal
- [ ] Checkout: switching Standard/Express instantly updates shipping cost and Total with no page reload
- [ ] Checkout: a placed order's `Order` row has the correct `shippingMethod`, `couponCode`, `discountCents`, `shippingCents`, `totalCents`
- [ ] A coupon's `timesRedeemed` increments by exactly 1 per completed order that used it
- [ ] Run the `checkout-walkthrough` skill — this plan directly modifies `placeOrderAction`'s money math, the highest-risk regression surface in the whole storefront

**This completes the Storefront Functionality phase.** Remaining deferred sections (Account, Admin, Static/legal + Auth) are separate specs to be brainstormed individually, per `2026-08-03-storefront-functionality-design.md`'s closing note.
