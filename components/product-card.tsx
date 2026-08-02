import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { StarRating } from "@/components/star-rating";
import { WishlistToggle } from "@/components/wishlist-toggle";

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
}: {
  product: ProductCardData;
  isWishlisted?: boolean;
}) {
  const image = product.images[0];
  const outOfStock = product.stockQuantity <= 0;

  return (
    <div className="group relative flex flex-col gap-2 rounded-lg border border-transparent p-2 hover:border-border">
      <Link href={`/p/${product.slug}`} className="contents">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          {image && (
            <Image
              src={image.url}
              alt={image.altText ?? product.name}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          )}
          {outOfStock && (
            <span className="absolute left-2 top-2 rounded bg-background/90 px-1.5 py-0.5 text-xs font-medium">
              Out of stock
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="line-clamp-2 text-sm">{product.name}</p>
          {product.ratingCount > 0 && (
            <StarRating rating={product.ratingAvg} count={product.ratingCount} className="text-xs" />
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium">{formatMoney(product.priceCents)}</span>
            {product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents && (
              <span className="text-xs text-muted-foreground line-through">
                {formatMoney(product.compareAtPriceCents)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <WishlistToggle productId={product.id} isWishlisted={isWishlisted} className="absolute right-3 top-3" />
    </div>
  );
}
