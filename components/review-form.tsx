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
    <div className="rounded-[5px] border border-border-subtle bg-surface-muted p-3.5">
      <h3 className="text-xs font-bold text-ink">{existing ? "Edit your review" : "Write a review"}</h3>
      <form action={submitReviewAction} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="slug" value={slug} />

        <label className="block text-xs">
          <span className="mb-1 block font-medium text-ink-3">Rating</span>
          <select
            name="rating"
            defaultValue={existing?.rating ?? 5}
            required
            className="rounded-[5px] border border-border bg-surface px-2.5 py-2 text-xs text-ink outline-none focus-visible:border-[1.5px] focus-visible:border-teal"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs">
          <span className="mb-1 block font-medium text-ink-3">Title (optional)</span>
          <input
            type="text"
            name="title"
            defaultValue={existing?.title ?? ""}
            className="w-full rounded-[5px] border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus-visible:border-[1.5px] focus-visible:border-teal"
          />
        </label>

        <label className="block text-xs">
          <span className="mb-1 block font-medium text-ink-3">Review</span>
          <textarea
            name="body"
            required
            rows={3}
            defaultValue={existing?.body ?? ""}
            className="w-full rounded-[5px] border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus-visible:border-[1.5px] focus-visible:border-teal"
          />
        </label>

        <div className="flex gap-2">
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
