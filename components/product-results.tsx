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
  brand?: string | string[];
  page?: string;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "rating", label: "Avg. rating" },
];

const ACTIVE_FILTER_LABELS: {
  key: "inStock" | "minPrice" | "maxPrice" | "minRating";
  label: (value: string) => string;
}[] = [
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
  brands,
}: {
  basePath: string;
  searchParams: ResultsSearchParams;
  results: Results;
  sort: SortOption;
  sidebarTop?: React.ReactNode;
  brands: string[];
}) {
  const wishlistedIds = await getWishlistedProductIds();

  const selectedBrands = Array.isArray(searchParams.brand)
    ? searchParams.brand
    : searchParams.brand
      ? [searchParams.brand]
      : [];

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

  const activeFilters = ACTIVE_FILTER_LABELS.filter(({ key }) => searchParams[key]).map(({ key, label }) => ({
    key,
    text: label(searchParams[key]!),
  }));

  const brandChips = selectedBrands.map((brand) => ({
    key: `brand-${brand}`,
    text: brand,
    href: buildHref({ brand: selectedBrands.filter((b) => b !== brand), page: undefined }),
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
              <ProductCard key={product.id} product={product} isWishlisted={wishlistedIds.has(product.id)} highlightQuery={searchParams.q} />
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
