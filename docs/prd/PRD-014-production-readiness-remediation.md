# PRD-014 — Production-readiness remediation: rare-element (pointer)

| Field | Value |
|---|---|
| Status | **In progress** — Wave 0 (workstream W0-G) code complete 2026-10-25; not browser-tested |
| Source-of-truth PRD | [`../../../zcom-backend/docs/prd/PRD-014-production-readiness-remediation.md`](../../../zcom-backend/docs/prd/PRD-014-production-readiness-remediation.md) |
| Approved by / on | Workspace owner, 2026-10-25, "approve with recommendations" (backend PRD §8.1) |
| Audit | `zcom-backend/docs/audits/2026-10-25-production-readiness/E-clients-journeys.md` (UX-06), `A-security-tenancy.md` (SEC-12) |

This repo's Wave 0 share: FR-0.9 (UX-06) and FR-0.2 (SEC-12). Later waves (FR-1.9 consent banner, FR-2.8 search/sort/newsletter/SEO) are not started here.

## 1. What changed (Wave 0)

- **FR-0.9 / UX-06:** `/account/offers` is deleted (`app/account/offers/page.jsx` and `loading.jsx`, the hard-coded "Flat 90 % off" code that no tenant had, indexed). The route now 404s. The commented-out "Discounts & Offers" link in `components/account/AccountAside.jsx` is removed too. A real offers page can come back later on `getAllValidPromotions` (backend exists) under its own change.
- **FR-0.12 support (shared logic, RMAINT-7):** `utils/pending-order.js` gains `PendingOrder.findCartId(orderId)`, kept identical to deveshe-dreams (which uses it for "Retry payment" on its payment-failed page). Unused here today: rare's payment-failed page links to the order and back to shopping.
- **FR-0.2 / SEC-12:** `next` `^15.5.12` → **`^15.5.28`** (latest 15.x patch; fixes the rewrite request-smuggling advisory, the App Router segment-prefetch middleware bypass and every other 15.x advisory listed); `npm audit fix` (no `--force`) updated the lockfile (swiper 12.2.0, axios, form-data, nanoid, zod, sharp and others). No `eslint-config-next` in this repo. **Remaining:** 1 high (`postcss`, bundled by next) + 1 moderate (`next`), 0 critical; both clear only with **next 16** (a major; owner decision under backend PRD-014 Q14).

## 2. Contract

Unchanged: 36/36 operations valid against the composed supergraph. `createOrder` is not used.

## 3. Verification (2026-10-25)

- `npm run build` passes (placeholder env; the ISR prerender logs the expected `fetch failed` without a gateway); `/account/offers` is no longer in the route table.
- Contract validator 36/36; grep `NAHARA90` → nothing in `src/`.
- Not run: a browser or a live gateway.

## 4. Implementation log

- 2026-10-25 · W0-G · FR-0.9 (UX-06), FR-0.2 (SEC-12), `PendingOrder.findCartId` (shared with deveshe-dreams).
