import { gql } from "@apollo/client";

// PRD-032: shopper reviews. Shoppers only ever receive APPROVED reviews
// from `getReviews` (the server forces the status) and never the reviewer
// (`user`), the order or moderation fields. `myReviews` returns the
// caller's own reviews in every status.
// Keep in sync with `storefronts/deveshe-dreams/src/graphql/queries/review.gql.jsx`.

// PRD-014 FR-2.8, PRD-032 FR-D1: approved reviews of one product.
export const GET_PRODUCT_REVIEWS = gql`
  query GetProductReviews(
    $limit: Int
    $offset: Int
    $filter: ReviewFilterInput
    $sort: ReviewSort
  ) {
    getReviews(limit: $limit, offset: $offset, filter: $filter, sort: $sort) {
      data {
        _id
        productId
        rating
        title
        comment
        displayName
        verifiedPurchase
        variantLabel
        createdAt
        photos {
          key
          url
          width
          height
        }
        storeReply {
          message
          createdAt
        }
      }
      totalCount
    }
  }
`;

// PRD-032 FR-A8 / FR-D4: the caller's reviews, any status.
export const GET_MY_REVIEWS = gql`
  query GetMyReviews($limit: Int, $offset: Int) {
    myReviews(limit: $limit, offset: $offset) {
      data {
        _id
        productId
        rating
        title
        comment
        displayName
        verifiedPurchase
        variantLabel
        createdAt
        photos {
          key
          url
          width
          height
        }
        storeReply {
          message
          createdAt
        }
        status
        rejectionReason
        product {
          _id
          name
          slug
        }
      }
      totalCount
    }
  }
`;

// PRD-032 FR-A8: delivered products not reviewed yet.
export const GET_MY_REVIEWABLE_PRODUCTS = gql`
  query GetMyReviewableProducts($limit: Int, $offset: Int) {
    myReviewableProducts(limit: $limit, offset: $offset) {
      items {
        productId
        orderId
        name
        imageUrl
        deliveredAt
        product {
          _id
          slug
        }
      }
      totalCount
    }
  }
`;

// PRD-032 FR-R3: the products a review-email link may review.
export const GET_REVIEW_LINK_ORDER = gql`
  query GetReviewLinkOrder($token: String!) {
    reviewLinkOrder(token: $token) {
      orderNo
      displayName
      photosEnabled
      items {
        productId
        name
        imageUrl
        review {
          _id
          productId
          rating
          title
          comment
          displayName
          verifiedPurchase
          variantLabel
          createdAt
          photos {
            key
            url
            width
            height
          }
          storeReply {
            message
            createdAt
          }
          status
        }
      }
    }
  }
`;

// PRD-032 FR-D1: whether the form shows, and with photos.
export const GET_STOREFRONT_REVIEW_SETTINGS = gql`
  query GetStorefrontReviewSettings {
    storefrontReviewSettings {
      enabled
      eligibility
      photosEnabled
    }
  }
`;

// PRD-032 FR-C2: the product's rating summary, in its own read so the
// catalog query never depends on the commerce subgraph (a failure here
// only hides the summary). APPROVED reviews only; null with none.
export const GET_PRODUCT_REVIEW_SUMMARY = gql`
  query GetProductReviewSummary($id: ID) {
    getClientSideProductById(id: $id) {
      _id
      reviewSummary {
        averageRating
        reviewCount
        distribution
        withPhotosCount
      }
    }
  }
`;
