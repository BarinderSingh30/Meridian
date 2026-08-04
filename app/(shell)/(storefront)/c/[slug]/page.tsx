import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryAncestors, getCategoryBySlug } from "@/lib/categories/queries";
import { searchProducts, type SortOption } from "@/lib/search";
import { getAvailableBrands } from "@/lib/products/queries";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { jsonLdScriptProps } from "@/lib/json-ld";
import { ProductResults } from "@/components/product-results";

type Params = Promise<{ slug: string }>;
type SearchParamsType = Promise<{
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock?: string;
  brand?: string | string[];
  page?: string;
}>;

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
  const brands = Array.isArray(sp.brand) ? sp.brand : sp.brand ? [sp.brand] : [];

  const results = await searchProducts({
    categoryIds,
    sort,
    page,
    minPriceCents,
    maxPriceCents,
    minRating,
    inStockOnly,
    brands,
  });

  const availableBrands = await getAvailableBrands();

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

  const subcategoryFacet = category.children.length > 0 && (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-bold tracking-[0.08em] text-ink">SUBCATEGORY</span>
      <div className="flex flex-col gap-1.5 text-xs text-ink-3">
        <Link href={`/c/${category.slug}`} className="font-semibold text-teal">
          All {category.name}
        </Link>
        {category.children.map((child) => (
          <Link key={child.id} href={`/c/${child.slug}`} className="hover:text-ink">
            {child.name}
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 p-3">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(jsonLd)} />

      <div className="flex flex-col gap-2 rounded-[6px] border border-border bg-surface px-4 py-3.5">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">{category.name}</h1>
          <span className="text-xs text-ink-3">
            {results.total} products · showing {(results.page - 1) * results.perPage + 1}–
            {Math.min(results.page * results.perPage, results.total)}
          </span>
        </div>
      </div>

      <ProductResults
        basePath={`/c/${slug}`}
        searchParams={sp}
        results={results}
        sort={sort}
        sidebarTop={subcategoryFacet || undefined}
        brands={availableBrands}
      />
    </div>
  );
}
