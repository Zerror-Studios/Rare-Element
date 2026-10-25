import { gql } from "@apollo/client";

// ADD ITEM TO CART (IDs only; the server prices the line)
export const ADD_ITEM_TO_CART = gql`
  mutation AddItemToCart($input: CreateCartInput!, $guestId: String) {
    addItemToCart(input: $input, guestId: $guestId)
  }
`;

// REMOVE ITEM FORM CART
export const REMOVE_ITEM_FROM_CART = gql`
  mutation RemoveItemFromCart($input: RemoveItemFromCartInput!) {
    removeItemFromCart(input: $input)
  }
`;

// APPLY PROMOTION
export const APPLY_CART_PROMOTION = gql`
  mutation ApplyCartPromotion($promotionCode: String!, $guestId: String) {
    applyCartPromotion(promotionCode: $promotionCode, guestId: $guestId) {
      _id
      itemcount
      totalprice
      discountedPrice
      totalDiscount
      totalTax
      promotion {
        promotionId
        promotionName
        promotionCode
        discount
      }
    }
  }
`;

// REMOVE PROMOTION
export const REMOVE_CART_PROMOTION = gql`
  mutation RemoveCartPromotion($guestId: String) {
    removeCartPromotion(guestId: $guestId)
  }
`;

// GUEST CART ID (PRD-002 R2-C2): a server-signed id for anonymous carts
export const ISSUE_GUEST_CART_ID = gql`
  mutation IssueGuestCartId {
    issueGuestCartId
  }
`;

// MERGE GUEST CART (PRD-002 R2-C3): customer-only, idempotent; the server
// re-prices the moved lines and deletes the guest cart
export const MERGE_GUEST_CART = gql`
  mutation MergeGuestCart($guestId: String!) {
    mergeGuestCart(guestId: $guestId) {
      _id
      itemcount
    }
  }
`;
