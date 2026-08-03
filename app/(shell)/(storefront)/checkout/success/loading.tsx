import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <Skeleton className="mx-auto h-8 w-64" />
      <Skeleton className="mx-auto mt-4 h-4 w-40" />
    </div>
  );
}
