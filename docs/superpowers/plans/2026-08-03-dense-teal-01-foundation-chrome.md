# Dense Teal Redesign — Plan 1: Foundation & Shared Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the app's default shadcn theme with the "Dense Teal" design tokens, restyle the shared `Button` primitive, add `Input` and `StatusPill` primitives, and rebuild the site header/footer/account-nav/admin-nav to match the design handoff — with zero changes to data-fetching, Server Actions, or routes.

**Architecture:** Tailwind v4 CSS-variable theme (`app/globals.css`) is the single source of truth for color/radius tokens, registered via `@theme inline` so every page gets utility classes like `bg-teal`, `text-ink-3`, `bg-chrome-deep` directly. Shared primitives (`Button`, `Input`, `StatusPill`) live in `components/ui/`. Chrome components (`SiteHeader`, `SiteFooter`, `AccountNav`, `AdminNav`) keep their existing self-contained data-fetching pattern (each fetches what it needs via `auth()`/existing query functions) — only markup and styling change.

**Tech Stack:** Next.js 16, Tailwind CSS v4, `@base-ui/react` (used for `Button`/`Autocomplete` primitives), `class-variance-authority`, `next/font/google` (Archivo, JetBrains Mono).

## Global Constraints

- No new Server Actions, API routes, database queries, or schema changes anywhere in this plan — visual/markup and CSS-token changes only.
- Design tokens (colors, type scale, spacing, radii) are defined in `design_handoff_meridian_dense_teal/README.md` — hex/px values below are copied from it verbatim; do not approximate.
- This codebase has no test runner (`package.json` scripts: `dev`, `build`, `start`, `lint`, `postinstall` only — no `test` script, no `*.test.*`/`*.spec.*` files anywhere). Each task's verification step is `npm run lint`, `npx tsc --noEmit`, and a visual check against `design_handoff_meridian_dense_teal/screenshots/` — not an automated test suite. Do not add a test framework as part of this plan.
- Route paths are unchanged (`/c/[slug]`, `/p/[slug]`, `/auth-error`, `/verify-request`, etc.) — the design handoff's route column uses different shorthand names; ignore those, keep the app's real routes.
- Interactive-looking elements that don't yet have backing functionality (none exist in this plan's scope, but keep this constraint in mind for later plans) render per the design and stay inert — no network call, no error, just a no-op.
- Dark-mode is out of scope — the app has no dark-mode toggle (`next-themes` is not installed, no `dark:` classes exist in `app/`). Remove the unused `.dark` CSS block rather than updating it.
- **Table styling** (spec: "header row `#F7F9FB` + 10px/700/0.08em uppercase `#64748B`; body rows 11–12px with 1px `#EEF1F4` dividers; numeric columns right-aligned; SKU/order columns in JetBrains Mono; attention rows tint `#FFFBF5`") is deliberately *not* built as a shared `<Table>` component in this plan — the ~6 admin tables (Products/Orders/Customers/Reviews/Order-items/Customer-order-history) differ enough in column shape that forcing a generic wrapper now would be premature abstraction. Instead, apply these exact classes directly in each table's markup when the Admin plan restyles it: header row `bg-surface-muted`, header cell `text-[10px] font-bold tracking-[0.08em] text-ink-3 uppercase`, row divider `border-border-subtle`, numeric cell `text-right`, SKU/order-number cell `font-mono`, attention row `bg-[#FFFBF5]`.
- **Toggle switch** (spec: 38×21 pill, `@base-ui/react/switch` is available and is the right primitive to build it on when needed) is deliberately *not* built in this plan — every page that would use it (Account Settings notification toggles, Admin Product Edit visibility toggles) is itself a deferred feature with no Phase-1 UI to attach it to. Build it as part of whichever later plan first implements one of those features, not speculatively here.

---

