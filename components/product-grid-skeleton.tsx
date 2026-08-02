import { Skeleton } from "@/components/ui/skeleton";

export function ProductGridSkeleton({
  count = 8,
  cols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
}: {
  count?: number;
  cols?: string;
}) {
  return (
    <div className={`grid gap-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 p-2">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
