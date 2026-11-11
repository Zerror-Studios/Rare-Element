/**
 * Opens a payment session's checkout with the kit's launcher (PRD-002
 * FR-4.1): Razorpay / Cashfree SDK windows, a REDIRECT or a FORM_POST, each
 * only to the known payment hosts, with a 20 s script timeout. Nimbbl (until
 * 2026-11-15, backend PRD-029 D1) opens through the `nimbbl_sonic` registered
 * in `app/providers.jsx`.
 *
 * `onResult(payload)` gets what the provider returned plus our `paymentId`,
 * ready for `verifyPayment`; `onDismiss()` runs when the shopper closes the
 * window. A launch that can't open throws, with the kit's reason as the
 * message (`PAYMENT_HOST_NOT_ALLOWED`, `PAYMENT_SDK_UNAVAILABLE`, …).
 */

import { launchPayment } from "@zcom/storefront-kit/client";

export async function openPaymentCheckout(session, { onResult, onDismiss } = {}) {
  const checkout = session?.checkout;
  if (!checkout) throw new Error("No payment checkout");
  const result = await launchPayment(checkout, {
    paymentId: session.paymentId,
    providerOrderId: session.providerOrderId,
  });
  if (result.status === "success") return await onResult?.(result.payload);
  if (result.status === "dismissed") return onDismiss?.();
  if (result.status === "failed") throw new Error(result.reason);
  // "redirecting": the browser is leaving for the payment page
  return undefined;
}
