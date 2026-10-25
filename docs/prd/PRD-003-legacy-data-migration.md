# PRD-003 — Legacy data migration (pointer: rare-element)

| Field | Value |
|---|---|
| Status | **In progress** (mirrors the source of truth, approved 2026-10-15); this repo's FR-0.5 share is code complete 2026-10-15 |
| Source-of-truth PRD | `../../../zcom-backend/docs/prd/PRD-003-legacy-data-migration.md` |
| Created / Updated | 2026-10-15 / 2026-10-15 |
| Delivery | Code complete 2026-10-15. Not deployed, not browser-tested, not run against a live backend |
| Related | [PRD-002 pointer](PRD-002-audit-remediation.md) · `../../../zcom-backend/docs/architecture/storefront-api-contract.md` |

All requirements, decisions (Q-A to Q-G, Q1–Q24) and the migration tool live in the source-of-truth PRD. This file lists only **this storefront's** share.

## This repo's share

| Item | What |
|---|---|
| FR-0.5 (UX, PRD-003 §6) | "Forgot password?" on the login form, `/forgot-password` (email form, uniform success state) and `/reset-password?token=…&email=…` (new password + confirm; success, invalid-or-expired and error states; token stripped from the URL after the first read; `noindex`). Operations `customerRequestPasswordReset` and `customerResetPassword`; error reasons `INVALID_RESET_TOKEN`, `WEAK_PASSWORD`. |
| Cutover (PRD-003 §9) | Env and tenant-domain switch only; no code. The backend builds the reset link from the tenant's `settings.storefrontUrl` (or its domain), so that URL must serve this storefront. |

## Implementation log

- **2026-10-15:** FR-0.5 pages and mutations added (`src/app/forgot-password/*`, `src/app/reset-password/*`, `src/graphql/mutations/auth.mutation.jsx`, `src/components/login/Login.jsx`, `src/utils/errors.js`, `src/styles/pages/password-reset.css`). Operations re-validated against the composed backend schema: 36/36. Pending: a browser run against a live backend, and the tenant's `customer_password_reset` email template (seeded by the migration, FR-7).
