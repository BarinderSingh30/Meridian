import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { StarRating } from "@/components/star-rating";
import { WishlistToggle } from "@/components/wishlist-toggle";
import { NotifyMeForm } from "@/components/notify-me-form";
import { addToCartAction } from "@/lib/actions/cart-actions";
import { highlightMatches } from "@/components/highlighted-text";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  stockQuantity: number;
  ratingAvg: number;
  ratingCount: number;
  images: { url: string; altText: string | null }[];
};

export function ProductCard({
  product,
  isWishlisted = false,
  highlightQuery,
}: {
  product: ProductCardData;
  isWishlisted?: boolean;
  highlightQuery?: string;
}) {
  const image = product.images[0];
  const outOfStock = product.stockQuantity <= 0;
  const hasDiscount = product.compareAtPriceCents !== null && product.compareAtPriceCents > product.priceCents;
  const discountPct = hasDiscount
    ? Math.round((1 - product.priceCents / product.compareAtPriceCents!) * 100)
    : 0;

  return (
    <div className="group relative overflow-hidden rounded-[6px] border border-border bg-surface hover:border-[#CBD5E1]">
      <Link href={`/p/${product.slug}`} className="contents">
        <div className="relative aspect-square overflow-hidden bg-surface-muted">
          {image && (
            <Image
              src={image.url}
              alt={image.altText ?? product.name}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          )}
          {outOfStock ? (
            <span className="absolute top-1.5 left-1.5 rounded-[3px] bg-ink px-[5px] py-1 text-[9px] font-bold text-white">
              SOLD OUT
            </span>
          ) : hasDiscount ? (
            <span className="absolute top-1.5 left-1.5 rounded-[3px] bg-danger px-[5px] py-1 text-[9px] font-bold text-white">
              -{discountPct}%
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-[5px] p-[9px] pb-0">
          <p className="line-clamp-2 min-h-[29px] text-[11px] leading-[1.3] font-medium text-[#1e293b]">
            {highlightMatches(product.name, highlightQuery)}
          </p>
          {product.ratingCount > 0 && (
            <StarRating rating={product.ratingAvg} count={product.ratingCount} className="text-[10px] text-ink-3" />
          )}
          <div className="flex items-baseline gap-[5px]">
            <span className="text-[15px] font-extrabold tracking-tight text-ink">{formatMoney(product.priceCents)}</span>
            {hasDiscount && (
              <span className="text-[10px] text-muted-2 line-through">{formatMoney(product.compareAtPriceCents!)}</span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-[9px] pt-[5px]">
        {outOfStock ? (
          <NotifyMeForm productId={product.id} />
        ) : (
          <form action={addToCartAction}>
            <input type="hidden" name="productId" value={product.id} />
            <button
              type="submit"
              className="w-full rounded-[4px] bg-teal py-[7px] text-center text-[10px] font-semibold text-white hover:bg-teal-dark"
            >
              Add to cart
            </button>
          </form>
        )}
      </div>

      <WishlistToggle productId={product.id} isWishlisted={isWishlisted} className="absolute top-2 right-2" />
    </div>
  );
}
