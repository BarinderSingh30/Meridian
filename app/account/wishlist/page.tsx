import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getWishlistedProducts } from "@/lib/wishlist";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = {
  title: "Wishlist",
};

export default async function WishlistPage() {
  const session = await auth();
  const products = await getWishlistedProducts(session!.user.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Wishlist</h1>

      {products.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Nothing here yet. Tap the heart on any product to save it.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} isWishlisted />
          ))}
        </div>
      )}
    </div>
  );
}
