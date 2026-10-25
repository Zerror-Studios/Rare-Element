import { gql } from "@apollo/client";

// Polled after createCheckoutSessionFromCart until the stock hold settles:
// PENDING → RESERVED (ready) or FAILED (failureReason, e.g. OUT_OF_STOCK).
export const GET_CHECKOUT_SESSION = gql`
  query GetCheckoutSession($id: ID!) {
    getCheckoutSession(id: $id) {
      id
      status
      failureReason
      orderId
      expiresAt
      currency
      pricing {
        subtotal
        discount
        tax
        shipping
        total
        pricesIncludeTax
        isFreeShipping
      }
    }
  }
`;
