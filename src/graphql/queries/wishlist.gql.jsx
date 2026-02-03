import { gql } from "@apollo/client";

export const GET_WISHLIST_ITEMS = gql`
  query GetWishlistItems($limit: Int, $offset: Int, $filters: GetWishlistFilterInput, $userId: ID!) {
    getWishlistItems(limit: $limit, offset: $offset, filters: $filters, userId: $userId) {
      items {
        _id
        userId
        productId
        variantId
        addedAt
        product {
          _id
          name
          slug
          description
          assets {
            path
            type
            altText
            isFeatured
            isHover
          }
          price
          discountedPrice
        }
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`;

export const CHECK_IF_IN_WISHLIST = gql`
  query CheckIfInWishlist($productId: ID!, $variantId: ID, $userId: ID!) {
    checkIfInWishlist(productId: $productId, variantId: $variantId, userId: $userId)
  }
`;