### Task 1: Replace design tokens in `app/globals.css`

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Produces: Tailwind utility classes for every Dense Teal token, usable in all later tasks/plans: `bg-canvas`/`text-canvas`, `bg-surface`, `bg-surface-muted`, `border-border-subtle`, `border-border-mid`, `text-ink`, `text-ink-2`, `text-ink-3`, `text-muted-2`, `bg-chrome-deep`, `bg-chrome-top`, `bg-chrome-nav`, `bg-teal`/`text-teal`/`border-teal`, `bg-teal-dark`/`text-teal-dark`, `bg-teal-bright`/`text-teal-bright`, `bg-teal-tint`, `bg-teal-bar`, `bg-danger`/`text-danger`/`border-danger`, `bg-danger-dark`/`text-danger-dark`, `bg-danger-tint`, `border-danger-border`, `text-warn`, `bg-warn-tint`, `text-success`, `bg-success-tint`, `text-info`, `bg-info-tint`, `text-neutral-badge`, `bg-neutral-badge-tint`. Also keeps existing shadcn-semantic classes working (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, `bg-muted`, `bg-destructive`, etc.) now mapped onto Dense Teal values.
- Produces: `--radius-sm` (3px), `--radius-md` (4px), `--radius-lg` (6px) tokens — `rounded-sm`/`rounded-md`/`rounded-lg` utilities now resolve to these fixed pixel values instead of the old proportional `calc()` scale.

- [ ] **Step 1: Replace the file contents**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-heading: var(--font-sans);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);

  --color-canvas: #EEF1F4;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F7F9FB;
  --color-border-subtle: #EEF1F4;
  --color-border-mid: #E5EAEF;
  --color-ink: #0F172A;
  --color-ink-2: #334155;
  --color-ink-3: #475569;
  --color-muted-2: #94A3B8;
  --color-chrome-deep: #0F2027;
  --color-chrome-top: #0A161B;
  --color-chrome-nav: #16323B;
  --color-teal: #0D9488;
  --color-teal-dark: #0B7F75;
  --color-teal-bright: #2DD4BF;
  --color-teal-tint: #E7F5F3;
  --color-teal-bar: #CDEAE6;
  --color-danger: #DC2626;
  --color-danger-dark: #B91C1C;
  --color-danger-tint: #FEE2E2;
  --color-danger-border: #F3C7C7;
  --color-warn: #92400E;
  --color-warn-tint: #FEF3C7;
  --color-success: #166534;
  --color-success-tint: #DCFCE7;
  --color-info: #075985;
  --color-info-tint: #E0F2FE;
  --color-neutral-badge: #475569;
  --color-neutral-badge-tint: #E2E8F0;

  --radius-sm: 3px;
  --radius-md: 4px;
  --radius-lg: 6px;
  --radius-xl: 8px;
  --radius-2xl: 10px;
  --radius-3xl: 12px;
  --radius-4xl: 16px;
}

:root {
  --background: #EEF1F4;
  --foreground: #0F172A;
  --card: #FFFFFF;
  --card-foreground: #0F172A;
  --popover: #FFFFFF;
  --popover-foreground: #0F172A;
  --primary: #0D9488;
  --primary-foreground: #FFFFFF;
  --secondary: #F7F9FB;
  --secondary-foreground: #475569;
  --muted: #F7F9FB;
  --muted-foreground: #64748B;
  --accent: #E7F5F3;
  --accent-foreground: #0F172A;
  --destructive: #DC2626;
  --border: #DBE2E8;
  --input: #DBE2E8;
  --ring: #0D9488;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
```

This removes the old oklch grayscale values, the unused `.dark` block, and the unused `--chart-*`/`--sidebar-*` tokens (confirmed zero references to either anywhere in `components/` or `app/`).

- [ ] **Step 2: Verify Tailwind compiles the new tokens**

Run: `npx tsc --noEmit` (should still pass — this file has no TS to typecheck, this just confirms Step 1 didn't break the build config) then `npm run dev` (or reuse an already-running dev server) and load `http://localhost:3000/` in a browser. Expected: the page background is now light grey (`#EEF1F4`) instead of white, confirming the token swap took effect. Existing layout will look unstyled/broken in places until later tasks — that's expected at this point.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "Replace shadcn default theme with Dense Teal design tokens"
```

---

### Task 2: Swap fonts to Archivo + JetBrains Mono

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `--font-sans` / `--font-mono` CSS variable names expected by `app/globals.css`'s `@theme inline` block (Task 1).
- Produces: `font-sans` Tailwind utility now renders Archivo; `font-mono` renders JetBrains Mono.

**Note:** the original file set `Geist({ variable: "--font-geist-sans" })` but `globals.css` read `--font-sans: var(--font-sans)` (self-referential, not `--font-geist-sans`) — so Geist Sans was likely never actually applied via CSS. Naming the font variable `--font-sans` directly (as below) fixes this and is required for Archivo to render.

- [ ] **Step 1: Replace the file contents**

```tsx
import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Meridian",
    template: "%s | Meridian",
  },
  description: "Everything you need, shipped fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Verify the font loads**

