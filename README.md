# rare-element — Rare Element (Nahara) storefront

This is a custom-designed shopper storefront on the **ZCommerce** platform by Zerror Studios. It's built with Next.js 15 with the App Router (React 19, RSC + ISR) in JavaScript, and it consumes the shared ZCommerce GraphQL gateway (`../../zcom-backend`). Payments go through Nimbbl.

> Working here with Claude Code or as a new engineer? Read [`CLAUDE.md`](CLAUDE.md), then [`docs/README.md`](docs/README.md). The API contract every storefront follows is in `../../zcom-backend/docs/architecture/storefront-api-contract.md`.

**Integration status: current.** Since PRD-002 (2026-10-14, rounds 1 to 3) every operation validates against the backend schema (34/34): catalog, cart (server-issued guest ids, `mergeGuestCart` at login), promotions, checkout, orders, wishlist, addresses, contact, back-in-stock and the newsletter `/unsubscribe` page. The browser calls the API same-origin at `/v1/graphql`, which `src/middleware.js` proxies to the gateway with the edge headers (client IP, tenant domain, optional edge secret); the access token is held in memory, and the HttpOnly customer cookie handles refresh. Checkout requires login. Not yet tested in a browser or against the Nimbbl sandbox.

## Getting started

```bash
npm ci
cp .env.example .env.local   # fill in the values (ask the team; never commit them)
npm run dev        # http://localhost:3000
```

**Environment variables** (names only, see `.env.example`):
- `API_GATEWAY_URL` (server-only, **required in production**): the gateway origin; `/v1/graphql` is proxied to it and server components call it directly.
- `EDGE_SHARED_SECRET` (server-only, optional): the gateway's edge secret, sent as `x-zcom-edge-secret` on proxied and server-side calls so strict tenant mode trusts this site's tenant and client-IP headers. Never prefix it with `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_TENANT_DOMAIN` (**required in production**, `nahara.co.in`): selects the tenant.
- `NEXT_PUBLIC_GRAPHQL_API_URL`: **leave unset** so the browser uses the same-origin `/v1/graphql` (needed for the session cookie).
- `NEXT_PUBLIC_SITE_URL` (default `https://nahara.co.in`), `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_FB_PIXEL_ID`, `CSP_REPORT_ONLY` (optional).

Every `NEXT_PUBLIC_*` value is public in the browser bundle.

**Deploying** (owner): set the required variables in hosting, unset any absolute `NEXT_PUBLIC_GRAPHQL_API_URL`, add `https://nahara.co.in` to the gateway's `CORS_ORIGINS`, and consider rolling the CSP out with `CSP_REPORT_ONLY=true` first. For strict tenant mode, set `EDGE_SHARED_SECRET` here at the same moment as on Elastic Beanstalk and the CloudFront origin header, and confirm the host's client IP source (`x-vercel-forwarded-for` on Vercel, else the right-most `x-forwarded-for` hop). Set it in the **same deploy** as backend PRD-002 round 3: its new 30/min per-IP login bucket would otherwise see every shopper as this host's IP. In production the `/v1/graphql` proxy fails closed (500) without `NEXT_PUBLIC_TENANT_DOMAIN`. Guest bags from before PRD-002 round 2 are dropped once at deploy (guest ids are now server-signed).

Dev runs with Turbopack.

## Scripts

| Task | Command |
|---|---|
| Dev | `npm run dev` |
| Build | `npm run build` |
| Start (after build) | `npm run start` |
| Lint | `npm run lint` (currently not functional; see `CLAUDE.md` §4) |

There are no tests.

## Structure

Routes: `/`, `/products`, `/products/[slug]`, `/[...categories]`, `/account/*` (orders, settings, wishlist; the fake offers page was removed, PRD-014 UX-06), `/checkout/[id]` (+ `thank-you`, `payment-failed`), `/login`, `/about`, `/contact`, and the legal pages. `src/middleware.js` proxies `/v1/graphql` to the gateway and sends shoppers without a session to `/login?next=…` for `/account/*` and checkout. Source lives under `src/`, using the `@/*` alias. The full map is in `CLAUDE.md` §2.

## Contributing

- **Tiered PRD-first workflow.** T1 changes need an approved PRD; anything that touches the API has its source of truth in `../../zcom-backend/docs/prd/`. T2 changes need a changelog line in `docs/changelog/`.
- **Shared logic.** Fixes to shared logic (tokens, the Apollo client, checkout, stores) must be checked against the other storefronts.
- **Keep docs current.** Update this README and `CLAUDE.md` in the same change. Commit with Conventional Commits.
