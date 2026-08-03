# Search Autocomplete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The header search box shows a live dropdown of matching products (thumbnail + name) as the user types, with click-through straight to the product page, while the existing Enter-to-search flow stays unchanged.

**Architecture:** A new `GET /api/search/suggestions` route does a fast trigram-ranked lookup (same `pg_trgm` mechanism the existing keyword search already uses, capped to 6 results) and returns plain JSON. A new client component replaces the header's plain `<form>`, built on Base UI's `Autocomplete` primitive, debouncing keystrokes and fetching that route with `AbortController`-based cancellation.

**Tech Stack:** Next.js 16 Route Handlers (Web `Request`/`Response`), Prisma raw SQL (`$queryRaw` + `pg_trgm`'s `similarity()`), `@base-ui/react/autocomplete` (already a project dependency), `next/navigation`'s `useRouter`.

## Global Constraints

- No Gemini/semantic call in this feature — matching is trigram/keyword only, same as Phase-1 search (spec decision: too slow/costly per keystroke, and short partial queries don't benefit from it anyway).
- Suggestions: at most 6, only fires once the trimmed query is 2+ characters.
- Each suggestion shows a thumbnail + product name only — no price.
- Clicking or Enter-selecting a suggestion navigates straight to `/p/[slug]`.
- Plain Enter with nothing selected still submits to `/search?q=...` exactly as today — this flow must not change.
- If the suggestions fetch fails, is aborted, or returns non-OK, the dropdown just stays empty — no error UI (spec: "degrade quietly, never block the primary action").
- This repo has no test framework (no jest/vitest in `package.json`). Verification is manual: `tsc --noEmit`, `eslint`, and a live dev-server check.

---

## File Structure

- `app/api/search/suggestions/route.ts` **(new)** — `GET` handler, trigram-ranked product lookup, returns `{ slug, name, imageUrl }[]` JSON.
- `components/search-autocomplete.tsx` **(new)** — `"use client"` component: debounced fetch, Base UI `Autocomplete` dropdown, navigation on select.
- `components/site-header.tsx` **(modify)** — replace the inline `<form>` block with `<SearchAutocomplete />`.

---

### Task 1: Suggestions API route

**Files:**
- Create: `app/api/search/suggestions/route.ts`

**Interfaces:**
- Produces: `GET /api/search/suggestions?q=<string>` → `200` JSON body `{ slug: string; name: string; imageUrl: string | null }[]`. Empty array (not an error) for a missing/short query or zero matches. Consumed by Task 2's client component.

- [ ] **Step 1: Write the route handler**

```ts
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const SUGGESTION_LIMIT = 6;
const MIN_QUERY_LENGTH = 2;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < MIN_QUERY_LENGTH) {
    return Response.json([]);
  }

  const ranked = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT id FROM "Product"
    WHERE status = 'ACTIVE' AND similarity(name, ${q}) > 0.05
    ORDER BY similarity(name, ${q}) DESC
    LIMIT ${SUGGESTION_LIMIT}
  `);

  if (ranked.length === 0) {
    return Response.json([]);
  }

  const ids = ranked.map((r) => r.id);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      slug: true,
      name: true,
      images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
    },
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  const suggestions = ids
    .map((id) => byId.get(id))
    .filter((p): p is (typeof products)[number] => p !== undefined)
    .map((p) => ({ slug: p.slug, name: p.name, imageUrl: p.images[0]?.url ?? null }));

  return Response.json(suggestions);
}
```

This mirrors the existing raw-SQL-then-`findMany`-then-reorder pattern already used in `lib/search/index.ts`'s hybrid search (`similarity()` for ranking, then a normal Prisma query for full row data, re-ordered in JS by the ranked id list) — same reasoning applies here: Prisma Client's fluent API can't `orderBy` a raw SQL function like `similarity()`, so the ranking step needs `$queryRaw`.

- [ ] **Step 2: Verify with the dev server**

```bash
npm run dev
```

In another terminal:

```bash
curl -s "http://localhost:3000/api/search/suggestions?q=he" | head -c 500
```

Expected: a JSON array. If your seeded catalog has a product with "head" in the name (check `prisma/seed-data.ts` for a real example — e.g. anything with "Headphone"/"Headset" in it), querying that prefix should return it near the top. Also verify the short-query guard:

```bash
curl -s "http://localhost:3000/api/search/suggestions?q=h"
```

Expected: `[]` (single character, below `MIN_QUERY_LENGTH`).

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/search/suggestions/route.ts
git commit -m "Add product search suggestions API route"
```

---

### Task 2: Client autocomplete component + wire into header

**Files:**
- Create: `components/search-autocomplete.tsx`
- Modify: `components/site-header.tsx`

**Interfaces:**
- Consumes: `GET /api/search/suggestions?q=...` (Task 1) → `{ slug: string; name: string; imageUrl: string | null }[]`.
- Produces: `SearchAutocomplete` — a default-exportless named React component (`export function SearchAutocomplete()`), no props, self-contained. Replaces the `<form action="/search">...</form>` block currently in `components/site-header.tsx`.

