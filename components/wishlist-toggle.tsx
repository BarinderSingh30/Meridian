import { toggleWishlistAction } from "@/lib/actions/wishlist-actions";
import { cn } from "@/lib/utils";

export function WishlistToggle({
  productId,
  isWishlisted,
  className,
}: {
  productId: string;
  isWishlisted: boolean;
  className?: string;
}) {
  return (
    <form action={toggleWishlistAction} className={className}>
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={isWishlisted}
        className={cn(
          "flex size-8 items-center justify-center rounded-full bg-background/90 text-base leading-none shadow-sm hover:bg-background",
          isWishlisted ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {isWishlisted ? "♥" : "♡"}
      </button>
    </form>
  );
}
