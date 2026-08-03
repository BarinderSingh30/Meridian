import { Skeleton } from "@/components/ui/skeleton";
import { ListRowSkeleton } from "@/components/list-row-skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-7 w-48" />
      <div className="mt-6">
        <ListRowSkeleton rows={4} />
      </div>
    </div>
  );
}
