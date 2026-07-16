import { gql } from "@apollo/client";

export const CHECKOUT_ORDER = gql`
  mutation ClientCheckout($input: CheckoutOrderInput!) {
    clientCheckout(input: $input) {
      data {
        _id
        nimbblInvoiceId
        nimbblOrderId
        fulfillmentStatus
        paymentStatus
        orderNo
        nimbblTransactionId
        nimbblUserId
      }
      nimbblData {
        invoice_id
        token
        token_expiration
        tax
        status
        refresh_token_expiration
        refresh_token
        order_id
        order_date
        next {
          url
          action
        }
        currency
        attempts
        amount_before_tax
        total_amount
        user {
          user_id
          mobile_number
          country_code
          email
          first_name
          last_name
          token
          token_expiration
        }
      }
    }
  }
`;

export const VERIFY_NIMBBL_PAYMENT = gql`
  mutation VerifyNimbblPayment($payload: JSON!) {
    verifyNimbblPayment(payload: $payload) {
      success
      redirectUrl
      awbCode
    }
  }
`;
