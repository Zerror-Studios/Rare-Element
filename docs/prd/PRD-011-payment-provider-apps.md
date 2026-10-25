# PRD-011 — Razorpay, Cashfree and PayU as payment apps (pointer)

| Field | Value |
|---|---|
| Status | **Implemented** 2026-10-21 (this repo's part, FR-4.x); not deployed or browser-tested |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-011-payment-provider-apps.md`](../../../../zcom-backend/docs/prd/PRD-011-payment-provider-apps.md) |
| Approved by / on | Anand (owner), 2026-10-21, all recommendations |

This file holds only this storefront's UX and implementation notes. Requirements, decisions (Q1–Q8) and the contract live in the backend PRD and in `zcom-backend/docs/architecture/storefront-api-contract.md`.

## UX

- One "Pay Now" step for every payment app. `createPaymentSession` answers with `provider` and a `checkout`; the storefront opens it:
  - **SDK**: Razorpay Checkout.js or the Cashfree JS SDK load on demand from `checkout.scriptUrl`; Nimbbl uses the existing `nimbbl_sonic` package, imported only when a Nimbbl checkout opens. Nimbbl results are read on `globalHandleCheckoutResponse` or `globalCloseCheckoutModal` (as before).
  - **REDIRECT**: the browser goes to `checkout.redirectUrl`.
  - **FORM_POST** (PayU): a hidden form posts `checkout.formFields` to `checkout.formAction`.
- The provider's response goes to `verifyPayment` with our `paymentId`; the backend checks a signed response and always confirms the status with the provider. Closing the window keeps the unpaid order for a retry (as before).
- PayU (and Cashfree redirects) come back to `/api/payments/return`, which answers 303 to `/checkout/payment-return?ref=…` (a cross-site POST has no session cookie, so nothing is verified on the POST). That page calls `verifyPayment({ providerOrderId })` and goes to thank-you (PAID or pending) or payment-failed.
- New error reasons mapped: `PAYMENT_PROVIDER_NOT_CONFIGURED`, `INVALID_PAYMENT_SIGNATURE`, `PROVIDER_ORDER_MISMATCH`.

## Implementation

- Files: `src/utils/payment-checkout.js` (new), `src/app/checkout/[id]/checkout-client.jsx`, `src/graphql/mutations/checkout.mutation.jsx`, `src/app/api/payments/return/route.js` (new), `src/app/checkout/payment-return/` (new: `page.jsx`, `payment-return-client.jsx`, `loading.jsx`), `src/utils/errors.js`, `next.config.mjs` (CSP).
- The checkout helper carries a "Keep in sync" header with deveshe-dreams `src/utils/payment-checkout.util.js`.
- CSP (`next.config.mjs`): one set of payment-host constants adds `checkout.razorpay.com` and `sdk.cashfree.com` (script), `api.razorpay.com`, `checkout.razorpay.com`, `*.cashfree.com` (frame), `api.razorpay.com`, `lumberjack.razorpay.com`, `*.cashfree.com` (connect), `*.razorpay.com`, `*.cashfree.com` (img) and `test.payu.in`, `secure.payu.in`, `api.razorpay.com`, `*.cashfree.com` (form-action). Roll out with `CSP_REPORT_ONLY=true` first.
- The session no longer selects the deprecated `token` / `redirectUrl` (the backend removes them one release after both storefronts ship, Q8). Deploy the backend first.
- No dependency was added or removed.

## Implementation log

| Date | Entry |
|---|---|
| 2026-10-21 | Implemented the payment step, return route and page, CSP hosts and error reasons. Production build passes; contract validation 0 invalid. Not run in a browser or against any provider sandbox. |
