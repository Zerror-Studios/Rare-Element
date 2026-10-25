import { gql } from "@apollo/client";

// The wishlist is keyed by product; product details come from the catalog.
export const GET_WISHLIST = gql`
  query GetWishlist {
    getWishlist {
      _id
      productId
      variantId
      addedAt
    }
  }
`;
