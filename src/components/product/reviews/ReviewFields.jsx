"use client";

/**
 * Review fields (PRD-032 FR-D2, FR-D3, FR-P1)
 *
 * Controlled: `value` is `{ rating, title, comment, displayName, photos }`
 * and every change calls `onChange(next)`. Photos are
 * `{ key?, url, receipt? }`: a kept photo has its `key`, a new one its
 * media `receipt`. The product page and the review-link page both use it;
 * each submits on its own.
 */

import React, { useRef, useState } from "react";
import { RiCloseLine } from "@remixicon/react";

import StarPicker from "./StarPicker";
import { useReviewPhotoUpload } from "@/hooks/useReviewPhotoUpload";
import {
  REVIEW_COMMENT_MAX_LENGTH,
  REVIEW_DISPLAY_NAME_MAX_LENGTH,
  REVIEW_MAX_PHOTOS,
  REVIEW_PHOTO_TYPES,
  REVIEW_TITLE_MAX_LENGTH,
  getReviewErrorMessage,
} from "@/utils/reviews";

// ─── Helpers ──────────────────────────────────────────────────────────────

export const EMPTY_REVIEW = { rating: 0, title: "", comment: "", displayName: "", photos: [] };

/** The form value for an existing review (edit). */
export function reviewToFields(review) {
  if (!review) return { ...EMPTY_REVIEW };
  return {
    rating: Number(review.rating) || 0,
    title: review.title || "",
    comment: review.comment || "",
    displayName: review.displayName || "",
    photos: (review.photos || []).map((photo) => ({ key: photo.key, url: photo.url })),
  };
}

/** `SubmitReviewInput` fields from the form value (productId added by the caller). */
export function fieldsToInput(value, { isEdit = false } = {}) {
  const photos = value.photos || [];
  return {
    rating: value.rating,
    title: value.title.trim() || null,
    comment: value.comment.trim() || null,
    ...(value.displayName.trim() ? { displayName: value.displayName.trim() } : {}),
    photoReceipts: photos.filter((photo) => photo.receipt).map((photo) => photo.receipt),
    ...(isEdit ? { keepPhotoKeys: photos.filter((photo) => photo.key).map((photo) => photo.key) } : {}),
  };
}

// ─── Component ────────────────────────────────────────────────────────────

const ReviewFields = ({
  value,
  onChange,
  errors = {},
  photosEnabled = false,
  linkToken = null,
  disabled = false,
  idPrefix = "review",
  onUploadingChange,
}) => {
  const fileRef = useRef(null);
  const { uploadPhoto } = useReviewPhotoUpload(linkToken);
  const [photoError, setPhotoError] = useState("");
  const [uploading, setUploading] = useState(0);
  const set = (patch) => onChange({ ...value, ...patch });

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    setPhotoError("");
    const room = REVIEW_MAX_PHOTOS - value.photos.length;
    if (files.length > room) setPhotoError(`Add up to ${REVIEW_MAX_PHOTOS} photos.`);
    let photos = value.photos;
    for (const file of files.slice(0, Math.max(0, room))) {
      setUploading((count) => count + 1);
      onUploadingChange?.(true);
      try {
        const uploaded = await uploadPhoto(file);
        photos = [...photos, uploaded];
        onChange({ ...value, photos });
      } catch (error) {
        setPhotoError(error?.errors ? getReviewErrorMessage(error) : error?.message || "That photo couldn't be added.");
      } finally {
        setUploading((count) => {
          const next = count - 1;
          if (next === 0) onUploadingChange?.(false);
          return next;
        });
      }
    }
  };

  const removePhoto = (index) => set({ photos: value.photos.filter((_, position) => position !== index) });

  return (
    <div className="review_fields">
      <StarPicker
        value={value.rating}
        onChange={(rating) => set({ rating })}
        error={errors.rating}
        disabled={disabled}
      />

      <label className="review_field text-sm" htmlFor={`${idPrefix}-title`}>
        Title (optional)
        <input
          id={`${idPrefix}-title`}
          className="checkOut_input text-base"
          maxLength={REVIEW_TITLE_MAX_LENGTH}
          value={value.title}
          onChange={(event) => set({ title: event.target.value })}
          disabled={disabled}
        />
        {errors.title && <span className="input_error_msg text-xs">{errors.title}</span>}
      </label>

      <label className="review_field text-sm" htmlFor={`${idPrefix}-comment`}>
        Your review (optional)
        <textarea
          id={`${idPrefix}-comment`}
          className="checkOut_input review_textarea text-base"
          rows={5}
          maxLength={REVIEW_COMMENT_MAX_LENGTH}
          value={value.comment}
          onChange={(event) => set({ comment: event.target.value })}
          disabled={disabled}
        />
        <span className="review_counter text-xs" aria-live="polite">
          {value.comment.length}/{REVIEW_COMMENT_MAX_LENGTH}
        </span>
        {errors.comment && <span className="input_error_msg text-xs">{errors.comment}</span>}
      </label>

      <label className="review_field text-sm" htmlFor={`${idPrefix}-name`}>
        Name shown with your review (optional)
        <input
          id={`${idPrefix}-name`}
          className="checkOut_input text-base"
          maxLength={REVIEW_DISPLAY_NAME_MAX_LENGTH}
          placeholder="Your first name and last initial"
          value={value.displayName}
          onChange={(event) => set({ displayName: event.target.value })}
          disabled={disabled}
        />
        {errors.displayName && <span className="input_error_msg text-xs">{errors.displayName}</span>}
      </label>

      {photosEnabled && (
        <div className="review_field text-sm">
          <span>Photos (optional, up to {REVIEW_MAX_PHOTOS})</span>
          <div className="review_photo_row">
            {value.photos.map((photo, index) => (
              <div key={photo.key || photo.url} className="review_photo_thumb">
                {/* Plain <img>: review photos come from the store's media host */}
                <img src={photo.url} alt={`Your photo ${index + 1}`} loading="lazy" />
                <button
                  type="button"
                  className="review_photo_remove"
                  aria-label={`Remove photo ${index + 1}`}
                  onClick={() => removePhoto(index)}
                  disabled={disabled}
                >
                  <RiCloseLine size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
            {value.photos.length < REVIEW_MAX_PHOTOS && (
              <button
                type="button"
                className="review_photo_add text-xs uppercase"
                onClick={() => fileRef.current?.click()}
                disabled={disabled || uploading > 0}
              >
                {uploading > 0 ? "Uploading…" : "Add photo"}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={REVIEW_PHOTO_TYPES.join(",")}
            multiple
            hidden
            onChange={handleFiles}
          />
          {(photoError || errors.photos) && (
            <span className="input_error_msg text-xs" role="alert">{photoError || errors.photos}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewFields;
