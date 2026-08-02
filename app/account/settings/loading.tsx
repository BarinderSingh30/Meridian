import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-7 w-32" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-10 w-full max-w-sm" />
      </div>
    </div>
  );
}
