"use client";

/**
 * Product reviews (PRD-014 FR-2.8, PRD-032 FR-D1)
 *
 * The rating summary (`Product.reviewSummary`, read on its own by the
 * page so the catalog query never depends on commerce; null when that read
 * failed: the block is left out): stars, average, count and the 5★…1★
 * bars, each a filter; the approved reviews (the first page
 * read with the page; another star, "With photos", a sort or "Load more"
 * reads `getReviews` from the browser), and "Write a review"
 * (`ReviewComposer`). Each review shows the reviewer's display name, the
 * verified-buyer badge, the variant bought, the date, its text, photos
 * (with a viewer) and the store's reply, and can be reported. The server
 * returns APPROVED reviews only; text is rendered as text.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/components/product/ProductReviews.jsx`.
 */

import React, { useRef, useState } from "react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { RiCloseLine } from "@remixicon/react";

import StarRating from "./reviews/StarRating";
import ReviewComposer from "./reviews/ReviewComposer";
import { GET_PRODUCT_REVIEWS, REPORT_REVIEW } from "@/graphql";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import {
  REVIEW_PAGE_SIZE,
  REVIEW_REPORT_REASONS,
  REVIEW_SORT_OPTIONS,
  ReviewSortEnum,
  distributionRows,
  formatAverage,
} from "@/utils/reviews";

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

// ─── Photo viewer ─────────────────────────────────────────────────────────

