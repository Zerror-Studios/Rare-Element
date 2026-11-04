"use client";

/**
 * "Write a review" on the product page (PRD-032 FR-D1, FR-D2)
 *
 * - Logged out: a link to login that comes back here (`?next=`).
 * - Logged in: hidden when the store switched reviews off
 *   (`storefrontReviewSettings`); otherwise the form. A customer who
 *   already reviewed the product (`myReviews`) sees their review with
 *   Edit and Delete; an edit keeps the photos still shown
 *   (`keepPhotoKeys`).
 * - The server decides eligibility and the status: the answer's status
 *   picks the message, and every refusal is shown by `extensions.reason`.
 * The section opens itself when the URL ends in `#write-review` (links
 * from the account and order pages).
 */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";

import ReviewFields, { EMPTY_REVIEW, fieldsToInput, reviewToFields } from "./ReviewFields";
import StarRating from "./StarRating";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import {
  DELETE_MY_REVIEW,
  GET_MY_REVIEWS,
  GET_STOREFRONT_REVIEW_SETTINGS,
  SUBMIT_REVIEW,
} from "@/graphql";
import { useAuthStore } from "@/store/auth-store";
import {
  getReviewErrorMessage,
  getReviewFieldError,
  rejectionLabel,
  reviewStatusLabel,
  reviewSubmittedMessage,
} from "@/utils/reviews";

// ─── Constants ────────────────────────────────────────────────────────────

/** Own reviews read to find this product's (customers rarely have more). */
const MY_REVIEWS_SCAN = 100;

const FIELD_FOR = {
  rating: "rating",
  title: "title",
  comment: "comment",
  displayName: "displayName",
  photoReceipts: "photos",
  keepPhotoKeys: "photos",
};

// ─── Component ────────────────────────────────────────────────────────────

const ReviewComposer = ({ productId }) => {
  const pathname = usePathname();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(EMPTY_REVIEW);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const settingsQuery = useQuery(GET_STOREFRONT_REVIEW_SETTINGS, { skip: !isLoggedIn });
  const myReviewsQuery = useQuery(GET_MY_REVIEWS, {
    skip: !isLoggedIn,
    variables: { limit: MY_REVIEWS_SCAN, offset: 0 },
    fetchPolicy: "cache-and-network",
  });
  const [submitReview, { loading: submitting }] = useMutation(SUBMIT_REVIEW);
  const [deleteMyReview, { loading: deleting }] = useMutation(DELETE_MY_REVIEW);

  const myReview = useMemo(
    () => (myReviewsQuery.data?.myReviews?.data || []).find((review) => String(review.productId) === String(productId)) || null,
    [myReviewsQuery.data, productId],
  );
  const settings = settingsQuery.data?.storefrontReviewSettings;

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#write-review") setIsOpen(true);
  }, []);

  const open = () => {
    setValue(reviewToFields(myReview));
    setErrors({});
    setFailure("");
    setMessage("");
    setIsOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setFailure("");
    if (!value.rating) {
      setErrors({ rating: "Choose a star rating." });
      return;
    }
    try {
      const { data } = await submitReview({
        variables: { input: { productId, ...fieldsToInput(value, { isEdit: Boolean(myReview) }) } },
      });
      setMessage(reviewSubmittedMessage(data?.submitReview?.status));
      setIsOpen(false);
      myReviewsQuery.refetch?.();
    } catch (error) {
      const fieldError = getReviewFieldError(error);
      if (fieldError?.field && FIELD_FOR[fieldError.field]) {
        setErrors({ [FIELD_FOR[fieldError.field]]: fieldError.message });
        return;
      }
      setFailure(getReviewErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    setFailure("");
    try {
      await deleteMyReview({ variables: { productId } });
      setMessage("Your review was deleted.");
      setIsOpen(false);
      myReviewsQuery.refetch?.();
    } catch (error) {
      setFailure(getReviewErrorMessage(error, "Your review couldn't be deleted. Please try again."));
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="review_composer" id="write-review">
        <Link
          href={`/login?next=${encodeURIComponent(`${pathname}#write-review`)}`}
          className="text-base underline"
        >
          Log in to write a review
        </Link>
      </div>
    );
  }
  if (settingsQuery.loading && !settings) return null;
  if (settings && !settings.enabled) return null;

  return (
    <div className="review_composer" id="write-review">
      {message && <p className="review_notice text-sm" role="status">{message}</p>}

      {!isOpen && myReview && (
        <div className="review_mine">
          <p className="text-sm uppercase">Your review · {reviewStatusLabel(myReview.status)}</p>
          <StarRating rating={myReview.rating} />
          {myReview.title && <p className="text-base">{myReview.title}</p>}
          {String(myReview.status).toUpperCase() === "REJECTED" && (
            <p className="text-sm">Not published: {rejectionLabel(myReview.rejectionReason)}</p>
          )}
          <div className="review_mine_actions">
            <button type="button" className="text-sm underline" onClick={open}>Edit</button>
            <button type="button" className="text-sm underline" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}

      {!isOpen && !myReview && (
        <button type="button" className="text-base underline" onClick={open}>
          Write a review
        </button>
      )}

      {isOpen && (
        <form className="review_form" onSubmit={handleSubmit} noValidate>
          <h3 className="text-xl">{myReview ? "Edit your review" : "Write a review"}</h3>
          <ReviewFields
            value={value}
            onChange={setValue}
            errors={errors}
            photosEnabled={Boolean(settings?.photosEnabled)}
            disabled={submitting}
            idPrefix={`review-${productId}`}
            onUploadingChange={setIsUploading}
          />
          {failure && <p className="input_error_msg text-sm" role="alert">{failure}</p>}
          <div className="review_form_actions">
            <GreenBoxBtn
              title={isUploading ? "Uploading photos…" : myReview ? "Save review" : "Submit review"}
              loading={submitting || isUploading}
            />
            <button type="button" className="text-sm underline" onClick={() => setIsOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReviewComposer;
