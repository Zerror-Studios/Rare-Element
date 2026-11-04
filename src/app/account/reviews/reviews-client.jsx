"use client";

/**
 * My reviews (PRD-032 FR-D4, FR-A8)
 *
 * "Review your purchases" (`myReviewableProducts`: delivered products not
 * reviewed yet, each linking to its product page's form) and "My reviews"
 * (`myReviews`, every status: Live, Pending or Not published with the
 * reason in plain words; Edit opens the product page's form, Delete calls
 * `deleteMyReview`). Never cached: per-customer data.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/pages/profile/reviews.jsx`.
 */

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";

import StarRating from "@/components/product/reviews/StarRating";
import { DELETE_MY_REVIEW, GET_MY_REVIEWABLE_PRODUCTS, GET_MY_REVIEWS } from "@/graphql";
import { getReviewErrorMessage, rejectionLabel, reviewStatusLabel } from "@/utils/reviews";

// ─── Constants ────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────

const productHref = (product, productId) => `/products/${product?.slug || productId}#write-review`;

// ─── Component ────────────────────────────────────────────────────────────

export default function ReviewsClient() {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [failure, setFailure] = useState("");
  const reviewable = useQuery(GET_MY_REVIEWABLE_PRODUCTS, {
    variables: { limit: 20, offset: 0 },
    fetchPolicy: "network-only",
  });
  const mine = useQuery(GET_MY_REVIEWS, {
    variables: { limit, offset: 0 },
    fetchPolicy: "cache-and-network",
  });
  const [deleteMyReview, { loading: deleting }] = useMutation(DELETE_MY_REVIEW);

  const reviews = mine.data?.myReviews?.data || [];
  const total = mine.data?.myReviews?.totalCount || 0;
  const toReview = reviewable.data?.myReviewableProducts?.items || [];

  const handleDelete = async (productId) => {
    setFailure("");
    try {
      await deleteMyReview({ variables: { productId } });
      await Promise.all([mine.refetch(), reviewable.refetch()]);
    } catch (error) {
      setFailure(getReviewErrorMessage(error, "Your review couldn't be deleted. Please try again."));
    }
  };

  return (
    <div className="account_rightSection">
      <h1 className="purchases_heading text-xl">Review your purchases</h1>
      {reviewable.loading && !reviewable.data && <p role="status">Loading…</p>}
      {reviewable.error && !reviewable.data && (
        <p role="alert">
          We couldn&apos;t load your purchases.{" "}
          <button type="button" className="underline" onClick={() => reviewable.refetch()}>Try again</button>
        </p>
      )}
      {reviewable.data && toReview.length === 0 && <p className="text-base">Nothing to review yet.</p>}
      {toReview.length > 0 && (
        <ul className="account_reviews_list">
          {toReview.map((item) => (
            <li key={item.productId} className="account_review_item">
              {item.imageUrl && <img src={item.imageUrl} alt="" className="review_link_image" loading="lazy" />}
              <p className="text-base">{item.name || "Product"}</p>
              <Link className="text-sm underline" href={productHref(item.product, item.productId)}>
                Write a review
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="checkout_thin_line"></div>

      <h2 className="purchases_heading text-xl">My reviews</h2>
      {failure && <p className="input_error_msg text-sm" role="alert">{failure}</p>}
      {mine.loading && !mine.data && <p role="status">Loading…</p>}
      {mine.error && !mine.data && (
        <p role="alert">
          We couldn&apos;t load your reviews.{" "}
          <button type="button" className="underline" onClick={() => mine.refetch()}>Try again</button>
        </p>
      )}
      {mine.data && reviews.length === 0 && <p className="text-base">You haven&apos;t written a review yet.</p>}
      {reviews.length > 0 && (
        <ul className="account_reviews_list">
          {reviews.map((review) => {
            const isHidden = String(review.status).toUpperCase() === "REJECTED";
            return (
              <li key={review._id} className="account_review_item">
                <p className="text-base">{review.product?.name || "Product"}</p>
                <span className="account_review_status text-xs uppercase">{reviewStatusLabel(review.status)}</span>
                <StarRating rating={review.rating} />
                {review.title && <p className="text-base">{review.title}</p>}
                {review.comment && <p className="product_review_comment text-sm">{review.comment}</p>}
                {isHidden && <p className="text-sm">Not published: {rejectionLabel(review.rejectionReason)}</p>}
                <div className="review_mine_actions">
                  <Link className="text-sm underline" href={productHref(review.product, review.productId)}>Edit</Link>
                  <button
                    type="button"
                    className="text-sm underline"
                    disabled={deleting}
                    onClick={() => handleDelete(review.productId)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {reviews.length < total && (
        <button type="button" className="text-base underline" onClick={() => setLimit((current) => current + PAGE_SIZE)}>
          Show more
        </button>
      )}
    </div>
  );
}