- [ ] **Step 1: Write the client component**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Autocomplete } from "@base-ui/react/autocomplete";

type Suggestion = { slug: string; name: string; imageUrl: string | null };

const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

export function SearchAutocomplete() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = inputValue.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      setItems([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => (res.ok ? (res.json() as Promise<Suggestion[]>) : []))
        .then((data) => setItems(data))
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setItems([]);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  return (
    <Autocomplete.Root
      items={items}
      filter={null}
      inputValue={inputValue}
      onInputValueChange={(value) => setInputValue(value)}
      onValueChange={(item: Suggestion | null) => {
        if (item) router.push(`/p/${item.slug}`);
      }}
      itemToStringValue={(item: Suggestion) => item.name}
    >
      <form action="/search" className="relative order-last w-full sm:order-none sm:w-auto sm:flex-1">
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <Autocomplete.Input
          id="site-search"
          type="search"
          name="q"
          placeholder="Search products..."
          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />

        <Autocomplete.Portal>
          <Autocomplete.Positioner sideOffset={4} className="z-50">
            <Autocomplete.Popup className="max-h-80 w-(--anchor-width) overflow-auto rounded-lg border border-border bg-background shadow-md">
              <Autocomplete.List>
                {(item: Suggestion) => (
                  <Autocomplete.Item
                    key={item.slug}
                    value={item}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm data-[highlighted]:bg-muted"
                  >
                    <span className="relative size-8 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.imageUrl && (
                        <Image src={item.imageUrl} alt="" fill sizes="32px" className="object-cover" />
                      )}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </form>
    </Autocomplete.Root>
  );
}
```

A note on API risk: this is grounded in Base UI's real documented `Autocomplete` anatomy and props (`Root`/`Input`/`Portal`/`Positioner`/`Popup`/`List`/`Item`, `items`/`filter`/`inputValue`/`onInputValueChange`/`onValueChange`/`itemToStringValue`, `data-highlighted` on `Item`), but if any prop name doesn't compile, check `node_modules/@base-ui/react/autocomplete/index.d.ts` (or the sibling `.d.ts` files in that folder) for the exact current signature rather than guessing — the package is already installed, so the real types are the source of truth over this snippet.

- [ ] **Step 2: Wire it into the header**

In `components/site-header.tsx`, replace this block:

```tsx
        <form action="/search" className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <input
            id="site-search"
            type="search"
            name="q"
            placeholder="Search products..."
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </form>
```

with:

```tsx
        <SearchAutocomplete />
```

and add the import at the top of the file:

```tsx
import { SearchAutocomplete } from "@/components/search-autocomplete";
```

- [ ] **Step 3: Typecheck and lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: both clean (the repo has 3 pre-existing, unrelated lint errors in `app/(auth)/signin/page.tsx` and `app/not-found.tsx` — confirm any errors you see are only those, not new ones in the files you touched).

- [ ] **Step 4: Verify in the dev server**

```bash
npm run dev
```

Using the browser (or `curl` for the API parts, but this step specifically needs a real browser since it's testing client-side interactivity):

1. Go to any page (e.g. `/`). Click the search box and type a 1-character query — confirm no dropdown appears yet.
2. Continue typing to 2+ characters matching a real seeded product (e.g. "he" for a product with "Headphone" in its name — check `prisma/seed-data.ts` for a real match in this catalog). Confirm a dropdown appears within about 200ms showing up to 6 items, each with a thumbnail and name, no price.
3. Click a suggestion. Confirm it navigates straight to that product's `/p/[slug]` page.
4. Go back to the search box, type a query, and press Enter while a suggestion is keyboard-highlighted (arrow key down first). Confirm it also navigates to that product's page.
5. Type a query, then press Enter with nothing highlighted (or clear focus and press Enter immediately). Confirm it submits to `/search?q=...` and shows the normal full results page — this is the one behavior that must not have changed.
6. Type fast (paste a longer string or type quickly) and confirm the dropdown doesn't flicker between stale and fresh results — the debounce + `AbortController` cancellation should keep only the latest query's results visible.

- [ ] **Step 5: Commit**

```bash
git add components/search-autocomplete.tsx components/site-header.tsx
git commit -m "Add search autocomplete dropdown to header search box"
```

---

## Post-plan verification checklist

- [ ] Typing 1 character shows no dropdown; 2+ characters matching a real product shows up to 6 thumbnail+name suggestions
- [ ] Clicking a suggestion navigates straight to that product's page
- [ ] Enter on a keyboard-highlighted suggestion also navigates to that product's page
- [ ] Enter with nothing highlighted still submits to `/search?q=...` with normal results (unchanged from before this feature)
- [ ] A failed/aborted suggestions fetch leaves the search box fully usable (typing and Enter-to-search still work)
- [ ] No new `tsc`/`eslint` errors beyond the 3 pre-existing, unrelated ones
