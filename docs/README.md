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
| [PRD-014](prd/PRD-014-production-readiness-remediation.md) | Production-readiness remediation (pointer → backend `zcom-backend/docs/prd/PRD-014-production-readiness-remediation.md`); this repo's Wave 0 (W0-G): fake `/account/offers` removed, `next` 15.5.28, `PendingOrder.findCartId` (shared) | In progress; Wave 0 code complete 2026-10-25 (not browser-tested) | rare-element |
| [PRD-013](prd/PRD-013-behaviour-analytics-depth.md) | Behaviour and product analytics depth (pointer → backend `zcom-backend/docs/prd/PRD-013-behaviour-analytics-depth.md`); this repo: the GA4 event layer `utils/analytics-events.js` (`select_item`, `select_variant`, `cta_click`, `gallery_interaction`, `size_guide_open`, `notify_me`, `coupon_apply`/`coupon_failed`, `add_shipping_info`, `add_payment_info`, `checkout_error`) | Implemented 2026-10-23 (not browser-tested) |

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
