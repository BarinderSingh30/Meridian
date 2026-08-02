import { Skeleton } from "@/components/ui/skeleton";
import { ListRowSkeleton } from "@/components/list-row-skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-7 w-32" />
      <div className="mt-6">
        <ListRowSkeleton rows={8} />
      </div>
    </div>
  );
}
