"use client";

import { StarRating } from "./StarRating";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  userName: string;
  createdAt: string;
  isVerifiedPurchase: boolean;
  adminResponse: string | null;
}

interface ProductReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export function ProductReviews({ reviews, averageRating, totalReviews }: ProductReviewsProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-brand-text-muted">No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4 pb-6 border-b">
        <div className="text-center">
          <p className="text-4xl font-bold text-brand-text">{averageRating.toFixed(1)}</p>
          <StarRating rating={averageRating} size={20} />
          <p className="text-sm text-brand-text-muted mt-1">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="pb-6 border-b last:border-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <StarRating rating={review.rating} size={14} />
                <span className="font-medium text-sm">{review.userName}</span>
                {review.isVerifiedPurchase && (
                  <span className="text-xs text-brand-success bg-brand-success/10 px-2 py-0.5 rounded">
                    Verified Purchase
                  </span>
                )}
              </div>
              <time className="text-xs text-brand-text-muted">
                {new Date(review.createdAt).toLocaleDateString()}
              </time>
            </div>
            {review.title && (
              <h4 className="font-medium text-brand-text mb-1">{review.title}</h4>
            )}
            {review.body && (
              <p className="text-sm text-brand-text-secondary">{review.body}</p>
            )}
            {review.adminResponse && (
              <div className="mt-3 ml-4 pl-4 border-l-2 border-brand-primary/30">
                <p className="text-xs font-medium text-brand-primary mb-1">Store Response</p>
                <p className="text-sm text-brand-text-secondary">{review.adminResponse}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
