import type { Metadata } from "next";
import { searchProducts, type SortOption } from "@/lib/search";
import { getAvailableBrands } from "@/lib/products/queries";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductResults } from "@/components/product-results";

type SearchParamsType = Promise<{
  q?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock?: string;
  brand?: string | string[];
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
  const brands = Array.isArray(sp.brand) ? sp.brand : sp.brand ? [sp.brand] : [];

  const results = sp.q
    ? await searchProducts({
        q: sp.q,
        sort,
        page,
        minPriceCents,
        maxPriceCents,
        minRating,
        inStockOnly,
        brands,
      })
    : { products: [], total: 0, page: 1, perPage: 24, totalPages: 1 };

  const availableBrands = await getAvailableBrands();

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex flex-col gap-1 rounded-[6px] border border-border bg-surface px-4 py-3.5">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
        <h1 className="mt-1 text-xl font-extrabold tracking-tight">{sp.q ? `Results for "${sp.q}"` : "Search"}</h1>
        {sp.q && <span className="text-xs text-ink-3">{results.total} products</span>}
        {sp.q && results.total === 0 && "didYouMean" in results && results.didYouMean && (
          <p className="text-xs text-ink-3">
            Did you mean{" "}
            <a href={`/search?q=${encodeURIComponent(results.didYouMean)}`} className="font-semibold text-teal hover:text-teal-dark">
              {results.didYouMean}
            </a>
            ?
          </p>
        )}
      </div>

      {sp.q ? (
        <ProductResults basePath="/search" searchParams={sp} results={results} sort={sort} brands={availableBrands} />
      ) : (
        <p className="rounded-[6px] border border-border bg-surface py-16 text-center text-sm text-ink-3">
          Enter a search term above to find products.
        </p>
      )}
    </div>
  );
}
