import type { Metadata } from "next";
import { searchProducts, type SortOption } from "@/lib/search";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductResults } from "@/components/product-results";

type SearchParamsType = Promise<{
  q?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock?: string;
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

  const results = sp.q
    ? await searchProducts({
        q: sp.q,
        sort,
        page,
        minPriceCents,
        maxPriceCents,
        minRating,
        inStockOnly,
      })
    : { products: [], total: 0, page: 1, perPage: 24, totalPages: 1 };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <h1 className="mt-2 text-2xl font-semibold">
        {sp.q ? `Results for "${sp.q}"` : "Search"}
      </h1>

      <div className="mt-6">
        {sp.q ? (
          <ProductResults basePath="/search" searchParams={sp} results={results} sort={sort} />
        ) : (
          <p className="py-16 text-center text-muted-foreground">
            Enter a search term above to find products.
          </p>
        )}
      </div>
    </div>
  );
}
