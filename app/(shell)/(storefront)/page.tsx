import Link from "next/link";
import Image from "next/image";
import { getTopLevelCategories } from "@/lib/categories/queries";
import { getFeaturedProducts, getNewArrivals } from "@/lib/products/queries";
import { getWishlistedProductIds } from "@/lib/wishlist";
import { ProductCard } from "@/components/product-card";

export default async function HomePage() {
  const [categories, featured, newArrivals, wishlistedIds] = await Promise.all([
    getTopLevelCategories(),
    getFeaturedProducts(6),
    getNewArrivals(6),
    getWishlistedProductIds(),
  ]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_300px]">
        <div className="flex min-h-[210px] flex-col justify-center gap-3 rounded-[6px] bg-chrome-deep px-8 py-[30px] text-white">
          <span className="text-[10px] font-bold tracking-[0.14em] text-teal-bright">MERIDIAN MARKETPLACE</span>
          <h1 className="max-w-[16ch] text-[38px] leading-[1.03] font-extrabold tracking-tight">
            Everything you need, shipped fast.
          </h1>
          <p className="max-w-[46ch] text-sm leading-relaxed text-[#a8bcc2]">
            Shop electronics, home goods, books, and more — all in one place.
          </p>
          <div className="mt-1.5 flex gap-2">
            <a href="#deals-of-the-day" className="rounded-[5px] bg-teal-bright px-5 py-3 text-xs font-bold text-[#06251f]">
              Shop deals
            </a>
            <a
              href="#shop-by-category"
              className="rounded-[5px] border border-[#2f4b55] px-5 py-3 text-xs font-semibold text-white"
            >
              Browse all categories
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <TrustCard title="Secure payments" body="Visa, Mastercard, UPI and net banking, all encrypted." />
          <TrustCard title="7-day returns" body="No-questions returns on every eligible order." />
          <TrustCard title="Track your order" body="Live updates from dispatch to doorstep." />
        </div>
      </div>

      <section id="shop-by-category" className="rounded-[6px] border border-border bg-surface p-4">
        <h2 className="mb-3 text-base font-bold tracking-tight">Shop by category</h2>
        <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/c/${category.slug}`}
              className="overflow-hidden rounded-[6px] border border-border hover:border-[#CBD5E1]"
            >
              <div className="relative aspect-[4/3] bg-surface-muted">
                {category.imageUrl && (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    sizes="(min-width: 1024px) 20vw, 33vw"
                    className="object-cover"
                  />
                )}
              </div>
              <p className="px-2.5 py-2 text-xs font-semibold">{category.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section id="deals-of-the-day" className="rounded-[6px] border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight">Deals of the day</h2>
            <div className="flex gap-3.5 text-xs font-medium">
              <span className="font-bold text-teal">Featured</span>
              <span className="text-muted-2">Newest</span>
              <span className="text-muted-2">Best rated</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} isWishlisted={wishlistedIds.has(product.id)} />
            ))}
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="rounded-[6px] border border-border bg-surface p-4">
          <h2 className="mb-3 text-base font-bold tracking-tight">New arrivals</h2>
          <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} isWishlisted={wishlistedIds.has(product.id)} />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PromoCard title="New arrivals" body="Explore the latest additions across Electronics and Home." />
        <PromoCard title="Everyday essentials" body="Grocery top-ups, stationery and home basics." />
        <PromoCard title="Highest rated" body="Products rated highly by verified buyers." />
      </div>
    </div>
  );
}

function TrustCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-1 rounded-[6px] border border-border bg-surface px-4 py-3.5">
      <span className="text-[13px] font-bold">{title}</span>
      <span className="text-[11px] leading-relaxed text-ink-3">{body}</span>
    </div>
  );
}

function PromoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[6px] border border-border bg-surface p-4">
      <span className="text-[13px] font-bold">{title}</span>
      <span className="text-xs leading-relaxed text-ink-3">{body}</span>
    </div>
  );
}
