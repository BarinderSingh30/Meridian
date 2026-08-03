import Link from "next/link";
import type { Metadata } from "next";
import { getAdminReviews } from "@/lib/admin/reviews";
import { toggleReviewStatusAction } from "@/lib/actions/admin/review-actions";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Admin Reviews",
};

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Reviews</h1>
      <p className="mt-1 text-sm text-muted-foreground">{reviews.length} most recent reviews</p>

      <div className="mt-4 divide-y divide-border rounded-lg border border-border">
        {reviews.map((review) => (
          <div key={review.id} className="flex items-start gap-4 p-4 text-sm">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} />
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${review.status === "PUBLISHED" ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"}`}
                >
                  {review.status}
                </span>
              </div>
              <Link href={`/p/${review.product.slug}`} className="mt-1 block font-medium hover:underline">
                {review.product.name}
              </Link>
              {review.title && <p className="mt-1">{review.title}</p>}
              <p className="mt-1 text-muted-foreground">{review.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {review.user.name ?? review.user.email}
                {review.isVerifiedPurchase && " · Verified Purchase"}
              </p>
            </div>
            <form action={toggleReviewStatusAction}>
              <input type="hidden" name="id" value={review.id} />
              <Button type="submit" variant="ghost" size="sm">
                {review.status === "PUBLISHED" ? "Hide" : "Publish"}
              </Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
