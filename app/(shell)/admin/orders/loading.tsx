import { Skeleton } from "@/components/ui/skeleton";
import { ListRowSkeleton } from "@/components/list-row-skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-7 w-24" />
      <div className="mt-4 flex gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-16 rounded-full" />
        ))}
      </div>
      <div className="mt-4">
        <ListRowSkeleton rows={8} />
      </div>
    </div>
  );
}
