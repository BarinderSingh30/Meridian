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
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Avg. Rating" },
];

type Results = Awaited<ReturnType<typeof searchProducts>>;

export async function ProductResults({
  basePath,
  searchParams,
  results,
  sort,
}: {
  basePath: string;
  searchParams: ResultsSearchParams;
  results: Results;
  sort: SortOption;
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

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
      <aside>
        <form className="space-y-6" method="GET" action={basePath}>
          {searchParams.q !== undefined && (
            <input type="hidden" name="q" value={searchParams.q} />
          )}

          <div>
            <p className="mb-2 text-sm font-medium">Price</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="minPrice"
                placeholder="Min"
                defaultValue={searchParams.minPrice}
                min={0}
                className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <span className="text-muted-foreground">–</span>
              <input
                type="number"
                name="maxPrice"
                placeholder="Max"
                defaultValue={searchParams.maxPrice}
                min={0}
                className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Minimum rating</p>
            <select
              name="minRating"
              defaultValue={searchParams.minRating ?? ""}
              className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Any</option>
              <option value="4">4+ stars</option>
              <option value="3">3+ stars</option>
              <option value="2">2+ stars</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="inStock" value="1" defaultChecked={searchParams.inStock === "1"} />
            In stock only
          </label>

          <input type="hidden" name="sort" value={searchParams.sort ?? ""} />
          <Button type="submit" variant="secondary" size="sm" className="w-full">
            Apply filters
          </Button>
        </form>
      </aside>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{results.total} products</p>
          <div className="flex gap-1 text-sm">
            {SORT_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={buildHref({ sort: option.value === "relevance" ? undefined : option.value, page: undefined })}
                className={`rounded-full px-3 py-1 ${sort === option.value ? "bg-foreground text-background" : "hover:bg-muted"}`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        {results.products.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No products match these filters.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
