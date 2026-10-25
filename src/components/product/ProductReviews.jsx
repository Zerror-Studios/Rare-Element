/**
 * Product reviews (PRD-014 FR-2.8)
 *
 * Approved reviews of this product (`getReviews`, read with the page; the
 * server returns APPROVED only and never names the reviewer). With no
 * approved review the section is not rendered: no placeholder ratings.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/components/product/ProductReviews.jsx`.
 */

import React from "react";
import { RiStarFill, RiStarLine } from "@remixicon/react";

// ─── Constants ────────────────────────────────────────────────────────────

// Ratings are out of five (ReviewInput.rating).
const MAX_RATING = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────

const formatReviewDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const clampRating = (value) =>
  Math.min(Math.max(Math.round(Number(value) || 0), 0), MAX_RATING);

// ─── Component ────────────────────────────────────────────────────────────

const ProductReviews = ({ reviews = [], totalCount = 0 }) => {
  if (!reviews.length) return null;
  const total = Math.max(totalCount, reviews.length);

  return (
    <section className="product_reviews padding" aria-labelledby="product_reviews_title">
      <h2 id="product_reviews_title" className="product_reviews_title text-2xl">
        Reviews ({total})
      </h2>
      <ul className="product_reviews_list">
        {reviews.map((review) => {
          const rating = clampRating(review.rating);
          const date = formatReviewDate(review.createdAt);
          return (
            <li key={review._id} className="product_review">
              <span
                className="product_review_stars"
                role="img"
                aria-label={`Rated ${rating} out of ${MAX_RATING}`}
              >
                {[...Array(MAX_RATING)].map((_, index) =>
                  index < rating ? (
                    <RiStarFill key={index} size={14} aria-hidden="true" />
                  ) : (
                    <RiStarLine key={index} size={14} aria-hidden="true" />
                  ),
                )}
              </span>
              {review.comment && (
                <p className="product_review_comment text-base">{review.comment}</p>
              )}
              <p className="product_review_meta text-xs uppercase">
                Customer review{date ? ` · ${date}` : ""}
              </p>
            </li>
          );
        })}
      </ul>
      {total > reviews.length && (
        <p className="product_reviews_more text-sm">
          Showing the latest {reviews.length} of {total} reviews.
        </p>
      )}
    </section>
  );
};

export default ProductReviews;
