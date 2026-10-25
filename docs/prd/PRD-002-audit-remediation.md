# PRD-002 — Platform audit remediation (pointer: rare-element)

| Field | Value |
|---|---|
| Status | **Approved** 2026-10-14 (mirrors the source of truth); round 1 (WS-F1), round 2 (R2-W6) and round 3 (R3-C) code complete; integration check passed 2026-10-14 |
| Source-of-truth PRD | `../../zcom-backend/docs/prd/PRD-002-audit-remediation.md` |
| Created / Updated | 2026-10-14 / 2026-10-14 |
| Delivery | **Code complete 2026-10-14**. Not deployed, not browser-tested, not run against the Nimbbl sandbox |
| Related | `../audits/2026-10-14-storefront-audit.md` (SF-* and round 2 status) · `../../zcom-backend/docs/audits/2026-10-14-re-audit.md` · [PRD-001 pointer](PRD-001-session-cookie-hardening.md) |

All requirements, decisions (D1–D6) and contracts (R2-C1 to R2-C8) live in the source-of-truth PRD. This file only lists **this storefront's** share. The other storefront has its own pointer; shared-logic fixes apply to both (`storefronts/CLAUDE.md` §2).

## This repo's share

| Round | Workstream | Findings |
|---|---|---|
| 1 | WS-F1 | SF-1, 3, 4, 5, 8–14, 16–18, 20–22 (D3: migrate to the current contract) |
| 2 | R2-W6 | R2-C1 (ROPS-1), R2-C2 (RSEC-3), R2-C3 (RPERF-11, RBUG-18), R2-C5 (RCON-3), R2-C7 (RCON-4), R2-C8 (RBUG-8), RSEC-6, RSEC-11, RBUG-19, RBUG-20, RCON-6, RMAINT-7, RMAINT-9, SF-9 (CSP nonce) |
| 3 | R3-C | VBUG-4, VBUG-6, VSEC-3, VSEC-4, VCON-1 (unsubscribe page), VCON-2, RMAINT-9 remainder (`uuid`) |

## Implementation log

