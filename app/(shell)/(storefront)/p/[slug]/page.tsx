import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/lib/products/queries";
import { getCategoryAncestors } from "@/lib/categories/queries";
import { formatMoney } from "@/lib/money";
import { jsonLdScriptProps } from "@/lib/json-ld";
import { addToCartAction } from "@/lib/actions/cart-actions";
import { getWishlistedProductIds } from "@/lib/wishlist";
import { getRatingDistribution, getMyReview } from "@/lib/reviews";
import { auth } from "@/lib/auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { StarRating } from "@/components/star-rating";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { WishlistToggle } from "@/components/wishlist-toggle";
import { RatingDistribution } from "@/components/rating-distribution";
import { ReviewForm } from "@/components/review-form";
import { Button } from "@/components/ui/button";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: product.images[0] ? { images: [product.images[0].url] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const session = await auth();
  const [ancestors, related, wishlistedIds, ratingDistribution, myReview] = await Promise.all([
    getCategoryAncestors(product.category),
    getRelatedProducts(product.category.id, product.id),
    getWishlistedProductIds(),
    getRatingDistribution(product.id),
    session?.user?.id ? getMyReview(session.user.id, product.id) : Promise.resolve(null),
  ]);

  const outOfStock = product.stockQuantity <= 0;

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    ...ancestors.map((a) => ({ label: a.name, href: `/c/${a.slug}` })),
    { label: product.category.name, href: `/c/${product.category.slug}` },
    { label: product.name },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.priceCents / 100).toFixed(2),
      availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg.toFixed(1),
            reviewCount: product.ratingCount,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
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
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(breadcrumbJsonLd)} />

      <Breadcrumbs items={breadcrumbItems} />

      <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="space-y-4">
          <div>
            {product.brand && <p className="text-sm text-muted-foreground">{product.brand}</p>}
            <h1 className="text-2xl font-semibold">{product.name}</h1>
          </div>

          {product.ratingCount > 0 && <StarRating rating={product.ratingAvg} count={product.ratingCount} />}

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold">{formatMoney(product.priceCents)}</span>
            {product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents && (
              <span className="text-muted-foreground line-through">{formatMoney(product.compareAtPriceCents)}</span>
            )}
          </div>

          <p className={outOfStock ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
            {outOfStock ? "Out of stock" : `In stock (${product.stockQuantity} available)`}
          </p>

          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="flex items-center gap-3 pt-2">
            <form action={addToCartAction} className="flex items-center gap-3">
              <input type="hidden" name="productId" value={product.id} />
              <input
                type="number"
                name="quantity"
                min={1}
                max={product.stockQuantity || undefined}
                defaultValue={1}
                disabled={outOfStock}
                className="w-20 rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              />
              <Button type="submit" disabled={outOfStock}>
                {outOfStock ? "Out of stock" : "Add to cart"}
              </Button>
            </form>
            <WishlistToggle productId={product.id} isWishlisted={wishlistedIds.has(product.id)} />
          </div>
        </div>
      </div>

      <section className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[280px_1fr]">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">
              Reviews {product.ratingCount > 0 && `(${product.ratingCount})`}
            </h2>
            {product.ratingCount > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-semibold">{product.ratingAvg.toFixed(1)}</span>
                <StarRating rating={product.ratingAvg} />
              </div>
            )}
            <div className="mt-3">
              <RatingDistribution distribution={ratingDistribution} total={product.ratingCount} />
            </div>
          </div>

          {session?.user?.id ? (
            <ReviewForm productId={product.id} slug={product.slug} existing={myReview} />
          ) : (
            <p className="text-sm text-muted-foreground">
              <Link href="/signin" className="underline underline-offset-4">
                Sign in
              </Link>{" "}
              to write a review.
            </p>
          )}
        </div>

        {product.reviews.filter((r) => r.userId !== session?.user?.id).length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="space-y-6">
            {product.reviews
              .filter((r) => r.userId !== session?.user?.id)
              .map((review) => (
                <div key={review.id} className="border-b border-border pb-6">
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    {review.isVerifiedPurchase && (
                      <span className="text-xs font-medium text-muted-foreground">Verified Purchase</span>
                    )}
                  </div>
                  {review.title && <p className="mt-1 font-medium">{review.title}</p>}
                  <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{review.user.name ?? "Anonymous"}</p>
                </div>
              ))}
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 text-xl font-semibold">Related products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} isWishlisted={wishlistedIds.has(item.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
