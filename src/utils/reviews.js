/**
 * Customer reviews: pure helpers (PRD-032)
 *
 * - `distributionRows` / `formatAverage`: the product page summary block
 *   from `Product.reviewSummary` (APPROVED reviews only; FR-C1);
 * - `buildReviewJsonLd`: `aggregateRating` and up to 10 `review` entries
 *   for the Product JSON-LD, only when the product has approved reviews
 *   (Google's review-snippet rules, FR-D1);
 * - `buildPresignedPostForm`: the S3 presigned POST body, every policy
 *   field first and the file last (S3 ignores fields after the file);
 * - `validateReviewPhoto` (FR-P1), `reviewStatusLabel`, `rejectionLabel`,
 *   `reviewSubmittedMessage` and `getReviewErrorMessage` (by
 *   `extensions.reason`, never message text).
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/reviews.util.js`.
 */

import { getErrorInfo, getErrorMessage } from "@/utils/errors";

// ─── Constants ────────────────────────────────────────────────────────────

export const MAX_RATING = 5;
export const REVIEW_TITLE_MAX_LENGTH = 120;
export const REVIEW_COMMENT_MAX_LENGTH = 5000;
export const REVIEW_DISPLAY_NAME_MAX_LENGTH = 40;
export const REVIEW_MAX_PHOTOS = 5;
export const REVIEW_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const REVIEW_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const REVIEW_PAGE_SIZE = 10;
/** FR-D1: JSON-LD carries at most this many reviews. */
export const REVIEW_JSON_LD_MAX = 10;

export const ReviewSortEnum = {
  NEWEST: "NEWEST",
  RATING_HIGH: "RATING_HIGH",
  RATING_LOW: "RATING_LOW",
};

export const REVIEW_SORT_OPTIONS = [
  { value: ReviewSortEnum.NEWEST, label: "Newest" },
  { value: ReviewSortEnum.RATING_HIGH, label: "Highest rated" },
  { value: ReviewSortEnum.RATING_LOW, label: "Lowest rated" },
];

export const REVIEW_REPORT_REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "OFFENSIVE", label: "Offensive" },
  { value: "NOT_GENUINE", label: "Not a genuine review" },
  { value: "OTHER", label: "Something else" },
];

const REJECTION_LABELS = {
  SPAM: "It looked like spam.",
  OFFENSIVE: "It contained offensive language.",
  PERSONAL_INFO: "It contained personal information.",
  NOT_ABOUT_PRODUCT: "It wasn't about the product.",
  NOT_GENUINE: "It didn't look like a genuine review.",
  DUPLICATE: "It repeated another review.",
  OTHER: "It didn't meet the store's review guidelines.",
};

const REVIEW_REASON_MESSAGES = {
  REVIEW_NOT_ALLOWED: "Only customers who received this product can review it.",
  REVIEWS_DISABLED: "Reviews are switched off for this store.",
  RATE_LIMITED: "You've sent a lot of reviews. Please try again later.",
  INVALID_REVIEW_LINK: "This link has expired. Log in to review your purchases.",
  INVALID_PHOTO: "That photo couldn't be added. Try a JPEG, PNG or WebP image.",
  FILE_TOO_LARGE: "Photos can be at most 5 MB.",
  TOO_MANY_PHOTOS: `Add up to ${REVIEW_MAX_PHOTOS} photos.`,
};

// ─── Summary ──────────────────────────────────────────────────────────────

/** "4.5" (one decimal), or "" without reviews. */
export function formatAverage(summary) {
  const count = Number(summary?.reviewCount) || 0;
  const average = Number(summary?.averageRating);
  if (!count || !Number.isFinite(average)) return "";
  return average.toFixed(1);
}

/** Rows 5★ → 1★ with their count and share (0–100, rounded). */
export function distributionRows(summary) {
  const counts = Array.isArray(summary?.distribution) ? summary.distribution : [];
  const total = Number(summary?.reviewCount) || 0;
  return [5, 4, 3, 2, 1].map((stars) => {
    const count = Math.max(0, Number(counts[stars - 1]) || 0);
    return { stars, count, percent: total ? Math.round((count / total) * 100) : 0 };
  });
}

