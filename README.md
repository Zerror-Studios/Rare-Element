# rare-element — Rare Element (Nahara) storefront

This is a custom-designed shopper storefront on the **ZCommerce** platform by Zerror Studios. It's built with Next.js 15 with the App Router (React 19, RSC + ISR) in JavaScript, and it consumes the shared ZCommerce GraphQL gateway (`../../zcom-backend`). Payments go through Nimbbl.

> Working here with Claude Code or as a new engineer? Read [`CLAUDE.md`](CLAUDE.md), then [`docs/README.md`](docs/README.md). The API contract every storefront follows is in `../../zcom-backend/docs/architecture/storefront-api-contract.md`.

**Integration status: current.** Since PRD-002 (2026-10-14, rounds 1 to 3) every operation validates against the backend schema (34/34 then; 40/40 operations with variable shapes after the PRD-014 close-out; 44/44 with the PRD-020 stock signal and PRD-015 order page, 2026-10-26): catalog (with the nullable stock signal and a fresh `getVariantAvailability` read), cart (server-issued guest ids, `mergeGuestCart` at login), promotions, checkout, orders (status, tracking, cancel and returns on `/account/order/[id]`), wishlist, addresses, contact, back-in-stock and the newsletter `/unsubscribe` page. The browser calls the API same-origin at `/v1/graphql`, which `src/middleware.js` proxies to the gateway with the edge headers (client IP, tenant domain, optional edge secret); the access token is held in memory, and the HttpOnly customer cookie handles refresh. Checkout requires login. Not yet tested in a browser or against the Nimbbl sandbox.

## Getting started

```bash
npm ci
cp .env.example .env.local   # fill in the values (ask the team; never commit them)
npm run dev        # http://localhost:3000
```

**Environment variables** (names only, see `.env.example`):
- `API_GATEWAY_URL` (server-only, **required in production**): the gateway origin; `/v1/graphql` is proxied to it and server components call it directly.
- `EDGE_SHARED_SECRET` (server-only, optional): the gateway's edge secret, sent as `x-zcom-edge-secret` on proxied and server-side calls so strict tenant mode trusts this site's tenant and client-IP headers. Never prefix it with `NEXT_PUBLIC_`.
- `ZCOM_STORE_SLUG` (server-only, PRD-018 FR-4.3): this store's slug; `/.well-known/zcom-store` answers it with an HMAC under `EDGE_SHARED_SECRET` for the platform's go-live check (503 while unset).
- `NEXT_PUBLIC_TENANT_DOMAIN` (**required in production**, `nahara.co.in`): selects the tenant.
- `NEXT_PUBLIC_GRAPHQL_API_URL`: **leave unset** so the browser uses the same-origin `/v1/graphql` (needed for the session cookie).
- `NEXT_PUBLIC_SITE_URL` (default `https://<NEXT_PUBLIC_TENANT_DOMAIN>`; with neither set every page is `noindex`, W2V-C-04), `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_FB_PIXEL_ID` (no defaults since PRD-014 FR-1.9: **set the production IDs in hosting**, an unset id loads no tag; tags load only after cookie consent), `CSP_REPORT_ONLY` (optional).

Every `NEXT_PUBLIC_*` value is public in the browser bundle.

**Deploying** (owner): set the required variables in hosting, unset any absolute `NEXT_PUBLIC_GRAPHQL_API_URL`, add `https://nahara.co.in` to the gateway's `CORS_ORIGINS`, and consider rolling the CSP out with `CSP_REPORT_ONLY=true` first. For strict tenant mode, set `EDGE_SHARED_SECRET` here at the same moment as on Elastic Beanstalk and the CloudFront origin header, and confirm the host's client IP source (`x-vercel-forwarded-for` on Vercel, else the right-most `x-forwarded-for` hop). Set it in the **same deploy** as backend PRD-002 round 3: its new 30/min per-IP login bucket would otherwise see every shopper as this host's IP. In production the `/v1/graphql` proxy fails closed (500) without `NEXT_PUBLIC_TENANT_DOMAIN`. Guest bags from before PRD-002 round 2 are dropped once at deploy (guest ids are now server-signed).

Dev runs with Turbopack.

## Scripts

| Task | Command |
|---|---|
| Dev | `npm run dev` |
| Build | `npm run build` |
| Start (after build) | `npm run start` |
| Contract check | `npm run validate:ops` (operations and `variables` shapes against the composed supergraph; needs `../../zcom-backend` installed and built; PRD-014 FR-1.6) |
| Lint | `npm run lint` (currently not functional; see `CLAUDE.md` §4) |

Tests: `npm test` runs `test/*.test.mjs` with `node:test` (Node ≥ 22.15, no extra dependency) and **runs before every `npm run build`** (`prebuild`, PRD-014 K-01), so a failing test stops the deploy; keep the host's Build Command at `npm run build` (the Vercel default; a `next build` override skips the tests) and its Node at 22.15+. 50 tests: 11 over the `/v1/graphql` proxy in `src/middleware.js` (`test/middleware.test.mjs`, PRD-014 QA-12), 4 over the consent gate on order attribution (`test/attribution-consent.test.mjs`, W1V-C-03), 6 over the SEO helpers (`test/seo-helpers.test.mjs`, PRD-014 Wave 2 and W2V-C-04) 4 over the listing sort values (`test/listing-sort.test.mjs`), 13 over the PRD-020 stock-signal helpers (`test/stock-signal.test.mjs`: `null` = today's behaviour, copy, schema.org, fresh-read merge, option chips, cart lines) and 12 over the PRD-015 order helpers and error reasons (`test/order-detail.test.mjs`, also PRD-016 `STORE_ORDERS_PAUSED`). There are no page or component tests.

## Structure

Routes: `/`, `/products`, `/products/[slug]`, `/[...categories]`, `/account/*` (orders, settings, wishlist; the fake offers page was removed, PRD-014 UX-06), `/checkout/[id]` (+ `thank-you`, `payment-failed`), `/login`, `/about`, `/contact`, and the legal pages. `src/middleware.js` proxies `/v1/graphql` to the gateway and sends shoppers without a session to `/login?next=…` for `/account/*` and checkout. Source lives under `src/`, using the `@/*` alias. The full map is in `CLAUDE.md` §2.

## Contributing

- **Tiered PRD-first workflow.** T1 changes need an approved PRD; anything that touches the API has its source of truth in `../../zcom-backend/docs/prd/`. T2 changes need a changelog line in `docs/changelog/`.
- **Shared logic.** Fixes to shared logic (tokens, the Apollo client, checkout, stores) must be checked against the other storefronts.
- **Keep docs current.** Update this README and `CLAUDE.md` in the same change. Commit with Conventional Commits.
