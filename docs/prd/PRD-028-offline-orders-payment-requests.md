# PRD-028 — Offline orders, payment requests and offline payments (pointer)

| Field | Value |
|---|---|
| Status | **Implemented** 2026-11-02 (this repo's FR-10); not browser-tested or run against a live gateway or payment sandbox |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-028-offline-orders-payment-requests.md`](../../../../zcom-backend/docs/prd/PRD-028-offline-orders-payment-requests.md) |
| Approved by / on | Anand (owner), 2026-11-02, recommended answers (§8.1 D1–D10; D2: the payment page is the storefront's `/pay/<token>`) |

This storefront's part is **FR-10: the payment page** for links a store sends for orders taken offline.

- `/pay/<token>` reads `getPaymentRequest(token)` on the server (with the shopper's IP: the backend limits reads per IP) and shows the store name, order number, items, amount due, the store's note and the expiry, with one "Pay ₹X" button.
- "Pay" calls `payPaymentRequest(token)` and opens the returned provider-neutral `checkout` with the existing payment helper (SDK, redirect or form post).
- The shopper is usually a guest and can't call `verifyPayment`, so the payment app's answer goes to `verifyPaymentRequestPayment(token, payload)` (same payload, checked with the provider server to server): PAID shows "Already paid, thank you", FAILED lets the shopper pay again, anything else falls back to polling `getPaymentRequest` (every 3 s, up to 60 s, then "Check again") until the backend reads PAID. A redirect app returns through `/api/payments/return` → `/checkout/payment-return`, which finds the link's token in `sessionStorage` (kept for at most 2 hours while the shopper is away), calls `verifyPaymentRequestPayment(token, { providerOrderId: ref })` and goes back to `/pay/<token>` (`?confirm=1` unless the attempt FAILED).
- States (by `extensions.code` / `reason` only): ready, confirming, payment failed (pay again), paid ("Already paid, thank you"), expired, no longer valid (cancelled or superseded), not found, out of date, payment under review, too many attempts, error.
- Rules: `noindex, nofollow`, `/pay/` disallowed in robots, `no-referrer`, never cached, no login, no cart changes, no analytics events; both operations are sent anonymously.

## Implementation log

| Date | Entry |
|---|---|
| 2026-11-02 | FR-10 built: `src/app/pay/[token]/page.jsx` (server read with the shopper's IP, `force-dynamic`, noindex, `no-referrer`), `src/app/pay/[token]/pay-client.jsx`, `src/utils/payment-request.js` (state mapping, amounts, the return token), `src/graphql/queries/payment-request.gql.jsx`, `src/graphql/mutations/payment-request.mutation.jsx`, `src/styles/pages/pay.css`; `src/app/checkout/payment-return/payment-return-client.jsx` sends a pay-link shopper back to `/pay/<token>?confirm=1`; `src/middleware.js` lets `/checkout/payment-return` through without a session; `src/app/robots.js` disallows `/pay/`; `test/payment-request.test.mjs` (8). `npm test` 83/83 (was 75); `validate:clients` 47/47. Twin: deveshe-dreams `src/pages/pay/[token].jsx`, `src/utils/payment-request.util.js`. Not run in a browser. |
| 2026-11-02 | `verifyPaymentRequestPayment` (the coordinator's token-scoped public verify) wired after the SDK checkout and on the payment-return page, polling kept as the fallback; new FAILED state; helper `viewFromVerification` / `returnVerifyPayload` (+2 tests). `npm test` 85/85; `validate:clients` 48/48. |
