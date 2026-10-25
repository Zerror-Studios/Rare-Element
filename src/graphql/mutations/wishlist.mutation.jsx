import { gql } from "@apollo/client";

// Adds the product when absent, removes it when present.
export const TOGGLE_WISHLIST = gql`
  mutation ToggleWishlist($productId: ID!, $variantId: ID) {
    toggleWishlist(productId: $productId, variantId: $variantId) {
      added
    }
  }
`;
