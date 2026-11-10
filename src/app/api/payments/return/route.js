/**
 * Provider return (PRD-011 FR-4.3) — the kit's `paymentReturnHandler`
 * (PRD-002 FR-4.1). PayU form-posts here and Cashfree redirects here; the
 * handler keeps only the provider order id (`ref`), the provider name and
 * PayU's echoed order id (`order`, from `udf1`), checks each, caps the body
 * at 64 KB, and answers 303 to `/checkout/payment-return`.
 */

export {
  paymentReturnHandler as GET,
  paymentReturnHandler as POST,
} from "@zcom/storefront-kit/server";
