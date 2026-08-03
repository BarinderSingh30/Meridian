import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryAncestors, getCategoryBySlug } from "@/lib/categories/queries";
import { searchProducts, type SortOption } from "@/lib/search";
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

      <div className="mt-6">
        <ProductResults basePath={`/c/${slug}`} searchParams={sp} results={results} sort={sort} />
      </div>
    </div>
  );
}
