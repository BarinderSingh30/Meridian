import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { auth } from "@/lib/auth";
import { getWishlistedProducts } from "@/lib/wishlist";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

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
        <EmptyState
          icon={Heart}
          title="Nothing here yet"
          description="Tap the heart on any product to save it to your wishlist."
          actions={
            <Link href="/">
              <Button>Browse products</Button>
            </Link>
          }
        />
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
