import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/product-grid-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-12">
      <Skeleton className="h-48 w-full rounded-2xl" />

      <section>
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full" />
          ))}
        </div>
      </section>

      <section>
        <Skeleton className="mb-4 h-6 w-48" />
        <ProductGridSkeleton />
      </section>
    </div>
  );
}
