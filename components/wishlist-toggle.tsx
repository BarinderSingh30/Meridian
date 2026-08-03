import { toggleWishlistAction } from "@/lib/actions/wishlist-actions";
import { cn } from "@/lib/utils";

export function WishlistToggle({
  productId,
  isWishlisted,
  variant = "icon",
  className,
}: {
  productId: string;
  isWishlisted: boolean;
  variant?: "icon" | "button";
  className?: string;
}) {
  return (
    <form action={toggleWishlistAction} className={className}>
      <input type="hidden" name="productId" value={productId} />
      {variant === "icon" ? (
        <button
          type="submit"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          className={cn(
            "flex size-[22px] items-center justify-center rounded-full bg-surface text-sm leading-none hover:bg-surface-muted",
            isWishlisted ? "text-danger" : "text-ink-3"
          )}
        >
          {isWishlisted ? "♥" : "♡"}
        </button>
      ) : (
        <button
          type="submit"
          aria-pressed={isWishlisted}
          className="w-full rounded-[5px] border border-border py-[11px] text-xs font-semibold text-ink-3 hover:bg-surface-muted"
        >
          {isWishlisted ? "♥ Saved to wishlist" : "♡ Save to wishlist"}
        </button>
      )}
    </form>
  );
}