### Round 3: R3-C (2026-10-14), code complete
- **Unsubscribe page (VCON-1):** `app/unsubscribe/page.jsx` (`noindex,nofollow`) + `unsubscribe-client.jsx`. It is the target of the backend's campaign link `https://<tenant domain>/unsubscribe?email=…&token=…` (built by notification, signed with the backend's `NEWSLETTER_TOKEN_SECRET`). It reads `email` and `token` once, removes them from the address bar (`history.replaceState`), and calls `unsubscribeNewsletter(email, token)`. The server answers uniformly, so every server answer shows one neutral message; only a network failure offers a retry. The backend builds the link from the tenant's **configured domain**, so that domain must serve this storefront or redirect keeping the query string (FIN-3; the owner checks it per tenant).
- **Payment retry with changed details (VBUG-4):** `utils/pending-order.js` adds a details fingerprint (email + shipping + billing address as sent). A retry reuses the pending order only while the cart and the details both match; a change creates a new order; legacy entries without the details fingerprint are not reused.
- **Guest id (VBUG-6):** `useVisitor` compares before clearing, so a late failure of an old id never clears a newer one.
- **Client IP (VSEC-3):** `lib/edge-headers.js` `getClientIp`: `x-vercel-forwarded-for` only when `VERCEL` is set, then `request.ip`, then the right-most `x-forwarded-for` hop. The first hop and `x-real-ip` are never trusted.
- **Tenant headers (VSEC-4):** the proxy strips client `x-tenant-domain` and `x-forwarded-host` as well as `x-zcom-*`; in production a missing `NEXT_PUBLIC_TENANT_DOMAIN` fails closed with a 500 (dev sends `localhost:3000`).
- **Reasons (VCON-2):** `CHECKOUT_REPLACED`, `PAYMENT_NOT_CONFIGURED`, `MISSING_PROVIDER_ORDER`, `INVALID_EMAIL` mapped in `utils/errors.js`.
- **Hygiene:** unused `uuid` removed; stale comments updated.
- **Not done (design decision):** the SSR client IP. The RSC client and the SSR pass of client components send the tenant and the edge secret but no `x-zcom-client-ip`: a client component can't read `headers()`, and `headers()` in the root layout would end ISR. A server-side customer-data path is the proposed fix.
- **Accepted (R3-D7):** SF-9 `'unsafe-inline'`; VPERF-4 (every browser API call passes through the Edge middleware).
- **Checks:** `next build` OK (lists `/unsubscribe`); validator **34/34**; no secret in `.next/static`; smoke script (lead's scratchpad). No browser or sandbox test.
- **Owner actions:** set `EDGE_SHARED_SECRET` here in the **same deploy** as backend round 3 (its new 30/min per-IP login bucket, `AUTH_IP_RATE_LIMIT_PER_MIN`, would otherwise count every shopper as this host's IP); keep `NEXT_PUBLIC_TENANT_DOMAIN` set (the proxy now fails closed without it).


### Round 2: R2-W6 (2026-10-14), code complete
- **Edge headers (R2-C1):** `src/middleware.js` proxies same-origin `/v1/graphql` to `${API_GATEWAY_URL}/v1/graphql` with the headers from `lib/edge-headers.js` (client `x-zcom-*` stripped; `x-zcom-client-ip` from the first `x-forwarded-for` hop, replaced by a trusted source in round 3; `x-tenant-domain`; `x-zcom-edge-secret` when the server-only `EDGE_SHARED_SECRET` is set). The `next.config.mjs` rewrite was removed. The RSC client sends the secret, and `apollo-wrapper.js` adds it for SSR through `getSsrEdgeHeaders` under an inline `typeof window === "undefined"` check, so the browser bundle drops it (verified: no secret in `.next/static`).
- **Guest cart (R2-C2, R2-C3):** `useVisitor` requests `issueGuestCartId` lazily at the first add; unsigned UUIDs are dropped; `runWithGuestId` re-issues and retries once on `INVALID_GUEST_ID`. Login calls `mergeGuestCart(guestId)` once.
- **Checkout (R2-C8, RBUG-20):** the unpaid order id is kept per cart in `sessionStorage` with a lines + coupon fingerprint (`utils/pending-order.js`); the bag stays locked while it exists. Thank-you ends on "Payment not confirmed yet" instead of a false success.
- **Session (R2-C5, RBUG-19, RSEC-11):** `INVALID_DB_TOKEN` ends the session; `TENANT_NOT_FOUND` shows one "store unavailable" toast; a refresh ends the session only on auth or tenant codes. The auth store persists only the logged-in hint and customer id (`partialize`, v1 migration); the profile reloads from the server.
- **Other:** RSEC-6 `utils/redirect.js` (no valid `next` → `/`); RCON-4/6 reason map (`CHECKOUT_EXPIRED`, `RESERVATION_RELEASED`, `INVALID_QTY`, `TOO_MANY_LINES`, `ORDER_CANCELLED`, `INVALID_GUEST_ID`); RMAINT-7 "Keep in sync" headers; RMAINT-9 `js-cookie` and `cross-fetch` removed.
- **Partial:** SF-9: a nonce-based CSP isn't feasible (it forces dynamic rendering, ending ISR, and GTM custom-HTML tags need inline script), so `'unsafe-inline'` stays, with a comment in `next.config.mjs`.
- **Env:** `EDGE_SHARED_SECRET` (server-only, optional).
- **Shopper-visible changes:** guest bags from before round 2 are dropped once at deploy; login without `next` lands on `/`; the profile reloads from the server after a page reload; checkout is locked while a pending order exists; the thank-you page never shows a false success; a "store unavailable" toast when the tenant isn't found.
- **Checks:** `next build` OK; validator **33/33**; redirect smoke tests (14 cases) and edge-header smoke test OK; no secret in `.next/static`. No browser or sandbox test.
- **Owner actions:**
  - set `EDGE_SHARED_SECRET` on this host at the **same moment** as Elastic Beanstalk and the CloudFront origin header (it turns on gateway strict mode);
  - confirm the host's client IP source (round 3: `x-vercel-forwarded-for` on Vercel, else the right-most hop);
  - roll the CSP out with `CSP_REPORT_ONLY=true` first;
  - run browser and Nimbbl sandbox tests.

### Round 1: WS-F1 (2026-10-14), code complete
- Every document rewritten to the current contract (31/31 at the time); errors mapped from `extensions.reason`/`code` (`utils/errors.js`).
- In-memory access token, single-flight `customerRefreshToken`, HttpOnly cookie through same-origin `/v1/graphql` (PRD-001 phase 2).
- Final checkout flow (login required), thank-you polls `myOrder`, purchase events once per PAID order.
- Per-route canonicals and product metadata; CSP and security headers; sanitiser and JSON-LD escaping; `middleware.js` route guard; lazy 3D and Lottie; scoped GSAP cleanup; analytics IDs from env.
- Details: source PRD §8 "WS-F1" and `../audits/2026-10-14-storefront-audit.md` "Remediation status".

## Verification
Source PRD §5. Still to do after deployment: browser end-to-end checkout (desktop and mobile), Nimbbl sandbox, strict-mode smoke test once `EDGE_SHARED_SECRET` is set.
