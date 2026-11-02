import { gql } from "@apollo/client";

// PRD-028 FR-5.1: the `/pay/<token>` page (public; the token is the
// credential). Null for an unknown link; a link that can't be paid has
// only its status. No address, email or phone is returned.
export const GET_PAYMENT_REQUEST = gql`
  query GetPaymentRequest($token: String!) {
    getPaymentRequest(token: $token) {
      status
      storeName
      orderNo
      lines {
        name
        variant
        quantity
        lineTotal
      }
      moreLines
      amount
      currency
      customerNote
      expiresAt
    }
  }
`;
