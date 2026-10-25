# PRD-012 — Analytics as an app: GA4 sync (pointer)

| Field | Value |
|---|---|
| Status | **Implemented** 2026-10-22 (this repo's part); not browser-tested |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-012-analytics-app-ga4-sync.md`](../../../../zcom-backend/docs/prd/PRD-012-analytics-app-ga4-sync.md) |
| Approved by / on | Anand (owner), 2026-10-22, full scope |

This storefront's only part of PRD-012 is **order attribution** (§15 ✅ server-side purchase events, FR-7.1 Campaigns):

- `src/utils/ga-attribution.js` captures the visit's UTM parameters, referrer and landing page once per browser session (`sessionStorage`) in `app/providers.jsx`, and reads the GA client id (`_ga` cookie) and session id (`_ga_*` cookie) at checkout.
- `createCheckoutSessionFromCart` sends them as `attribution: OrderAttributionInput`; the backend stores them on the order. Nothing here affects money; the server only records it.
- The GA tags themselves still come from `NEXT_PUBLIC_GA_MEASUREMENT_ID` (Q12).

## Implementation log

| Date | Entry |
|---|---|
| 2026-10-22 | Helper, bootstrap capture and mutation variable added. Production build passes; contract validation 0 invalid. |
