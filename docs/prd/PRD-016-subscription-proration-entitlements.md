# PRD-016 — Subscription proration, entitlements and dunning (pointer: rare-element)

| Field | Value |
|---|---|
| Status | **Approved** 2026-10-26 (mirrors the source of truth) · not started |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-016-subscription-proration-entitlements.md`](../../../../zcom-backend/docs/prd/PRD-016-subscription-proration-entitlements.md) |
| Approved by / on | Anand (owner), 2026-10-26: "please review and approve the six drafted follow-up PRDs" (every recommendation accepted; backend §8.1 D1–D18) |
| Created / Updated | 2026-10-26 / 2026-10-26 |
| Related | PRD-018 (a suspended store's 503 page is PRD-018 FR-1.6, not this PRD) · `zcom-backend/docs/architecture/storefront-api-contract.md` |

Requirements, decisions and the contract live in the source-of-truth PRD. This storefront's only share is **FR-25**; nothing else in the shopper flow changes. It ships after the backend (rollout step 4) and only matters once `dunning.enabled` is switched on (gated, backend §8.1 D6).

## This storefront's share

- At checkout (`createCheckoutSession` / `completeCheckout`), `FORBIDDEN` with `extensions.reason: STORE_ORDERS_PAUSED` shows "This store isn't taking orders right now" instead of the generic error, branched on the reason (never the message). Browsing, cart and account pages are unchanged.
- A `node:test` case for the error mapping; `validate:clients` unchanged (no new operation).

## Implementation log

Not started.
