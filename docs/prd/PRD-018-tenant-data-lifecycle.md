# PRD-018 — Tenant data lifecycle (pointer: rare-element)

| Field | Value |
|---|---|
| Status | **Approved** 2026-10-26 (mirrors the source of truth; owner: "please review and approve the six drafted follow-up PRDs", every recommendation accepted, D1–D19; the legal assumptions L1–L12 and D2, D4, D11, D14, D16, D18, D19 gated on the owner's lawyer, CA for L2). **In progress** 2026-10-26: FR-1.6 and FR-4.3 implemented (working tree, not deployed); FR-3.6 gated |
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
- 2026-10-26 · **FR-1.6 DONE** (not browser-tested, not run against a live gateway). Built in the middleware in both twins, because only the middleware can answer a real 503 for every route: `src/middleware.js` now runs on every page (matcher: `/v1/graphql`, `/.well-known/zcom-store`, every path without `_next/`, `api/` or a dot) and, for GET/HEAD page requests, asks `src/lib/store-status.js` (`createStoreStatusCache` around `probeStoreStatus`): one anonymous edge-signed `StoreStatusProbe` (`getClientSideCategories(limit: 1) { totalCount }`, validated against the supergraph, 2 s timeout), cached 30 s per server instance (5 s after a failure), single-flight. While it answers `TENANT_NOT_FOUND` + `TENANT_SUSPENDED` the page is `storeUnavailableResponse`: HTTP 503, `Retry-After: 600`, `Cache-Control: no-store`, `X-Robots-Tag` and meta `noindex, nofollow`, no catalog data and no scripts, branded (Nahara, white), contact `SUPPORT_EMAIL` (`utils/env.js`). A failed probe or any other answer serves the page as before (fail open; DELETED and unknown stores keep the plain `TENANT_NOT_FOUND` handling). The `/v1/graphql` proxy is never held. A browser API call that meets the reason later (suspended while the page was open) reloads the page at most once a minute per tab (`claimSuspendedReload` in `src/lib/apollo-wrapper.js`), so the shopper lands on the 503. Deviation from the row above: no error-boundary / page-level path (it can't set the status for every route).
- 2026-10-26 · **FR-4.3 DONE.** `GET /.well-known/zcom-store` is answered by the middleware (`src/lib/store-identity.js`, Web Crypto HMAC-SHA256, Edge-runtime safe): `{ slug, signature }` with `signature` = hex HMAC of the slug keyed with `EDGE_SHARED_SECRET`, `no-store`, `noindex`; 503 `STORE_IDENTITY_NOT_CONFIGURED` without the slug or the secret. **The slug comes from the new server-only env `ZCOM_STORE_SLUG`** (the store's `db_configs.slug`): the storefront knows only its domain and the API exposes no slug to shoppers, so it is configured (the owner sets it in hosting with the edge secret; `.env.example`, README). Deviation from the row above: no route file (the middleware serves it in both twins; the Pages Router can't route a dot-folder).
- 2026-10-26 · Tests (`node:test`): `test/store-status.test.mjs` (6: reason mapping, probe answers, cache TTLs, reload guard, 503 headers, escaping) and 7 new `test/middleware.test.mjs` cases (503 page with headers and the edge-signed probe, account pages held but never the proxy, one probe per burst, fail open, matcher scope, signed identity checked against `node:crypto`, 503 without slug or secret). `npm test` green; `npm run validate:ops` 0 failures; a production `next build` with placeholder env passes and `.next/static` holds no edge-secret name. Twin of `deveshe-dreams`.
- 2026-10-26 · **CP-18** (child-PRD review, `zcom-backend/docs/audits/2026-10-26-child-prds-review.md`; the backend checker now sends `?nonce=<32 hex>`): `src/lib/store-identity.js` reads `nonce` from the query, accepts only `^[a-f0-9]{32,64}$` (else 400 `INVALID_NONCE`, nothing signed), signs `<slug>:<nonce>` (the backend's `storeIdentitySignature(slug, secret, nonce)`, lowercase hex) and answers `{ slug, nonce, signature }`, still `no-store` + `noindex`; 503 without slug or secret is checked first. A fixed signature can no longer be copied and replayed. Tests: `test/middleware.test.mjs` signs against `node:crypto` with a nonce, different nonces give different signatures, seven malformed nonces answer 400. Twin updated in the same change. Not run against a live checker.
- FR-3.6 (Account › Privacy) stays **GATED** (lawyer; its operations don't exist).