Run: `npx tsc --noEmit`. Expected: no errors (confirms `Archivo`/`JetBrains_Mono` export names are correct for the installed `next` version). Then reload `http://localhost:3000/` — expected: body text now renders in Archivo (geometric grotesque, distinct from the previous Geist sans).

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "Swap Geist fonts for Archivo + JetBrains Mono"
```

---

### Task 3: Remap `Button` variants to Dense Teal

**Files:**
- Modify: `components/ui/button.tsx`

**Interfaces:**
- Consumes: `bg-teal`, `text-teal`, `border-teal`, `bg-teal-dark`, `text-teal-dark`, `bg-chrome-deep`, `bg-surface`, `bg-surface-muted`, `border-border`, `text-ink`, `text-ink-3`, `border-danger`, `text-danger`, `bg-danger-tint` utilities (Task 1).
- Produces: `Button` component with variants `default` (primary, teal fill), `outline` (secondary, white+border), `dark` (new — `#0F2027` fill, for Buy-now/Apply-style actions), `secondary` (weaker white-muted fill), `ghost`, `destructive` (white fill, red border+text), `link` — same prop API as before (`variant`, `size`, all native button props via `ButtonPrimitive.Props`), so no call sites need signature changes, only visual output changes. `variant="dark"` is new and available to any later task.

- [ ] **Step 1: Replace the file contents**

```tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[5px] border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:border-[1.5px] focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/[0.18] aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-teal text-white hover:bg-teal-dark",
        outline:
          "border-border bg-surface text-ink-3 hover:bg-surface-muted aria-expanded:bg-surface-muted aria-expanded:text-ink",
        dark: "bg-chrome-deep text-white hover:opacity-90",
        secondary:
          "bg-surface-muted text-ink-3 hover:bg-border-subtle aria-expanded:bg-surface-muted aria-expanded:text-ink",
        ghost: "hover:bg-surface-muted hover:text-ink aria-expanded:bg-surface-muted aria-expanded:text-ink",
        destructive: "border-danger bg-surface text-danger hover:bg-danger-tint",
        link: "text-teal underline-offset-4 hover:underline hover:text-teal-dark",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

- [ ] **Step 2: Verify existing usages still typecheck and render**

Run: `npx tsc --noEmit`. Expected: no errors — every existing `variant="..."` call site (`default`, `outline`, `secondary`, `ghost`, `destructive`, `link`) still matches a key in the new `variants.variant` map.

Run: `npm run lint`. Expected: no new errors.

Reload `http://localhost:3000/signin` in a browser (has a visible `secondary`/`ghost` button) and `http://localhost:3000/cart` (has a `default` button) — expected: primary buttons are teal, no visual regressions like invisible text or missing borders.

- [ ] **Step 3: Commit**

```bash
git add components/ui/button.tsx
git commit -m "Remap Button variants to Dense Teal palette, add dark variant"
```

---

### Task 4: Add `Input` primitive, apply it to `AddressForm`

**Files:**
- Create: `components/ui/input.tsx`
- Modify: `components/address-form.tsx`

**Interfaces:**
- Produces: `Input` component — `React.ComponentProps<"input">`, renders a native `<input>` styled per the design's input spec (white surface, 1px border, radius 5px, 10px/11px padding, 12px text, teal focus ring, red `aria-invalid` state). Forwards `className` and all native input props unchanged, so it's a drop-in replacement for raw `<input>` elements.
- Consumes: `border-border`, `bg-surface`, `text-ink`, `text-muted-2`, `border-teal`, `border-danger` utilities (Task 1).

- [ ] **Step 1: Create the Input primitive**

```tsx
import { cn } from "@/lib/utils"

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "flex h-auto w-full rounded-[5px] border border-border bg-surface px-[11px] py-[10px] text-xs text-ink outline-none transition-colors placeholder:text-muted-2 focus-visible:border-[1.5px] focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/[0.18] aria-invalid:border-[1.5px] aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
```

- [ ] **Step 2: Use it in `AddressForm`'s `Field` helper**

In `components/address-form.tsx`, add the import and replace the raw `<input>`:

