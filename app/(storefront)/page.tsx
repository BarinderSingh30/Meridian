import Link from "next/link";
import Image from "next/image";
import { getTopLevelCategories } from "@/lib/categories/queries";
import { getFeaturedProducts, getNewArrivals } from "@/lib/products/queries";
import { ProductCard } from "@/components/product-card";

export default async function HomePage() {
  const [categories, featured, newArrivals] = await Promise.all([
    getTopLevelCategories(),
    getFeaturedProducts(8),
    getNewArrivals(8),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-12">
      <section className="rounded-2xl bg-muted px-8 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Everything you need, shipped fast.</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Shop electronics, home goods, books, and more — all in one place.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/c/${category.slug}`}
              className="group overflow-hidden rounded-lg border border-border"
            >
              <div className="relative aspect-[4/3] bg-muted">
                {category.imageUrl && (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    sizes="(min-width: 1024px) 20vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <p className="px-3 py-2 text-sm font-medium">{category.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Featured products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">New arrivals</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
