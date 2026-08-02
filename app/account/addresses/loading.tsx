import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-10">
      <div>
        <Skeleton className="h-7 w-32" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
