import { gql } from "@apollo/client";

// PRD-014 FR-2.8: approved reviews of one product for the product page.
// Shoppers only ever receive APPROVED reviews (the server forces the
// status) and `user` is never selected (the server hides the reviewer).
// Keep in sync with `storefronts/deveshe-dreams/src/graphql/queries/review.gql.jsx`.
export const GET_PRODUCT_REVIEWS = gql`
  query GetProductReviews($limit: Int, $offset: Int, $filter: ReviewFilterInput) {
    getReviews(limit: $limit, offset: $offset, filter: $filter) {
      data {
        _id
        rating
        comment
        createdAt
      }
      totalCount
    }
  }
`;
