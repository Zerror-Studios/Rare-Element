import { gql } from "@apollo/client";

// PRD-028 FR-5.1: open the payment for a link on the store's payment app;
// the same provider-neutral `checkout` the checkout page opens.
export const PAY_PAYMENT_REQUEST = gql`
  mutation PayPaymentRequest($token: String!) {
    payPaymentRequest(token: $token) {
      paymentId
      orderId
      amount
      currency
      provider
      checkout {
        provider
        mode
        environment
        scriptUrl
        sdk
        redirectUrl
        formAction
        formFields
      }
    }
  }
`;

// PRD-028 FR-5.1: the provider's answer for a link's payment, checked with
// the provider server to server (public: the token is the credential; the
// payment must belong to the link's order). Same payload as verifyPayment.
export const VERIFY_PAYMENT_REQUEST_PAYMENT = gql`
  mutation VerifyPaymentRequestPayment($token: String!, $payload: JSON!) {
    verifyPaymentRequestPayment(token: $token, payload: $payload) {
      success
      status
      orderId
      paymentId
    }
  }
`;