const PhotoViewer = ({ photo, onClose }) => {
  const dialogRef = useRef(null);
  useDialogA11y(dialogRef, Boolean(photo), onClose);
  return (
    <div
      ref={dialogRef}
      className={`review_lightbox ${photo ? "open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Review photo"
      tabIndex={-1}
      onClick={onClose}
    >
      {photo && (
        <>
          <button type="button" className="review_lightbox_close" aria-label="Close photo" onClick={onClose}>
            <RiCloseLine size={24} aria-hidden="true" />
          </button>
          {/* Plain <img>: review photos come from the store's media host */}
          <img src={photo.url} alt={photo.alt} onClick={(event) => event.stopPropagation()} />
        </>
      )}
    </div>
  );
};

// ─── Review ───────────────────────────────────────────────────────────────

const ReviewItem = ({ review, onOpenPhoto }) => {
  const [isReporting, setIsReporting] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [reportReview, { loading }] = useMutation(REPORT_REVIEW);
  const date = formatReviewDate(review.createdAt);
  const name = review.displayName || "Customer";

  const report = async (reason) => {
    try {
      await reportReview({ variables: { id: review._id, reason } });
    } catch {
      // The answer is the same either way; nothing to show
    }
    setIsReporting(false);
    setIsReported(true);
  };

  return (
    <li className="product_review">
      <StarRating rating={review.rating} />
      {review.title && <p className="product_review_title text-base">{review.title}</p>}
      {review.comment && <p className="product_review_comment text-base">{review.comment}</p>}
      {review.photos?.length > 0 && (
        <div className="review_photo_row">
          {review.photos.map((photo, index) => (
            <button
              key={photo.key}
              type="button"
              className="review_photo_thumb"
              aria-label={`Open photo ${index + 1} from ${name}`}
              onClick={() => onOpenPhoto({ url: photo.url, alt: `Photo ${index + 1} from ${name}` })}
            >
              <img src={photo.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <p className="product_review_meta text-xs uppercase">
        {name}
        {review.verifiedPurchase ? " · Verified buyer" : ""}
        {review.variantLabel ? ` · ${review.variantLabel}` : ""}
        {date ? ` · ${date}` : ""}
      </p>
      {review.storeReply?.message && (
        <div className="product_review_reply text-sm">
          <p className="uppercase text-xs">Reply from the store</p>
          <p className="product_review_comment">{review.storeReply.message}</p>
        </div>
      )}
      <div className="product_review_report text-xs">
        {isReported ? (
          <span role="status">Thanks, we&apos;ll take a look.</span>
        ) : isReporting ? (
          <span className="product_review_report_reasons">
            Why?{" "}
            {REVIEW_REPORT_REASONS.map((reason) => (
              <button key={reason.value} type="button" className="underline" disabled={loading} onClick={() => report(reason.value)}>
                {reason.label}
              </button>
            ))}
            <button type="button" className="underline" onClick={() => setIsReporting(false)}>Cancel</button>
          </span>
        ) : (
          <button type="button" className="underline" onClick={() => setIsReporting(true)}>Report</button>
        )}
      </div>
    </li>
  );
};

// ─── Component ────────────────────────────────────────────────────────────

const ProductReviews = ({ productId, summary, reviews = [], totalCount = 0 }) => {
  const client = useApolloClient();
  const [list, setList] = useState(reviews);
  const [total, setTotal] = useState(Math.max(totalCount, reviews.length));
  const [rating, setRating] = useState(null);
  const [hasPhotos, setHasPhotos] = useState(false);
  const [sort, setSort] = useState(ReviewSortEnum.NEWEST);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [photo, setPhoto] = useState(null);
  const requestRef = useRef(0);

  const average = formatAverage(summary);
  const reviewCount = Number(summary?.reviewCount) || 0;
  // Without a summary (its read failed) the reviews read with the page still count
  const hasReviews = reviewCount > 0 || reviews.length > 0;

  const load = async (next, offset = 0) => {
    const request = ++requestRef.current;
    setIsLoading(true);
    setLoadError(false);
    try {
      const { data } = await client.query({
        query: GET_PRODUCT_REVIEWS,
        fetchPolicy: "network-only",
        variables: {
          limit: REVIEW_PAGE_SIZE,
          offset,
          sort: next.sort,
          filter: {
            productId,
            ...(next.rating ? { rating: next.rating } : {}),
            ...(next.hasPhotos ? { hasPhotos: true } : {}),
          },
        },
      });
      // A slower, older answer never replaces a newer filter's list
      if (request !== requestRef.current) return;
      const page = data?.getReviews?.data || [];
      setList((current) => (offset ? [...current, ...page] : page));
      setTotal(data?.getReviews?.totalCount || 0);
    } catch {
      if (request === requestRef.current) setLoadError(true);
    } finally {
      if (request === requestRef.current) setIsLoading(false);
    }
  };

  const change = (patch) => {
    const next = { rating, hasPhotos, sort, ...patch };
    setRating(next.rating);
    setHasPhotos(next.hasPhotos);
    setSort(next.sort);
    load(next);
  };

  return (
    <section className="product_reviews padding" aria-labelledby="product_reviews_title">
      <h2 id="product_reviews_title" className="product_reviews_title text-2xl">
        Reviews{reviewCount ? ` (${reviewCount})` : ""}
      </h2>

      {reviewCount > 0 ? (
        <div className="product_reviews_summary">
          <div className="product_reviews_average">
            <p className="text-3xl">{average}</p>
            <StarRating rating={Number(summary.averageRating)} size={18} label={`Average ${average} out of 5`} />
            <p className="text-sm">{reviewCount} {reviewCount === 1 ? "review" : "reviews"}</p>
          </div>
          <ul className="product_reviews_bars">
            {distributionRows(summary).map((row) => (
              <li key={row.stars}>
                <button
                  type="button"
                  className={`product_reviews_bar text-sm ${rating === row.stars ? "active" : ""}`}
                  aria-pressed={rating === row.stars}
                  aria-label={`${row.stars} stars: ${row.count} ${row.count === 1 ? "review" : "reviews"}`}
                  disabled={!row.count}
                  onClick={() => change({ rating: rating === row.stars ? null : row.stars })}
                >
                  <span>{row.stars}★</span>
                  <span className="product_reviews_bar_track" aria-hidden="true">
                    <span style={{ width: `${row.percent}%` }} />
                  </span>
                  <span>{row.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        !hasReviews && <p className="text-base">No reviews yet. Be the first to review this product.</p>
      )}

      <ReviewComposer productId={productId} />

      {hasReviews && (
        <div className="product_reviews_controls text-sm">
          <label className="product_reviews_photos">
            <input type="checkbox" checked={hasPhotos} onChange={(event) => change({ hasPhotos: event.target.checked })} />
            With photos
          </label>
          <label>
            Sort by{" "}
            <select value={sort} onChange={(event) => change({ sort: event.target.value })}>
              {REVIEW_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          {rating && (
            <button type="button" className="underline" onClick={() => change({ rating: null })}>
              Show all ratings
            </button>
          )}
        </div>
      )}

      {loadError && (
        <p className="text-sm" role="alert">
          Reviews couldn&apos;t load.{" "}
          <button type="button" className="underline" onClick={() => load({ rating, hasPhotos, sort }, 0)}>Try again</button>
        </p>
      )}

      {list.length > 0 && (
        <ul className="product_reviews_list" aria-busy={isLoading}>
          {list.map((review) => (
            <ReviewItem key={review._id} review={review} onOpenPhoto={setPhoto} />
          ))}
        </ul>
      )}
      {!isLoading && !loadError && hasReviews && list.length === 0 && (
        <p className="text-sm">No reviews match these filters.</p>
      )}

      {list.length < total && (
        <button
          type="button"
          className="text-base underline product_reviews_more"
          disabled={isLoading}
          onClick={() => load({ rating, hasPhotos, sort }, list.length)}
        >
          {isLoading ? "Loading…" : "Load more reviews"}
        </button>
      )}

      <PhotoViewer photo={photo} onClose={() => setPhoto(null)} />
    </section>
  );
};

export default ProductReviews;
