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
import { QuantityStepper } from "@/components/ui/quantity-stepper";
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
  const hasDiscount = product.compareAtPriceCents !== null && product.compareAtPriceCents > product.priceCents;
  const discountPct = hasDiscount
    ? Math.round((1 - product.priceCents / product.compareAtPriceCents!) * 100)
    : 0;

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

  const otherReviews = product.reviews.filter((r) => r.userId !== session?.user?.id);

  return (
    <div className="flex flex-col gap-3 p-3">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(jsonLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(breadcrumbJsonLd)} />

      <Breadcrumbs items={breadcrumbItems} />

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[460px_1fr_300px]">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 rounded-[6px] border border-border bg-surface p-[18px]">
            {product.brand && (
              <span className="text-[10px] font-semibold tracking-[0.1em] text-teal">{product.brand.toUpperCase()}</span>
            )}
            <h1 className="text-[26px] leading-[1.15] font-extrabold tracking-tight">{product.name}</h1>

            <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-ink-3">
              {product.ratingCount > 0 && (
                <>
                  <StarRating rating={product.ratingAvg} count={product.ratingCount} />
                  <span className="text-border">|</span>
                </>
              )}
              {product.sku && <span className="font-mono">SKU {product.sku}</span>}
            </div>

            <div className="flex items-baseline gap-2.5 border-t border-border-subtle pt-3.5">
              <span className="text-[32px] font-extrabold tracking-tight">{formatMoney(product.priceCents)}</span>
              {hasDiscount && (
                <>
                  <span className="text-[15px] text-muted-2 line-through">
                    {formatMoney(product.compareAtPriceCents!)}
                  </span>
                  <span className="rounded-[4px] bg-danger-tint px-2 py-1.5 text-[11px] font-bold text-danger-dark">
                    SAVE {formatMoney(product.compareAtPriceCents! - product.priceCents)} ({discountPct}%)
                  </span>
                </>
              )}
            </div>

            <p className="max-w-[62ch] text-[13px] leading-relaxed whitespace-pre-line text-ink-2">
              {product.description}
            </p>
          </div>

          <div className="flex flex-col gap-3.5 rounded-[6px] border border-border bg-surface p-[18px]">
            <h2 className="text-sm font-bold tracking-tight">
              Reviews {product.ratingCount > 0 && `(${product.ratingCount})`}
            </h2>

            {product.ratingCount > 0 && (
              <div className="flex items-center gap-4 rounded-[5px] bg-surface-muted p-3.5">
                <span className="text-[26px] font-extrabold">{product.ratingAvg.toFixed(1)}</span>
                <div className="flex-1">
                  <RatingDistribution distribution={ratingDistribution} total={product.ratingCount} />
                </div>
              </div>
            )}

            {session?.user?.id ? (
              <ReviewForm productId={product.id} slug={product.slug} existing={myReview} />
            ) : (
              <p className="text-xs text-ink-3">
                <Link href="/signin" className="font-semibold text-teal hover:text-teal-dark">
                  Sign in
                </Link>{" "}
                to write a review.
              </p>
            )}

            {otherReviews.length === 0 ? (
              <p className="text-xs text-ink-3">No reviews yet.</p>
            ) : (
              <div className="flex flex-col gap-3 border-t border-border-subtle pt-3">
                {otherReviews.map((review) => (
                  <div key={review.id} className="flex flex-col gap-1.5 border-b border-border-subtle pb-3 last:border-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xs font-semibold">{review.user.name ?? "Anonymous"}</span>
                      <StarRating rating={review.rating} />
                      {review.isVerifiedPurchase && (
                        <span className="rounded-[3px] bg-teal-tint px-1.5 py-1 text-[9px] font-bold text-teal-dark">
                          VERIFIED BUYER
                        </span>
                      )}
                    </div>
                    {review.title && <p className="text-xs font-semibold">{review.title}</p>}
                    <p className="text-xs leading-relaxed text-ink-2">{review.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 rounded-[6px] border border-border bg-surface p-4">
            <span className="text-[22px] font-extrabold tracking-tight">{formatMoney(product.priceCents)}</span>

            {outOfStock ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-danger">
                <span className="size-1.5 rounded-full bg-danger" />
                Out of stock
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-dark">
                <span className="size-1.5 rounded-full bg-teal" />
                In stock · {product.stockQuantity} available
              </div>
            )}

            <form action={addToCartAction} className="flex flex-col gap-3 border-t border-border-subtle pt-3">
              <input type="hidden" name="productId" value={product.id} />
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-ink-3">Qty</span>
                <QuantityStepper
                  name="quantity"
                  defaultValue={1}
                  min={1}
                  max={product.stockQuantity || undefined}
                  disabled={outOfStock}
                />
              </div>
              <Button type="submit" disabled={outOfStock} className="w-full">
                {outOfStock ? "Out of stock" : "Add to cart"}
              </Button>
            </form>
            <Button type="button" variant="dark" disabled={outOfStock} className="w-full">
              Buy now
            </Button>
            <WishlistToggle productId={product.id} isWishlisted={wishlistedIds.has(product.id)} variant="button" />
          </div>

          <div className="flex flex-col gap-2.5 rounded-[6px] border border-border bg-surface p-4 text-[11px] leading-relaxed text-ink-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-ink">Free delivery</span>
              <span>On orders over ₹499</span>
            </div>
            <div className="flex flex-col gap-0.5 border-t border-border-subtle pt-2.5">
              <span className="text-xs font-semibold text-ink">7-day returns</span>
              <span>Free pickup from your address</span>
            </div>
            <div className="flex flex-col gap-0.5 border-t border-border-subtle pt-2.5">
              <span className="text-xs font-semibold text-ink">Secure payments</span>
              <span>Visa, Mastercard, UPI, net banking</span>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="rounded-[6px] border border-border bg-surface p-4">
          <h2 className="mb-3 text-[15px] font-bold tracking-tight">Customers also viewed</h2>
          <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} isWishlisted={wishlistedIds.has(item.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
