# rare-element — docs index

This is the index of every document in this repo. **Keep it current:** any doc you add, rename or retire must be reflected here in the same change. Workflow rules are in `../CLAUDE.md` §0.

| Folder | Holds | Naming |
|---|---|---|
| `prd/` | Product requirement docs; T1 work needs one with Status *Approved* | `PRD-NNN-<slug>.md`, from `_TEMPLATE.md` |
| `architecture/` | Living analyses, contracts and diagrams of how the code works today | `<topic>.md` |
| `adr/` | Architecture decision records, immutable once Accepted (supersede, don't edit) | `ADR-NNN-<slug>.md`, from `_TEMPLATE.md` |
| `reviews/` | Code and design reviews | `YYYY-MM-DD-<slug>.md` |
| `audits/` | Security, performance and accessibility audits, with each finding's status (open, fixed or won't fix) | `YYYY-MM-DD-<slug>.md` |
| `changelog/` | One line per change (T1 and T2) | `YYYY-MM.md` |

## PRDs

| ID | Title | Status | Repos |
|---|---|---|---|
| [PRD-001](prd/PRD-001-session-cookie-hardening.md) | Session & refresh-cookie hardening, phase 2 (pointer → backend) | Approved; code complete 2026-10-14 (PRD-002 WS-F1) | rare-element |
| [PRD-002](prd/PRD-002-audit-remediation.md) | Platform audit remediation (pointer → backend `zcom-backend/docs/prd/PRD-002-audit-remediation.md`); this repo's work is WS-F1 (round 1), R2-W6 (round 2) and R3-C (round 3) | Approved; WS-F1, R2-W6 and R3-C code complete 2026-10-14; integration check passed | rare-element |
| [PRD-003](prd/PRD-003-legacy-data-migration.md) | Legacy data migration (pointer → backend `zcom-backend/docs/prd/PRD-003-legacy-data-migration.md`); this repo's share is the FR-0.5 password-reset UX and the cutover config | In progress; FR-0.5 pages code complete 2026-10-15 | rare-element |
| [PRD-011](prd/PRD-011-payment-provider-apps.md) | Razorpay, Cashfree and PayU payment apps (pointer → backend `zcom-backend/docs/prd/PRD-011-payment-provider-apps.md`); this repo: one payment step for SDK / redirect / form-post checkouts, `/api/payments/return`, CSP hosts | Implemented 2026-10-21 (not browser-tested) |
| [PRD-012](prd/PRD-012-analytics-app-ga4-sync.md) | Analytics as an app (pointer → backend); this repo: visit attribution (GA cookie ids, UTMs) sent with checkout | Implemented 2026-10-22 |
| [PRD-014](prd/PRD-014-production-readiness-remediation.md) | Production-readiness remediation (pointer → backend `zcom-backend/docs/prd/PRD-014-production-readiness-remediation.md`); this repo's Wave 0 (W0-G): fake `/account/offers` removed, `next` 15.5.28, `PendingOrder.findCartId` (shared) | In progress; Wave 0 and Wave 1 (consent banner, a11y, ₹0 orders, middleware tests) code complete 2026-10-25; Wave 2 (search, newsletter, PDP reviews, SEO, wishlist by ids) 2026-10-26, plus the fix round (wishlist, SEO origin, sitemap encoding, listing sort); verified, Wave 2 exit PASS WITH NOTES (not committed, not browser-tested) | rare-element |
| [PRD-013](prd/PRD-013-behaviour-analytics-depth.md) | Behaviour and product analytics depth (pointer → backend `zcom-backend/docs/prd/PRD-013-behaviour-analytics-depth.md`); this repo: the GA4 event layer `utils/analytics-events.js` (`select_item`, `select_variant`, `cta_click`, `gallery_interaction`, `size_guide_open`, `notify_me`, `coupon_apply`/`coupon_failed`, `add_shipping_info`, `add_payment_info`, `checkout_error`) | Implemented 2026-10-23 (not browser-tested) |
| [PRD-015](prd/PRD-015-post-purchase.md) | Post-purchase (pointer → backend `zcom-backend/docs/prd/PRD-015-post-purchase.md`); this repo's FR-20: `/account/order/[id]` with `displayStatus`, tracking card from `shipment`, Cancel when `canCancel`, return request form and return status list | **Approved** 2026-10-26 · not started | rare-element |
| [PRD-016](prd/PRD-016-subscription-proration-entitlements.md) | Subscription proration, entitlements and dunning (pointer → backend `zcom-backend/docs/prd/PRD-016-subscription-proration-entitlements.md`); this repo's FR-25 only: `STORE_ORDERS_PAUSED` at checkout shows "This store isn't taking orders right now" | **Approved** 2026-10-26 · not started | rare-element |
| [PRD-018](prd/PRD-018-tenant-data-lifecycle.md) | Tenant data lifecycle (pointer → backend `zcom-backend/docs/prd/PRD-018-tenant-data-lifecycle.md`); this repo: store-unavailable page (503) for `TENANT_SUSPENDED`, account data requests (export, deletion with a 7-day cancel window), `/.well-known/zcom-store` for the go-live check | **Approved** 2026-10-26 (D1–D19; account data requests gated on the lawyer); **In progress**: FR-1.6 and FR-4.3 implemented 2026-10-26 (FR-4.3 answers the nonce challenge since CP-18), FR-3.6 gated; not deployed | rare-element |
| [PRD-019](prd/PRD-019-gst-invoicing.md) | GST invoicing (pointer → backend `zcom-backend/docs/prd/PRD-019-gst-invoicing.md`); this repo: order Documents with PDF download, optional checkout GSTIN, conditional "(Incl. of all taxes)" | Approved 2026-10-26 (owner: 'please review and approve the six drafted follow-up PRDs'); not started; tax content gated on the owner's CA | rare-element |
| [PRD-020](prd/PRD-020-public-stock-signal.md) | Public stock signal (pointer → backend `zcom-backend/docs/prd/PRD-020-public-stock-signal.md`); this repo: PDP, listing and cart stock states, fresh read, schema.org availability on the existing offers helper | Approved 2026-10-26 (owner: 'please review and approve the six drafted follow-up PRDs'); **Implemented** 2026-10-26 (FR-12, FR-14; guest notify-me email confirmation `/back-in-stock/confirm` since CP-22); not browser-tested | rare-element |
| [PRD-027](prd/PRD-027-lookbook-module.md) | Lookbook module (pointer → backend `zcom-backend/docs/prd/PRD-027-lookbook-module.md`): `/lookbook` and `/lookbook/[slug]` on the backend lookbooks, hotspots, mobile rules, analytics, sitemap |
| [PRD-028](prd/PRD-028-offline-orders-payment-requests.md) | Offline orders, payment requests and offline payments (pointer → backend `zcom-backend/docs/prd/PRD-028-offline-orders-payment-requests.md`); this repo's FR-10: the `/pay/<token>` payment page | **Implemented** 2026-11-02 (not browser-tested) | rare-element |
| [PRD-029](prd/PRD-029-retire-nimbbl.md) | Retire Nimbbl (pointer → backend `zcom-backend/docs/prd/PRD-029-retire-nimbbl.md`): Nimbbl through the store's `nimbbl_sonic` until the 2026-11-15 shutdown (D1) |
| [PRD-032](prd/PRD-032-customer-reviews.md) | Customer reviews (pointer → backend `zcom-backend/docs/prd/PRD-032-customer-reviews.md`); product-page summary, filters, report and "Write a review" with photos, `/review?token=` and `/review/unsubscribe`, Account › Reviews, JSON-LD rating | **Implemented** 2026-11-04 (not browser-tested) | rare-element |
| [PRD-034](prd/PRD-034-meta-and-google-ads.md) | Meta and Google ads (pointer → backend `zcom-backend/docs/prd/PRD-034-meta-and-google-ads.md`); per-store tag ids from `storefrontTrackingConfig` with env fallback, Meta Pixel and Google Ads behind marketing consent, Purchase deduplicated on the order id, enhanced conversions, click ids + consent snapshot at checkout, `/checkout/start` | **Phase 1 implemented** 2026-11-05 (not browser-tested) | rare-element |
| [PRD-041](prd/PRD-041-guest-checkout.md) | Guest checkout and passwordless customer accounts (pointer → backend `zcom-backend/docs/prd/PRD-041-guest-checkout.md`); this repo's FR-17: guest checkout on the kit (Contact, Delivery, Payment), "Sign in to check out" when accounts are REQUIRED, `/login` email code (also the sign-up; password behind "Sign in with password instead"), `/orders/status/[token]`, "View order status" in Account, `/checkout` out of the login guard; the signed-in checkout on the kit's `start` / `pay` / `retryPayment` too (2026-11-12, T2) | **Implemented** 2026-11-12 (working tree, not browser-tested; needs kit 1.1.0 and the `package.json` bump once tagged) | rare-element |
| [KIT-PRD-002](prd/KIT-PRD-002-storefronts-onto-the-kit.md) | Move onto `@zcom/storefront-kit` (pointer → the kit's `docs/prd/PRD-002-storefronts-onto-the-kit.md`; numbered after the kit, since this repo's PRD-002 is the backend audit pointer): kit proxy, session, tags, consent, server reads, payments, helpers and headers; Next 16 and the shared package versions | **Step 3 implemented** 2026-11-10 (working tree; not browser-tested) | rare-element, zcom-storefront-kit |

## Architecture

| Doc | Purpose | Last verified |
|---|---|---|
| [solution-architecture.md](architecture/solution-architecture.md) | **Start here.** Storefront design: RSC/client split, ISR route map, same-origin data access through the middleware proxy and edge headers, cookie session and signed guest id, checkout flow with pending order, presentation, deploy, gaps (Mermaid). Parent: `../../ARCHITECTURE.md` (workspace) | 2026-10-14 |
| Storefront API contract | Lives in `../../zcom-backend/docs/architecture/storefront-api-contract.md` | 2026-10-14 |

## ADRs

| ID | Decision | Status |
|---|---|---|
| — | _none yet_ | |

## Reviews and audits

| Date | Doc | Scope | Open findings |
|---|---|---|---|
| 2026-10-14 | [2026-10-14-storefront-audit.md](audits/2026-10-14-storefront-audit.md) | Storefront: contract drift, tenant config, SEO, checkout, security (remediation status and round 2 status at the end) | SF-9 partial (`unsafe-inline` kept), SF-21 partial; verification re-audit done; round 3 (R3-C) fixed VBUG-4/6, VSEC-3/4, VCON-1/2 (see the PRD-002 pointer) |
