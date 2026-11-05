import { gql } from "@apollo/client";

// 1. Price the cart and request the stock hold (customer only).
export const CREATE_CHECKOUT_SESSION = gql`
  mutation CreateCheckoutSessionFromCart(
    $cartId: ID!
    $shippingAddress: OrderAddressInput
    $billingAddress: OrderAddressInput
    $promotionCode: String
    $attribution: OrderAttributionInput
    $consent: CheckoutConsentInput
  ) {
    createCheckoutSessionFromCart(
      cartId: $cartId
      shippingAddress: $shippingAddress
      billingAddress: $billingAddress
      promotionCode: $promotionCode
      attribution: $attribution
      consent: $consent
    ) {
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

// 2. RESERVED → create the UN_PAID order (idempotent per session); a ₹0
//    total is placed PAID at once (PRD-014 COM-08), see `pricing.total`.
export const COMPLETE_CHECKOUT = gql`
  mutation CompleteCheckout($checkoutId: ID!) {
    completeCheckout(checkoutId: $checkoutId) {
      id
      status
      failureReason
      orderId
      pricing {
        total
      }
    }
  }
`;

// 3. Payment session for the order on the store's active payment app
//    (amount is the server total). `checkout` says how to open it (PRD-011).
export const CREATE_PAYMENT_SESSION = gql`
  mutation CreatePaymentSession($input: CreatePaymentSessionInput!) {
    createPaymentSession(input: $input) {
      paymentId
      orderId
      providerOrderId
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

// 4. Server-to-server verification of the provider's response.
export const VERIFY_PAYMENT = gql`
  mutation VerifyPayment($payload: JSON!) {
    verifyPayment(payload: $payload) {
      success
      status
      orderId
      paymentId
      redirectUrl
    }
  }
`;
