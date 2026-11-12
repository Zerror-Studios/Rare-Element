# rare-element — Rare Element (Nahara) storefront

This is a custom-designed shopper storefront on the **ZCommerce** platform by Zerror Studios. It's built with Next.js 16 with the App Router (React 19.3, RSC + ISR) in JavaScript on **`@zcom/storefront-kit`** (the proxy, session, cart, checkout, payments, consent, tags and SEO helpers every Zcom storefront shares; `../../zcom-storefront-kit`), and it consumes the shared ZCommerce GraphQL gateway (`../../zcom-backend`). Payments go through the store's payment app (Razorpay, Cashfree or PayU).

> Working here with Claude Code or as a new engineer? Read [`CLAUDE.md`](CLAUDE.md), then [`docs/README.md`](docs/README.md). The API contract every storefront follows is in `../../zcom-backend/docs/architecture/storefront-api-contract.md`.

**Integration status: current.** Since PRD-002 (2026-10-14, rounds 1 to 3) every operation validates against the backend schema (34/34 then; 40/40 operations with variable shapes after the PRD-014 close-out; 44/44 with the PRD-020 stock signal and PRD-015 order page; 45/45 with `confirmBackInStock`, CP-22, 2026-10-26): catalog (with the nullable stock signal and a fresh `getVariantAvailability` read), cart (server-issued guest ids, `mergeGuestCart` at login), promotions, checkout, orders (status, tracking, cancel and returns on `/account/order/[id]`), wishlist, addresses, contact, back-in-stock (guests confirm by email at `/back-in-stock/confirm`, CP-22) and the newsletter `/unsubscribe` page. The browser calls the API same-origin at `/v1/graphql`, which `src/middleware.js` proxies to the gateway with the edge headers (client IP, tenant domain, optional edge secret); the access token is held in memory, and the HttpOnly customer cookie handles refresh. Since backend PRD-041 (2026-11-12, kit 1.1.0) shoppers check out without signing in unless the store's accounts are REQUIRED, sign in with an emailed 6-digit code (also the sign-up; password sign-in stays behind "Sign in with password instead"), and each order has a status page `/orders/status/<token>`. Both the guest and the signed-in checkout run on the kit's `useCheckout()` (session, payment, retry and the checkout's analytics). **On kit 1.1.0** (`package.json` and the lockfile pin the `v1.2.0` tag, commit `3130c74`, since 2026-11-12). Not yet tested in a browser or against a payment sandbox.

## Getting started

```bash
npm ci
cp .env.example .env.local   # fill in the values (ask the team; never commit them)
npm run dev        # http://localhost:3000
```

**Environment variables** (names only, see `.env.example`):
- `API_GATEWAY_URL` (server-only, **required in production**): the gateway origin; `/v1/graphql` is proxied to it and server components call it directly.
- `EDGE_SHARED_SECRET` (server-only, **required in production**): the gateway's edge secret; the kit signs proxied and server-side calls with it, so the gateway trusts this site's tenant and client-IP headers. Never prefix it with `NEXT_PUBLIC_`.
- `GITHUB_TOKEN` (hosting only): the shared read token that installs the kit from its private repo (Vercel team shared variable; `vercel.json` uses it). See the kit README, "Build token".
- `ZCOM_STORE_SLUG` (server-only, PRD-018 FR-4.3): this store's slug; `/.well-known/zcom-store?nonce=<hex>` answers `{ slug, nonce, signature }` with an HMAC of `<slug>:<nonce>` under `EDGE_SHARED_SECRET` for the platform's go-live check (503 while unset, 400 for a missing or malformed nonce; CP-18).
- `NEXT_PUBLIC_TENANT_DOMAIN` (**required in production**, `nahara.co.in`): selects the tenant.
- `NEXT_PUBLIC_GRAPHQL_API_URL`: **leave unset** so the browser uses the same-origin `/v1/graphql` (needed for the session cookie).
- `NEXT_PUBLIC_SITE_URL` (default `https://<NEXT_PUBLIC_TENANT_DOMAIN>`; with neither set every page is `noindex`, W2V-C-04), `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_FB_PIXEL_ID` (no defaults since PRD-014 FR-1.9; since PRD-034 the GA4 and Pixel ids come from the store's backend `storefrontTrackingConfig` and these two env names are only the **fallback** when the backend has none (GTM stays env-only); an unset id loads no tag; tags load only after cookie consent, ad tags only after marketing consent), `CSP_REPORT_ONLY` (optional).

Every `NEXT_PUBLIC_*` value is public in the browser bundle.

**Deploying** (owner):

- **AWS Amplify** (`amplify.yml`, the twin of `vercel.json`): set `GITHUB_TOKEN` (read access to the private kit repo) and the server variables (`API_GATEWAY_URL`, `EDGE_SHARED_SECRET`, `ZCOM_STORE_SLUG`, and `ZCOM_TRUSTED_IP_HEADER` once the host's trusted client-IP header is confirmed) as Amplify environment variables. The build rewrites GitHub git URLs to https with the token (the kit is a git dependency; the `.npmrc` token line only covers the npm registry) and writes the server variables to `.env.production`, because Amplify gives console variables to the build only and the kit reads these at runtime. `NEXT_PUBLIC_*` names are baked in at build and need nothing extra. Confirm on the first `dev` deploy that Amplify runs Next 16 with `src/proxy.js`.

On any host: set the required variables in hosting (with the shared `GITHUB_TOKEN` linked), unset any absolute `NEXT_PUBLIC_GRAPHQL_API_URL`, set `EDGE_SHARED_SECRET` to the same value as on Elastic Beanstalk, and consider rolling the CSP out with `CSP_REPORT_ONLY=true` first. The storefront's domain is never added to the gateway's `CORS_ORIGINS` (PRD-007 FR-8.2: the kit's proxy is edge-signed).

Dev runs with Turbopack.

## Scripts

| Task | Command |
|---|---|
| Dev | `npm run dev` |
| Build | `npm run build` |
| Start (after build) | `npm run start` |
| Contract check | `npm run validate:ops` (operations and `variables` shapes against the composed supergraph; needs `../../zcom-backend` installed and built; PRD-014 FR-1.6) |
| Lint | `npm run lint` (currently not functional; see `CLAUDE.md` §4) |

Tests: `npm test` runs `test/*.test.mjs` with `node:test` (Node ≥ 22.15, no extra dependency) and **runs before every `npm run build`** (`prebuild`, PRD-014 K-01), so a failing test stops the deploy; keep the host's Build Command at `npm run build` (`vercel.json`). 98 tests (2026-11-12) over Nahara's own helpers (SEO, sort, stock labels, order detail, back-in-stock, payment-request views, reviews, the PRD-041 guest checkout and order status helpers, the signed-in checkout's kit inputs); the proxy, session, consent, tags and store status are tested in the kit.

## Structure

Routes: `/`, `/products`, `/products/[slug]`, `/[...categories]`, `/account/*` (orders, settings, wishlist; the fake offers page was removed, PRD-014 UX-06), `/checkout` (+ `start`, `payment-return`, `payment-failed`, `thank-you`; guest or signed in, PRD-041; the bag comes from the session, never the URL, and there is no `/checkout/<id>`), `/orders/status/[token]` (the order status page, noindex, no referrer), `/lookbook`, `/lookbook/[slug]` (backend lookbooks, PRD-027), `/login` (email code, or password), `/about`, `/contact`, and the legal pages. `src/proxy.js` (the kit's middleware) proxies `/v1/graphql` to the gateway and sends shoppers without a session to `/login?next=…` for `/account/*` only (checkout is open to guests since PRD-041; the page shows "Sign in to check out" when the store requires accounts). Source lives under `src/`, using the `@/*` alias. The full map is in `CLAUDE.md` §2.

## Contributing

- **Tiered PRD-first workflow.** T1 changes need an approved PRD; anything that touches the API has its source of truth in `../../zcom-backend/docs/prd/`. T2 changes need a changelog line in `docs/changelog/`.
- **Shared logic lives in the kit.** A fix to the proxy, session, Apollo client, consent, tags, payments or SEO helpers goes into `@zcom/storefront-kit` (every store gets it with the next tag), not into this repo.
- **Keep docs current.** Update this README and `CLAUDE.md` in the same change. Commit with Conventional Commits.
