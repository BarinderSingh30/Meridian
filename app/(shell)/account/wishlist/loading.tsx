import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/product-grid-skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-7 w-32" />
      <div className="mt-6">
        <ProductGridSkeleton cols="grid-cols-2 sm:grid-cols-3" count={6} />
      </div>
    </div>
  );
}
