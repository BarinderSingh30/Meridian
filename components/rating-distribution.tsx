export function RatingDistribution({
  distribution,
  total,
}: {
  distribution: Record<number, number>;
  total: number;
}) {
  if (total === 0) return null;

  return (
    <div className="space-y-1">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-10 shrink-0">{star} star</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 shrink-0 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