```tsx
import { createAddressAction, updateAddressAction } from "@/lib/actions/address-actions";
import type { AddressListItem } from "@/lib/addresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
```

Replace the `Field` function's body:

```tsx
function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-medium text-ink-3">{label}</span>
      <Input type={type} name={name} defaultValue={defaultValue} required={required} />
    </label>
  );
}
```

(Only `Field`'s internals change here — the surrounding form's grid/spacing layout is left as-is; it gets a full pass in the Account plan.)

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no errors.

Reload `http://localhost:3000/account/addresses` (requires being signed in — reuse the existing "Demo Admin" session if still active from the earlier screenshot pass, otherwise sign in via `/signin`) and open the "Add address" form. Expected: text inputs now have a visibly rounded 5px border, teal focus ring on click, 12px text.

- [ ] **Step 4: Commit**

```bash
git add components/ui/input.tsx components/address-form.tsx
git commit -m "Add Input primitive, apply to AddressForm"
```

---

### Task 5: Add `StatusPill` primitive

**Files:**
- Create: `components/ui/status-pill.tsx`

**Interfaces:**
- Produces: `StatusPill` component — props `{ tone: "danger" | "warn" | "success" | "info" | "neutral" } & React.ComponentProps<"span">`. Renders a `<span>` with the tone's text/background pair, 9px/700/uppercase, radius 3px, padding 4-6px. Exports the `StatusPillTone` type for later plans to use when mapping domain status enums (order status, review status, stock level) to a tone.
- Consumes: `bg-danger-tint`, `text-danger-dark`, `bg-warn-tint`, `text-warn`, `bg-success-tint`, `text-success`, `bg-info-tint`, `text-info`, `bg-neutral-badge-tint`, `text-neutral-badge` utilities (Task 1).

No page wires this up yet in this plan — the Account and Admin plans (which restyle the pages that display `order.status`, review status, and stock-level text) will be the first consumers. Verification here is limited to typecheck/lint since there's no render site yet.

- [ ] **Step 1: Create the primitive**

```tsx
import { cn } from "@/lib/utils"

const STATUS_PILL_TONE_CLASSES = {
  danger: "bg-danger-tint text-danger-dark",
  warn: "bg-warn-tint text-warn",
  success: "bg-success-tint text-success",
  info: "bg-info-tint text-info",
  neutral: "bg-neutral-badge-tint text-neutral-badge",
} as const

type StatusPillTone = keyof typeof STATUS_PILL_TONE_CLASSES

function StatusPill({
  tone,
  className,
  ...props
}: React.ComponentProps<"span"> & { tone: StatusPillTone }) {
  return (
    <span
      data-slot="status-pill"
      className={cn(
        "inline-flex items-center rounded-[3px] px-[6px] py-[4px] text-[9px] font-bold tracking-wide uppercase",
        STATUS_PILL_TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  )
}

export { StatusPill }
export type { StatusPillTone }
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no errors (unused-export lint rules, if any, should not flag this — it's a shared component under `components/ui/`, the same pattern as `Button`/`Input` which are also not exhaustively used yet by every possible call site).

- [ ] **Step 3: Commit**

```bash
git add components/ui/status-pill.tsx
git commit -m "Add StatusPill primitive"
```

---

### Task 6: Restructure `SiteHeader` into the 3-tier Dense Teal chrome

**Files:**
- Modify: `components/site-header.tsx`
- Modify: `components/search-autocomplete.tsx`

**Interfaces:**
- Consumes: `Button` (Task 3, `variant="dark"`), `auth()`, `getTopLevelCategories()`, `getCart()`/`cartItemCount()`, `signOutAction` — all existing, unchanged.
- No new interfaces produced — `SiteHeader` remains a zero-prop exported async component used by `app/(shell)/layout.tsx`.

Reference: `design_handoff_meridian_dense_teal/Chrome.dc.html`, `design_handoff_meridian_dense_teal/screenshots/01 Home.png` (top of page).

- [ ] **Step 1: Replace `components/site-header.tsx`**

```tsx
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getTopLevelCategories } from "@/lib/categories/queries";
import { signOutAction } from "@/lib/actions/auth-actions";
import { getCart, cartItemCount } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { SearchAutocomplete } from "@/components/search-autocomplete";