/** Whole stars 0–5 for a rating. */
export function clampRating(value) {
  return Math.min(Math.max(Math.round(Number(value) || 0), 0), MAX_RATING);
}

// ─── JSON-LD (FR-D1) ──────────────────────────────────────────────────────

/** Date part of an ISO value, or undefined. */
function isoDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

/**
 * `{ aggregateRating, review }` to spread into the Product schema, or
 * `{}` when the product has no approved review.
 */
export function buildReviewJsonLd(summary, reviews = []) {
  const reviewCount = Number(summary?.reviewCount) || 0;
  const average = Number(summary?.averageRating);
  if (!reviewCount || !Number.isFinite(average) || average <= 0) return {};
  const entries = (reviews || [])
    .filter((review) => clampRating(review?.rating) > 0)
    .slice(0, REVIEW_JSON_LD_MAX)
    .map((review) => {
      const body = [review.title, review.comment].filter(Boolean).join(". ");
      return {
        "@type": "Review",
        author: { "@type": "Person", name: review.displayName || "Customer" },
        reviewRating: {
          "@type": "Rating",
          ratingValue: clampRating(review.rating),
          bestRating: MAX_RATING,
        },
        ...(isoDate(review.createdAt) ? { datePublished: isoDate(review.createdAt) } : {}),
        ...(body ? { reviewBody: body } : {}),
      };
    });
  return {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Math.round(average * 10) / 10,
      reviewCount,
      bestRating: MAX_RATING,
    },
    ...(entries.length ? { review: entries } : {}),
  };
}

// ─── Photos (FR-P1) ───────────────────────────────────────────────────────

/** An error message for a file the store won't take, or null. */
export function validateReviewPhoto(file) {
  if (!file) return "Choose a photo.";
  if (!REVIEW_PHOTO_TYPES.includes(file.type)) {
    return "Photos can be JPEG, PNG or WebP.";
  }
  if (!file.size || file.size > REVIEW_PHOTO_MAX_BYTES) {
    return "Photos can be at most 5 MB.";
  }
  return null;
}

/**
 * The multipart body for S3: every presigned field in order, then the
 * file. `FormDataImpl` is injectable for tests.
 */
export function buildPresignedPostForm(fields, file, FormDataImpl = FormData) {
  const form = new FormDataImpl();
  for (const field of fields || []) form.append(field.name, field.value);
  form.append("file", file);
  return form;
}

// ─── Status and messages ──────────────────────────────────────────────────

/** "Live", "Pending" or "Not published" for the account list. */
export function reviewStatusLabel(status) {
  const value = String(status || "").toUpperCase();
  if (value === "APPROVED") return "Live";
  if (value === "REJECTED") return "Not published";
  return "Pending";
}

/** Why a review wasn't published, in plain words. */
export function rejectionLabel(reason) {
  return REJECTION_LABELS[String(reason || "").toUpperCase()] || REJECTION_LABELS.OTHER;
}

/** The note shown after a submit (FR-D2). */
export function reviewSubmittedMessage(status) {
  return String(status || "").toUpperCase() === "APPROVED"
    ? "Your review is live."
    : "Thanks! Your review will appear once the store approves it.";
}

/** A review field the server refused (`INVALID_REVIEW_FIELD`), or null. */
export function getReviewFieldError(error) {
  const { reason } = getErrorInfo(error);
  if (reason !== "INVALID_REVIEW_FIELD") return null;
  const first = error?.errors?.[0];
  return { field: first?.extensions?.field || null, message: first?.message || "Check this field." };
}

/** Shopper message for a review or photo error. */
export function getReviewErrorMessage(error, fallback = "Your review couldn't be sent. Please try again.") {
  return getErrorMessage(error, fallback, REVIEW_REASON_MESSAGES);
}
