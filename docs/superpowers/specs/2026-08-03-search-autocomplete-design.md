# Search Autocomplete — Design

## Context

The site's search box (`components/site-header.tsx`) is a plain server-rendered `<form action="/search">` with an `<input name="q">` — no client interactivity, no suggestions. Typing "head" and pressing Enter goes to `/search?q=head` and shows full results; there is currently no way to see matching products before submitting.

## Goal

Typing in the search box should show a live dropdown of matching products (e.g. typing "head" surfaces "Wireless Headphones," "Noise Cancelling Headphones," etc.), the way real e-commerce search boxes work. Clicking a suggestion goes straight to that product. The existing full-search-results flow (Enter → `/search?q=...`) is unchanged.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Suggestion content | Thumbnail + product name, no price | User's explicit choice — matches real e-commerce typeahead without the extra complexity/noise of pricing in a dropdown |
| Matching strategy | Keyword/trigram match only (existing `Product.name` index), not the Phase-2 semantic search | No Gemini API call per keystroke — too slow and costly for a debounced-but-frequent query; short partial queries ("head") don't benefit much from semantic matching anyway |
| Click behavior | Navigate straight to the product's page | Fastest path, matches real-world typeahead (Amazon, Flipkart, etc.) |
| Suggestion limit / trigger threshold | Up to 6 results, starts after 2 characters | Enough to be useful without a cluttered dropdown; avoids firing a query on the very first keystroke |
| Data fetching | New `GET` API route, fetched client-side with `AbortController` | Real request cancellation on fast typing — a Server Action can't truly abort an in-flight call, only have its result ignored client-side once it lands, which is a weaker guard against a slow stale response overwriting a newer one |
| Dropdown UI primitive | Base UI's `Autocomplete` (not `Combobox`) | Base UI's own docs are explicit: `Combobox` doesn't support free-form text entry ("type your own thing"), which a search box needs; `Autocomplete` does. Already a project dependency (`@base-ui/react`), so no new package and consistent keyboard/ARIA handling instead of hand-rolled |

## Data source

`GET /api/search/suggestions?q=<query>` in `app/api/search/suggestions/route.ts`.

- Returns `[]` immediately (no DB query) if `q` is missing, empty, or under 2 characters.
- Otherwise queries `Product` where `status: "ACTIVE"` and `name` contains `q` (case-insensitive), ordered by `similarity(name, q) DESC` (same `pg_trgm` mechanism the existing keyword search already uses — no new index needed), `take: 6`.
- Response shape: `{ slug: string; name: string; imageUrl: string | null }[]` — `imageUrl` from the product's first image (same `orderBy: { position: "asc" }, take: 1` pattern used elsewhere in `lib/search/index.ts`).
- No auth required (same visibility as the public search page).

## Client component

`components/search-autocomplete.tsx` (`"use client"`), replacing the inline `<form>` currently in `components/site-header.tsx`. `SiteHeader` stays a Server Component (still fetches session/categories/cart) — this is a small client island, not a rewrite of the header.

Behavior:
- Debounces input changes (~200ms) before calling `/api/search/suggestions`.
- Each fetch uses a fresh `AbortController`; the previous in-flight request (if any) is aborted when a new one starts, so a fast typist never has an older response overwrite a newer one.
- Built on Base UI's `Autocomplete.Root`/`Input`/`Popup`/`List`/`Item` — `items` set from the fetched suggestions, with built-in client-side filtering disabled/bypassed (the server has already filtered; the primitive should just render what it's given).
- Each item renders a thumbnail (small, fixed-size) + product name.
- Clicking an item, or pressing Enter while an item is keyboard-highlighted, navigates to `/p/[slug]` via `next/navigation`'s router.
- Pressing Enter with no item highlighted (dropdown closed, empty, or query too short) submits the form to `/search?q=...` exactly as today.
- Arrow-key navigation, Escape-to-close, and focus management come from the Base UI primitive.

## Error handling

If the suggestions fetch fails, is aborted, or returns non-OK, the dropdown simply stays empty/closed — no error UI. The search box remains fully functional via plain Enter-to-search regardless of suggestion-fetch failures. This matches the existing codebase's established "degrade quietly, never block the primary action" pattern from the Phase-2 hybrid-search fallback behavior.

## Testing

No test framework exists in this repo (established in prior work on this codebase). Verification is manual: start the dev server, type a query matching a real seeded product (e.g. a product with "headphone" in its name) into the header search box, confirm the dropdown appears after 2 characters with a thumbnail+name per suggestion, confirm clicking navigates to the right product page, confirm Enter-with-no-selection still lands on `/search?q=...` with normal results, and confirm the dropdown behaves reasonably on a fast-typing burst (no flicker/stale results).

## Out of scope

- No category suggestions, only products.
- No price shown in suggestions.
- No "recent searches" or search history.
- No server-side caching layer for the suggestions endpoint — a 6-row indexed query is cheap enough at this catalog's size (~80 products).
- No changes to the `/search` results page or its own filters/sort — this feature only touches the header search box's pre-submit behavior.
