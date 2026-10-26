# PRD-015 — Post-purchase (pointer: rare-element)

| Field | Value |
|---|---|
| Status | **Approved** 2026-10-26 (mirrors the source of truth) · **Implemented** 2026-10-26 (FR-20, working tree, not browser-tested) |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-015-post-purchase.md`](../../../../zcom-backend/docs/prd/PRD-015-post-purchase.md) |
| Approved by / on | Anand (owner), 2026-10-26: "please review and approve the six drafted follow-up PRDs" (every recommendation accepted; backend §8.1 D1–D16) |
| Created / Updated | 2026-10-26 / 2026-10-26 |
| Related | PRD-014 pointer (payment retry, `pending-order`) · `zcom-backend/docs/architecture/storefront-api-contract.md` |

Requirements, decisions and the contract live in the source-of-truth PRD. This file lists only **this storefront's** share: FR-20 (and reading FR-12, FR-18, FR-19). It ships after the backend and the dashboard (rollout step 3), in the same release as the other storefront; the contract is additive, so it can trail.

## This storefront's share

- **Order detail page:** extend `/account/order/[id]` (today it renders only `shipmentStatus`). Status pill from `displayStatus` (text, not colour alone); a tracking card from `shipment { courier awb trackingUrl tracking }` ("Track shipment" opens `trackingUrl`; the last scans); stop selecting the deprecated `awb_code` / `courierName` / `trackInfo`.
- **Order list:** `/account` order list rows link to the detail page.
- **Cancel:** shown only when `canCancel`; a confirm dialog saying refunds go back to the original method within the store's timeline; `cancelMyOrder`; `ORDER_NOT_CANCELLABLE` → "This order can no longer be cancelled; contact the store", `PAYMENT_IN_PROGRESS` → "A payment is in progress; try again in a few minutes".
- **Returns:** "Request a return" when `returnableItems` is non-empty: per-line quantity stepper capped at `returnableQty` (with `aria-label`), reason select, condition, "return by <`returnableUntil`>" and a link to this store's own returns-policy page (approved legal copy, PRD-014 O8; the API carries no policy text); `createReturnRequest` with the line `id`s; then the order's `returnRequests` with status, and "Withdraw" on a `REQUESTED` one (`cancelMyReturnRequest`). `RETURN_WINDOW_CLOSED` → "The return window for this order closed on <date>"; other reasons mapped by `extensions.reason`, never message text.
- **Files likely touched:** `src/graphql/queries/order.gql.jsx`, `src/app/account/order/[id]/`.
- **States and checks:** loading, empty, error and success; the UX-31 a11y items; `node:test` for the cancel and return form state; `validate:clients` with variable shapes; this storefront's own styling.

## Implementation log

**2026-10-26: FR-20 DONE in code** (working tree, not committed, not browser-tested; the backend PRD-015 is built in its working tree, not deployed).

| Item | Status | Where |
|---|---|---|
| Order detail page | DONE | `src/app/account/order/[id]/order-detail-client.jsx`: status from `displayStatus` (text pill; falls back to the payment label for an older API), cancel reason and delivered date; loading, error (with "Try again") and not-found states |
| Tracking card | DONE | `src/components/account/orders/OrderTracking.jsx`: courier, AWB, "Track shipment" (only an https `trackingUrl`, new tab, announced), the latest five scans newest first; hidden before an AWB. `MY_ORDER` no longer selects `awb_code` / `courierName` (and never `trackInfo`) |
| Order list | DONE | `src/components/account/orders/OrderList.jsx`: rows already linked to the page; the status line now uses `displayStatus` (`MY_ORDERS` selects it) |
| Cancel | DONE | `src/components/account/orders/OrderCancel.jsx`: only when `canCancel`; inline `role="alertdialog"` confirmation (refund to the original method within the store's timeline), optional reason (≤ 500), `cancelMyOrder`, then the order is re-read |
| Returns | DONE | `src/components/account/orders/OrderReturns.jsx`: "Request a return" only while `returnableItems` is non-empty; per-line stepper (labelled buttons) capped at `returnableQty`, one reason and condition per request, "Return by <`returnableUntil`>", link to `/shipping-returns`; `createReturnRequest` with the line ids; the `returnRequests` list (status, items, refund) with "Withdraw request" on REQUESTED (`cancelMyReturnRequest`) |
| Error reasons | DONE | `src/utils/errors.js`: `ORDER_NOT_CANCELLABLE`, `PAYMENT_IN_PROGRESS`, `ORDER_NOT_DELIVERED`, `RETURN_WINDOW_CLOSED` (with the date via `getReturnErrorOverrides`), `RETURNS_DISABLED`, `ORDER_NOT_RETURNABLE`, `INVALID_ORDER_ITEM`, `INVALID_QUANTITY`, `RETURN_QUANTITY_EXCEEDED`, `INVALID_TRANSITION`, `RETURN_CHANGED` |
| Helpers + tests | DONE | `src/utils/order-detail.js` (twin of deveshe `utils/order-detail.util.js`); `test/order-detail.test.mjs` (status labels, https-only tracking, scans, cancel reason, return form state and input, reason mapping) |
| Contract | DONE | `src/graphql/mutations/order.mutation.jsx` (`CancelMyOrder`, `CreateReturnRequest`, `CancelMyReturnRequest`); `validate:clients` 44/44 |

Reason and condition values are storefront copy (`RETURN_REASONS`, `RETURN_CONDITIONS`; the API stores free strings). Open: UAT in a browser (both storefronts), the store's approved returns-policy copy on `/shipping-returns` (PRD-014 O8; today it still contradicts the cart drawer's "easy returns"), Playwright paths when FR-2.10 lands.