export async function SiteHeader() {
  const [session, categories, cart] = await Promise.all([auth(), getTopLevelCategories(), getCart()]);
  const itemCount = cartItemCount(cart);

  return (
    <header>
      <div className="flex items-center justify-between gap-4 bg-chrome-top px-6 py-[7px] text-[11px] font-medium tracking-wide text-muted-2">
        <span>FREE DELIVERY OVER ₹499 · SAME-DAY DISPATCH FROM BENGALURU</span>
        <div className="hidden items-center gap-[18px] sm:flex">
          <Link href="/faq" className="hover:text-white">
            Help centre
          </Link>
          <span>Track order</span>
          <span>Sell on Meridian</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 bg-chrome-deep px-6 py-3">
        <Link href="/" className="shrink-0 text-[19px] font-extrabold tracking-tight text-white">
          MERIDIAN
        </Link>

        <SearchAutocomplete />

        <nav className="ml-auto flex flex-wrap items-center gap-[18px] text-xs font-medium text-[#cbd5e1]">
          <Link
            href="/cart"
            className="font-bold text-teal-bright hover:text-white"
          >
            Cart{itemCount > 0 && ` (${itemCount})`}
          </Link>

          {session?.user ? (
            <>
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="hover:text-white">
                  Admin
                </Link>
              )}
              <Link href="/account/orders" className="hover:text-white">
                Orders
              </Link>
              <Link href="/account/wishlist" className="hover:text-white">
                Wishlist
              </Link>
              <Link href="/account" className="hover:text-white">
                {session.user.name ?? session.user.email}
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-[5px] border border-[#2f4b55] px-[11px] py-[7px] text-[#cbd5e1] hover:border-teal-bright hover:text-white"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/signin">
              <Button type="button" variant="dark" size="sm" className="border border-[#2f4b55]">
                Sign in
              </Button>
            </Link>
          )}
        </nav>
      </div>

      {categories.length > 0 && (
        <div className="bg-chrome-nav px-6 py-[9px]">
          <nav className="flex items-center gap-[18px] overflow-x-auto text-xs font-medium text-[#cbd5e1]">
            <span className="shrink-0 font-bold text-white">All categories</span>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/c/${category.slug}`}
                className="shrink-0 whitespace-nowrap hover:text-white"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Restyle the search box in `components/search-autocomplete.tsx`**

Replace the `<form>` and its direct children (keep all state/logic above it untouched):

```tsx
      <form
        action="/search"
        className="relative order-last flex w-full items-stretch overflow-hidden rounded-[5px] bg-surface sm:order-none sm:max-w-[620px] sm:flex-1"
      >
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <Autocomplete.Input
          id="site-search"
          type="search"
          name="q"
          placeholder="Search products, brands and categories"
          className="w-full border-0 bg-transparent px-3 py-[10px] text-xs text-ink outline-none placeholder:text-muted-2"
        />
        <button
          type="submit"
          className="shrink-0 bg-teal px-[18px] text-xs font-semibold text-white hover:bg-teal-dark"
        >
          Search
        </button>

        <Autocomplete.Portal>
          <Autocomplete.Positioner sideOffset={4} className="z-50">
            <Autocomplete.Popup className="max-h-80 w-(--anchor-width) overflow-auto rounded-[6px] border border-border bg-surface">
              <Autocomplete.List>
                {(item: Suggestion) => (
                  <Autocomplete.Item
                    key={item.slug}
                    value={item}
                    onClick={() => router.push(`/p/${item.slug}`)}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs data-[highlighted]:bg-surface-muted"
                  >
                    <span className="relative size-8 shrink-0 overflow-hidden rounded-[4px] bg-surface-muted">
                      {item.imageUrl && (
                        <Image src={item.imageUrl} alt="" fill sizes="32px" className="object-cover" />
                      )}
                    </span>
                    <span className="truncate text-ink">{item.name}</span>
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </form>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no errors.

Reload `http://localhost:3000/` and compare the header against `design_handoff_meridian_dense_teal/screenshots/01 Home.png`'s top section: 3 distinct dark bands (utility bar, header, category strip), white search pill with teal "Search" button, category names visible in the bottom strip. Type 2+ characters into search — confirm the suggestions dropdown still opens and still navigates to the product page on click (regression check — this component has real fetch logic, don't just eyeball the styling).

- [ ] **Step 4: Commit**

```bash
git add components/site-header.tsx components/search-autocomplete.tsx
git commit -m "Restructure SiteHeader into 3-tier Dense Teal chrome"
```

---

### Task 7: Restyle `SiteFooter` to the 5-column Dense Teal footer

**Files:**
- Modify: `components/site-footer.tsx`

**Interfaces:**
- Consumes: `getTopLevelCategories()` (existing, already used by `SiteHeader` — same function, new call site).
- `SiteFooter` becomes `async` (was sync) — no signature/prop change for its caller (`app/(shell)/layout.tsx` already renders it as `<SiteFooter />` with no props; Next.js server components support async components as-is, no caller change needed).

Reference: `design_handoff_meridian_dense_teal/Footer.dc.html`.

Note: the design's placeholder copy includes a fabricated GSTIN number and a "40,000 products" claim that doesn't match this app's real catalog size. Keep the copyright line but drop the GSTIN placeholder, and keep the app's existing accurate tagline ("Everything you need, shipped fast.") instead of the inflated product-count claim — don't fabricate business/legal details that were only ever meant as generic placeholder texture in the mockup.

- [ ] **Step 1: Replace the file contents**

```tsx
import Link from "next/link";
import { getTopLevelCategories } from "@/lib/categories/queries";

const HELP_LINKS = [
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Shipping & Returns", href: "/shipping-returns" },
];

const COMPANY_LINKS = [{ label: "About", href: "/about" }];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export async function SiteFooter() {
  const categories = await getTopLevelCategories();
  const shopCategories = categories.slice(0, 4);

  return (
    <footer className="flex flex-col gap-6 bg-chrome-deep px-6 pt-[30px] pb-[22px] text-[#cbd5e1]">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="flex flex-col gap-[10px]">
          <span className="text-lg font-extrabold tracking-tight text-white">MERIDIAN</span>
          <p className="max-w-[30ch] text-xs text-muted-2">Everything you need, shipped fast.</p>
        </div>

        <FooterColumn heading="Shop">
          {shopCategories.map((category) => (
            <li key={category.id}>
              <Link href={`/c/${category.slug}`} className="hover:text-white">
                {category.name}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn heading="Help">
          {HELP_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            </li>
          ))}
          <li>Track order</li>
        </FooterColumn>

        <FooterColumn heading="Company">
          {COMPANY_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            </li>
          ))}
          <li>Careers</li>
          <li>Press</li>
        </FooterColumn>

        <FooterColumn heading="Legal">
          {LEGAL_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            </li>
          ))}
        </FooterColumn>
      </div>

      <div className="flex items-center justify-between border-t border-[#1e3a44] pt-4 text-[11px] text-[#64748b]">
        <span>© {new Date().getFullYear()} Meridian Commerce Pvt. Ltd.</span>
        <span>Visa · Mastercard · UPI · Net banking</span>
      </div>
    </footer>
  );
}

function FooterColumn({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[9px]">
      <span className="text-[11px] font-bold tracking-[0.1em] text-white">{heading.toUpperCase()}</span>
      <ul className="flex flex-col gap-[7px] text-xs text-muted-2">{children}</ul>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no errors.

Reload `http://localhost:3000/` and scroll to the footer. Compare against `design_handoff_meridian_dense_teal/screenshots/01 Home.png`'s footer section: dark 5-column layout, real category names in the "Shop" column (not hardcoded placeholder names), working links to About/Contact/FAQ/Shipping & Returns/Privacy/Terms.

- [ ] **Step 3: Commit**

```bash
git add components/site-footer.tsx
git commit -m "Restyle SiteFooter to 5-column Dense Teal footer"
```

---

### Task 8: Extract and restyle `AccountNav`

**Files:**
- Create: `components/account-nav.tsx`
- Modify: `app/(shell)/account/layout.tsx`

**Interfaces:**
- Produces: `AccountNav` client component, props `{ name: string; email: string }`. Highlights the active section using `usePathname()`.
- Consumes: `signOutAction` (existing, previously only used in `site-header.tsx` — same action, new call site).

Reference: `design_handoff_meridian_dense_teal/AccountNav.dc.html`.

- [ ] **Step 1: Create `components/account-nav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth-actions";

const NAV_ITEMS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/settings", label: "Settings" },
];

export function AccountNav({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();

  return (
    <div className="flex min-w-[200px] flex-col gap-1 rounded-[6px] border border-border bg-surface p-[14px]">
      <div className="flex flex-col gap-[3px] px-2 pt-1 pb-3">
        <span className="text-[13px] font-bold text-ink">{name}</span>
        <span className="text-[11px] text-ink-3">{email}</span>
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/account" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "rounded-r-[4px] border-l-[3px] border-teal bg-teal-tint px-[10px] py-[9px] text-xs font-semibold text-ink"
                : "rounded-[4px] px-[13px] py-[9px] text-xs font-medium text-ink-3 hover:bg-surface-muted"
            }
          >
            {item.label}
          </Link>
        );
      })}

      <form action={signOutAction} className="mt-1.5 border-t border-border-subtle pt-1.5">
        <button
          type="submit"
          className="w-full rounded-[4px] px-[13px] py-[9px] text-left text-xs font-medium text-danger hover:bg-danger-tint"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Update `app/(shell)/account/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountNav } from "@/components/account-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        <aside>
          <AccountNav
            name={session.user.name ?? session.user.email ?? "Account"}
            email={session.user.email ?? ""}
          />
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no errors.

Sign in and reload `http://localhost:3000/account`. Expected: white card sidebar with "Overview" highlighted (teal left border + tint background); clicking "Orders" navigates and re-highlights "Orders" instead; "Sign out" still signs the session out (regression check — this reuses the real `signOutAction`).

- [ ] **Step 4: Commit**

```bash
git add components/account-nav.tsx "app/(shell)/account/layout.tsx"
git commit -m "Extract and restyle AccountNav with active-state highlighting"
```

---

### Task 9: Extract and restyle `AdminNav`

**Files:**
- Create: `components/admin-nav.tsx`
- Modify: `app/(shell)/admin/layout.tsx`

**Interfaces:**
- Produces: `AdminNav` client component, props `{ name: string }`. Highlights the active section using `usePathname()`. Renders "Categories" and "Settings" as inert (non-navigable, visually muted) items — those admin sections don't exist yet (tracked as deferred features in the design spec) and linking to them would 404.

Reference: `design_handoff_meridian_dense_teal/AdminNav.dc.html`.

- [ ] **Step 1: Create `components/admin-nav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/reviews", label: "Reviews" },
];

const INERT_ITEMS = ["Categories", "Settings"];

export function AdminNav({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <div className="flex w-[210px] shrink-0 flex-col gap-[3px] bg-chrome-deep p-3">
      <div className="flex items-center gap-2 px-2 pt-1 pb-4">
        <span className="text-base font-extrabold tracking-tight text-white">MERIDIAN</span>
        <span className="rounded-[3px] border border-[#2f5b62] px-[5px] py-1 text-[9px] font-semibold tracking-[0.1em] text-teal-bright">
          ADMIN
        </span>
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "rounded-[5px] bg-chrome-nav px-[10px] py-[9px] text-xs font-semibold text-white"
                : "rounded-[5px] px-[10px] py-[9px] text-xs font-medium text-[#94a3b8] hover:bg-chrome-nav/60"
            }
          >
            {item.label}
          </Link>
        );
      })}

      {INERT_ITEMS.map((label) => (
        <span
          key={label}
          className="cursor-not-allowed rounded-[5px] px-[10px] py-[9px] text-xs font-medium text-[#4b5c63]"
        >
          {label}
        </span>
      ))}

      <div className="mt-auto flex flex-col gap-[3px] border-t border-[#1e3a44] px-[10px] pt-3 pb-1">
        <span className="text-[11px] font-semibold text-[#cbd5e1]">{name}</span>
        <Link href="/" className="text-[10px] text-[#64748b] hover:text-teal-bright">
          Back to storefront
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `app/(shell)/admin/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen">
      <AdminNav name={session.user.name ?? session.user.email ?? "Admin"} />
      <div className="flex-1 bg-canvas p-6">{children}</div>
    </div>
  );
}
```

This switches the admin shell from a centered `max-w-6xl` container to a full-width fixed-sidebar layout, matching the design (`210px` fixed dark sidebar + fluid content) — admin pages are intentionally denser/wider than the storefront.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no errors.

Sign in as an admin and reload `http://localhost:3000/admin`. Expected: dark 210px sidebar spanning full viewport height, "Dashboard" highlighted, "Categories"/"Settings" visible but visually muted and unclickable (hover shows `cursor: not-allowed`, no navigation occurs). Click through Products/Orders/Customers/Reviews and confirm each highlights correctly and the existing pages still render (unstyled content is fine at this point — this task only touches the sidebar and shell).

- [ ] **Step 4: Commit**

```bash
git add components/admin-nav.tsx "app/(shell)/admin/layout.tsx"
git commit -m "Extract and restyle AdminNav with active-state highlighting"
```

---

### Task 10: Add `EmptyState` primitive, apply it to the Wishlist page

**Files:**
- Create: `components/ui/empty-state.tsx`
- Modify: `app/(shell)/account/wishlist/page.tsx`

**Interfaces:**
- Produces: `EmptyState` component, props `{ icon: LucideIcon; title: string; description: string; actions?: React.ReactNode }`. `actions` is left as `React.ReactNode` (not a fixed primary/secondary button prop pair) so each page can pass exactly the buttons/links it needs — later plans (Account Addresses, Account Orders empty states) are the next consumers.
- Consumes: `bg-teal-tint`, `text-teal`, `text-ink`, `text-ink-3` utilities (Task 1); `lucide-react` (already a dependency).

- [ ] **Step 1: Create the primitive**

```tsx
import type { LucideIcon } from "lucide-react"

function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon: LucideIcon
  title: string
  description: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <span className="flex size-13 items-center justify-center rounded-full bg-teal-tint text-teal">
        <Icon className="size-6" />
      </span>
      <p className="text-base font-bold text-ink">{title}</p>
      <p className="max-w-[48ch] text-xs text-ink-3">{description}</p>
      {actions && <div className="mt-2 flex items-center gap-3">{actions}</div>}
    </div>
  )
}

export { EmptyState }
```

- [ ] **Step 2: Apply it to the Wishlist page's empty state**

Replace `app/(shell)/account/wishlist/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { auth } from "@/lib/auth";
import { getWishlistedProducts } from "@/lib/wishlist";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Wishlist",
};

export default async function WishlistPage() {
  const session = await auth();
  const products = await getWishlistedProducts(session!.user.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Wishlist</h1>

      {products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nothing here yet"
          description="Tap the heart on any product to save it to your wishlist."
          actions={
            <Link href="/">
              <Button>Browse products</Button>
            </Link>
          }
        />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} isWishlisted />
          ))}
        </div>
      )}
    </div>
  );
}
```

(Only the empty-state branch changes — the populated grid below is untouched here; it gets restyled in the Account plan.)

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` and `npm run lint`. Expected: no errors.

Sign in with an account that has an empty wishlist and reload `http://localhost:3000/account/wishlist`. Expected: centered teal-tint circle with a heart icon, bold headline, muted description, a "Browse products" button — compare against `design_handoff_meridian_dense_teal/screenshots/17 Account Wishlist.png`'s empty-state treatment (icon/copy/button label will differ slightly since that's real vs. mockup copy, but the visual structure should match).

- [ ] **Step 4: Commit**

```bash
git add components/ui/empty-state.tsx "app/(shell)/account/wishlist/page.tsx"
git commit -m "Add EmptyState primitive, apply to Wishlist empty state"
```

---

### Task 11: Full-shell smoke check

**Files:** none (verification-only task)

- [ ] **Step 1: Run the full check suite**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all three pass with no errors. `npm run build` in particular catches any server/client component boundary mistakes (e.g. forgetting `"use client"` on `AccountNav`/`AdminNav`) that `tsc`/`lint` alone might not.

- [ ] **Step 2: Visual smoke check across all three shells**

Using the `run` skill (or an already-running dev server), screenshot and eyeball:
- `/` (storefront shell: 3-tier header, footer)
- `/account` (account shell: AccountNav sidebar)
- `/admin` (admin shell: AdminNav sidebar)

Expected: chrome (header/footer/navs) matches the Dense Teal design on all three; page *content* below/beside the chrome is still unstyled (default browser/Tailwind look) — that's expected, it's covered by Plans 2-6.

- [ ] **Step 3: No commit needed for this task** (verification-only — nothing to stage).

---

## After this plan

Once all 10 tasks are done and pass verification, the app has the Dense Teal shell (header, footer, account nav, admin nav) plus the `Button`/`Input`/`StatusPill` primitives and full token system ready for every subsequent page-group plan to consume. Next: **Plan 2 — Storefront** (Home, Category, Product Detail, Cart, Search, Checkout).
