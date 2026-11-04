"use client";

/**
 * Review photo upload (PRD-032 FR-P1, FR-P2)
 *
 * One photo in three steps: media `requestReviewPhotoUpload` (a capped
 * presigned POST, 15 minutes), the browser POSTs the file straight to S3
 * (the one allowed non-gateway call: the presigned upload), then media
 * `confirmReviewPhoto` checks and cleans it and returns a signed
 * `receipt` plus the public `url`. The receipt is what `submitReview`
 * takes. `linkToken` is a review-email link, for buyers not logged in.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/hooks/useReviewPhotoUpload.jsx`.
 */

import { useCallback } from "react";
import { useMutation } from "@apollo/client/react";

import { CONFIRM_REVIEW_PHOTO, REQUEST_REVIEW_PHOTO_UPLOAD } from "@/graphql";
import { buildPresignedPostForm, validateReviewPhoto } from "@/utils/reviews";

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useReviewPhotoUpload(linkToken = null) {
  const [requestUpload] = useMutation(REQUEST_REVIEW_PHOTO_UPLOAD);
  const [confirmPhoto] = useMutation(CONFIRM_REVIEW_PHOTO);

  /** `{ receipt, url }` for `file`; throws with a shopper message. */
  const uploadPhoto = useCallback(
    async (file) => {
      const invalid = validateReviewPhoto(file);
      if (invalid) throw new Error(invalid);
      const { data } = await requestUpload({
        variables: {
          input: {
            contentType: file.type,
            fileSize: file.size,
            ...(linkToken ? { linkToken } : {}),
          },
        },
      });
      const ticket = data?.requestReviewPhotoUpload;
      if (!ticket?.presignedPost?.url) throw new Error("The photo couldn't be uploaded.");
      const response = await fetch(ticket.presignedPost.url, {
        method: "POST",
        body: buildPresignedPostForm(ticket.presignedPost.fields, file),
      });
      if (!response.ok) throw new Error("The photo couldn't be uploaded. Please try again.");
      const confirmed = await confirmPhoto({
        variables: { uploadId: ticket.uploadId, linkToken: linkToken || null },
      });
      const receipt = confirmed?.data?.confirmReviewPhoto;
      if (!receipt?.receipt) throw new Error("The photo couldn't be uploaded.");
      return { receipt: receipt.receipt, url: receipt.url };
    },
    [confirmPhoto, linkToken, requestUpload],
  );

  return { uploadPhoto };
}
