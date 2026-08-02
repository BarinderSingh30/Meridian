import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/product-grid-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="mt-2 h-8 w-48" />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <Skeleton className="hidden h-64 w-full lg:block" />
        <ProductGridSkeleton cols="grid-cols-2 sm:grid-cols-3" count={9} />
      </div>
    </div>
  );
}
