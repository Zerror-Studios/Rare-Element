# PRD-001 — Session & refresh-cookie hardening (pointer: rare-element)

| Field | Value |
|---|---|
| Status | **Approved** 2026-10-13 (mirrors the source of truth) |
| Source-of-truth PRD | `../../zcom-backend/docs/prd/PRD-001-session-cookie-hardening.md` |
| Phase | **Phase 2** (after backend R1 and the dashboard rollout) |
| Created / Updated | 2026-10-13 / 2026-10-14 |
| Delivery | **Code complete 2026-10-14** under PRD-002 WS-F1. Not deployed |

All requirements live in the source-of-truth PRD. This file only lists **this storefront's** share. Don't implement anything until the source PRD is **Approved**.

## This repo's requirements

| FR | Work in rare-element |
|---|---|
| FR-1.4 | Serve `/v1/graphql` from the storefront's own domain (Next.js `rewrites` or the host proxy) and point the RSC client (`lib/apollo-client-rsc.js`) and the browser client (`lib/apollo-wrapper.js`) at it. Overwrite `X-Forwarded-Host` with the storefront host; drop any client `x-tenant-domain` (FR-1.5) |
| FR-2.3 | Use `customerRefreshToken` (cookie-based) instead of `refreshToken` |
| FR-2.5 | Remove the JS `refresh_token` cookie from `src/utils/tokenManager.js` (`setTokens`, `getRefreshToken`, `clearTokens`). The refresh token lives only in the server's HttpOnly customer cookie |
| FR-3.4 | Refresh only on `TOKEN_EXPIRED`, not on `UNAUTHENTICATED` or message strings |
| FR-6.2 | Logout calls `customerLogout` |

**Shared-logic rule:** apply the same change to the other storefront in the same effort (see `storefronts/CLAUDE.md` §2).

## Verification
Run source PRD §9 cases T1, T3 and T5 (customer variants) in Chrome, Safari and Firefox, and record them in the PR.

## Implementation log

### 2026-10-14: code complete (PRD-002 WS-F1; not deployed, not browser-tested)
- **FR-1.4:** a `beforeFiles` rewrite sends same-origin `/v1/graphql` to `${API_GATEWAY_URL}/v1/graphql`; server components call the gateway directly with `x-tenant-domain` / `x-forwarded-host` = `NEXT_PUBLIC_TENANT_DOMAIN`. `NEXT_PUBLIC_GRAPHQL_API_URL` must stay unset in hosting.
- **FR-2.3:** `customerRefreshToken` (raw `fetch`, `credentials: "include"`, single-flight) in `utils/tokenManager.js`, 60 s before the JWT `exp`.
- **FR-2.5:** the access token lives in memory only; `refreshToken` is never selected or stored. The legacy JS `refresh_token` cookie is left untouched so the backend can read and expire it during `LEGACY_REFRESH_COOKIE_UNTIL`; the old access token is purged from localStorage.
- **FR-3.4:** the error link refreshes once on `TOKEN_EXPIRED` and retries; `INVALID_AUTH_TOKEN` / `TENANT_MISMATCH` end the session; a network failure doesn't.
- **FR-6.2:** logout calls `customerLogout` and always clears local state.
- **Update (PRD-002 round 2, R2-C1):** the `beforeFiles` rewrite was replaced by a `src/middleware.js` proxy, so the same-origin call can carry the edge headers (`x-zcom-client-ip`, `x-tenant-domain`, optional `x-zcom-edge-secret`). Client `x-zcom-*` headers are stripped.
- **Still to do:** source PRD §9 cases T1, T3 and T5 after deployment.
