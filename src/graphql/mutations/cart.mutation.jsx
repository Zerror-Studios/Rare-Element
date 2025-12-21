import { gql } from "@apollo/client";

// ADD ITEM TO CART
export const ADD_ITEM_TO_CART = gql`
  mutation AddItemToCart($input: CreateCartInput, $guestId: String) {
    addItemToCart(input: $input, guestId: $guestId)
  }
`;

// REMOVE ITEM FORM CART
export const REMOVE_ITEM_FROM_CART = gql`
  mutation RemoveItemFromCart($input: RemoveItemFromCartInput!) {
    removeItemFromCart(input: $input)
  }
`;

// APPLY COUPON
export const APPLY_CART_COUPON = gql`
  mutation ApplyCartCoupon(
    $couponCode: String!
    $token: String
    $guestId: String
  ) {
    applyCartCoupon(couponCode: $couponCode, token: $token, guestId: $guestId) {
      _id
      userId
      guestId
      itemcount
      totalprice
      discountedPrice
      totalDiscount
      isFreeShippingEnabled
      createdAt
      updatedAt
    }
  }
`;

// REMOVE COUPON
export const REMOVE_CART_COUPON = gql`
  mutation RemoveCartCoupon($token: String, $guestId: String) {
    removeCartCoupon(token: $token, guestId: $guestId)
  }
`;
