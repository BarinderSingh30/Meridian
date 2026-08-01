import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryAncestors, getCategoryBySlug } from "@/lib/categories/queries";
import { searchProducts, type SortOption } from "@/lib/search";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { jsonLdScriptProps } from "@/lib/json-ld";
import { ProductCard } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";

type Params = Promise<{ slug: string }>;
type SearchParamsType = Promise<{
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock?: string;
  page?: string;
}>;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Avg. Rating" },
];

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: `Shop ${category.name} at Meridian.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParamsType;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const ancestors = await getCategoryAncestors(category);
  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  const sort = (sp.sort as SortOption) ?? "relevance";
  const page = sp.page ? Math.max(1, Number(sp.page) || 1) : 1;
  const minPriceCents = sp.minPrice ? Math.round(Number(sp.minPrice) * 100) : undefined;
  const maxPriceCents = sp.maxPrice ? Math.round(Number(sp.maxPrice) * 100) : undefined;
  const minRating = sp.minRating ? Number(sp.minRating) : undefined;
  const inStockOnly = sp.inStock === "1";

  const results = await searchProducts({
    categoryIds,
    sort,
    page,
    minPriceCents,
    maxPriceCents,
    minRating,
    inStockOnly,
  });

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    ...ancestors.map((a) => ({ label: a.name, href: `/c/${a.slug}` })),
    { label: category.name },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  };

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { sort: sp.sort, minPrice: sp.minPrice, maxPrice: sp.maxPrice, minRating: sp.minRating, inStock: sp.inStock, page: sp.page, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return `/c/${slug}${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(jsonLd)} />

      <Breadcrumbs items={breadcrumbItems} />
      <h1 className="mt-2 text-2xl font-semibold">{category.name}</h1>

      {category.children.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/c/${child.slug}`}
              className="rounded-full border border-border px-3 py-1 text-sm hover:bg-muted"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <form className="space-y-6" method="GET">
            <div>
              <p className="mb-2 text-sm font-medium">Price</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="minPrice"
                  placeholder="Min"
                  defaultValue={sp.minPrice}
                  min={0}
                  className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <span className="text-muted-foreground">–</span>
                <input
                  type="number"
                  name="maxPrice"
                  placeholder="Max"
                  defaultValue={sp.maxPrice}
                  min={0}
                  className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Minimum rating</p>
              <select
                name="minRating"
                defaultValue={sp.minRating ?? ""}
                className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Any</option>
                <option value="4">4+ stars</option>
                <option value="3">3+ stars</option>
                <option value="2">2+ stars</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="inStock" value="1" defaultChecked={inStockOnly} />
              In stock only
            </label>

            <input type="hidden" name="sort" value={sp.sort ?? ""} />
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
                <ProductCard key={product.id} product={product} />
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
    </div>
  );
}
