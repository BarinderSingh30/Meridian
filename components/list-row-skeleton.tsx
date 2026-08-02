import { Skeleton } from "@/components/ui/skeleton";

export function ListRowSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 p-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
