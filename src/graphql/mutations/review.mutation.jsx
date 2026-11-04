import { gql } from "@apollo/client";

// PRD-032: shopper review writes, reports, the review-request opt-out and
// the two-step photo upload (media: ticket, then confirm → receipt).
// Keep in sync with `storefronts/deveshe-dreams/src/graphql/mutations/review.mutation.jsx`.

export const SUBMIT_REVIEW = gql`
  mutation SubmitReview($input: SubmitReviewInput!) {
    submitReview(input: $input) {
      _id
      productId
      rating
      title
      comment
      displayName
      status
      photos {
        key
        url
      }
    }
  }
`;

export const SUBMIT_REVIEWS_WITH_LINK = gql`
  mutation SubmitReviewsWithLink($token: String!, $items: [SubmitReviewInput!]!) {
    submitReviewsWithLink(token: $token, items: $items) {
      _id
      productId
      status
    }
  }
`;

export const DELETE_MY_REVIEW = gql`
  mutation DeleteMyReview($productId: ID!) {
    deleteMyReview(productId: $productId)
  }
`;

export const REPORT_REVIEW = gql`
  mutation ReportReview($id: ID!, $reason: String!) {
    reportReview(id: $id, reason: $reason)
  }
`;

export const UNSUBSCRIBE_REVIEW_REQUESTS = gql`
  mutation UnsubscribeReviewRequests($email: String!, $token: String!) {
    unsubscribeReviewRequests(email: $email, token: $token)
  }
`;

export const REQUEST_REVIEW_PHOTO_UPLOAD = gql`
  mutation RequestReviewPhotoUpload($input: ReviewPhotoUploadInput!) {
    requestReviewPhotoUpload(input: $input) {
      uploadId
      maxSize
      presignedPost {
        url
        fields {
          name
          value
        }
      }
    }
  }
`;

export const CONFIRM_REVIEW_PHOTO = gql`
  mutation ConfirmReviewPhoto($uploadId: ID!, $linkToken: String) {
    confirmReviewPhoto(uploadId: $uploadId, linkToken: $linkToken) {
      receipt
      url
      width
      height
    }
  }
`;
