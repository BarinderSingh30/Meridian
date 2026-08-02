import { submitReviewAction, deleteReviewAction } from "@/lib/actions/review-actions";
import { Button } from "@/components/ui/button";

export function ReviewForm({
  productId,
  slug,
  existing,
}: {
  productId: string;
  slug: string;
  existing?: { rating: number; title: string | null; body: string } | null;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold">{existing ? "Edit your review" : "Write a review"}</h3>
      <form action={submitReviewAction} className="mt-3 space-y-3">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="slug" value={slug} />

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Rating</span>
          <select
            name="rating"
            defaultValue={existing?.rating ?? 5}
            required
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Title (optional)</span>
          <input
            type="text"
            name="title"
            defaultValue={existing?.title ?? ""}
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Review</span>
          <textarea
            name="body"
            required
            rows={3}
            defaultValue={existing?.body ?? ""}
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>

        <div className="flex gap-3">
          <Button type="submit" size="sm">
            {existing ? "Update review" : "Post review"}
          </Button>
        </div>
      </form>

      {existing && (
        <form action={deleteReviewAction} className="mt-2">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="slug" value={slug} />
          <Button type="submit" variant="ghost" size="sm">
            Delete review
          </Button>
        </form>
      )}
    </div>
  );
}
