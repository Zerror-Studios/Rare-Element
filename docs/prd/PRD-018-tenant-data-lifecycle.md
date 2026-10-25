# PRD-018 — Tenant data lifecycle (pointer: rare-element)

| Field | Value |
|---|---|
| Status | **Approved** 2026-10-26 (mirrors the source of truth; owner: "please review and approve the six drafted follow-up PRDs", every recommendation accepted, D1–D19; the legal assumptions L1–L12 and D2, D4, D11, D14, D16, D18, D19 gated on the owner's lawyer, CA for L2). Not started |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-018-tenant-data-lifecycle.md`](../../../../zcom-backend/docs/prd/PRD-018-tenant-data-lifecycle.md) |
| Approved by / on | Workspace owner / 2026-10-26 (backend PRD §8.1) |
| Created / Updated | 2026-10-26 / 2026-10-26 |

Requirements, decisions and the contract live in the source-of-truth PRD. This file holds only **this repo's** UX and implementation notes (backend §6 "Storefronts", FR-1.6, FR-3.6, FR-4.3).

## This repo's work

| Backend FR | Change | Notes |
|---|---|---|
| FR-1.6 (D6) | **Store unavailable page** | When the API answers `TENANT_NOT_FOUND` with `extensions.reason: TENANT_SUSPENDED`, the middleware (`middleware.js`) or a route-level error boundary renders the page: branded, no catalog data, HTTP 503 with `Retry-After`, the store's contact email if configured. Other `TENANT_NOT_FOUND` cases keep today's behaviour. `node:test` case for the mapping |
| FR-3.6 (D3) | **Account › Privacy** | Gated phase D (lawyer), after the dashboard tool ships. "Download my data" (`requestMyDataExport`) and "Delete my account" (`requestMyAccountDeletion` with a typed confirmation), a warning about open orders (`CONFLICT` / `OPEN_ORDERS`, and the return-window warning), the 7-day cancel window with "Cancel request" (`cancelMyDataRequest`) and the request status. Signed-in shopper only; no email field (a request for another person is impossible) |
| FR-4.3 (D13) | **`/.well-known/zcom-store`** | Returns the store slug with an HMAC under `EDGE_SHARED_SECRET` (server-side only; the secret never reaches the browser). App Router: `src/app/account/settings/` (account page) and a new `src/app/.well-known/zcom-store/route.js` |

## Implementation notes

- All calls go through the existing same-origin proxy and the one API client; no new dependency.
- Dialogs trap focus; the status is announced.
- Legal pages (`/privacy-policy`, `/terms-of-service`, `/shipping-returns`) must answer 200 for the go-live checklist; the backend checklist defaults to exactly these paths (fixed in the review on approval).
- Every storefront change is mirrored in the other storefront (root `CLAUDE.md` §5.5).

## Implementation log

- 2026-10-26 · Pointer created on approval. Not started.
