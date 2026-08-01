import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  className,
}: {
  rating: number;
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 text-sm", className)}>
      <span aria-hidden="true" className="text-amber-500">
        {"★".repeat(Math.round(rating))}
        <span className="text-muted-foreground/40">{"★".repeat(5 - Math.round(rating))}</span>
      </span>
      <span className="sr-only">{rating.toFixed(1)} out of 5 stars</span>
      {count !== undefined && <span className="text-muted-foreground">({count})</span>}
    </div>
  );
}
