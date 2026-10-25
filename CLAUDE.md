# CLAUDE.md — storefronts/rare-element

These are the engineering rules for Claude Code and developers in this storefront. The file reflects the code as analysed on **2026-10-13**, updated after the PRD-002 migration (WS-F1) and round 2 (R2-W6) on **2026-10-14**. When the code and this file disagree, check the code and then update this file.

**Precedence.** System and platform instructions come first, then the workspace `../../CLAUDE.md` and `../CLAUDE.md` (shared storefront rules, when present), then this file, then user requests that don't conflict with those. The API contract this site must follow is in `../../zcom-backend/docs/architecture/storefront-api-contract.md`.

**Architecture.** Read `docs/architecture/solution-architecture.md` for the diagrams and design of this repo. The platform-wide view is in `../../ARCHITECTURE.md`, when the workspace root is present.

## 0. Workspace rules (shared by every ZCommerce repo)

This repo is one part of the ZCommerce platform. The full map is in the workspace root `../CLAUDE.md` (`../../CLAUDE.md` for storefronts), when that file is present. The rules below are mandatory here even when it isn't.

1. **PRD first (tiered).**
   - **T1** covers: a new feature, page or module; a GraphQL contract change; a model or event change; auth, tenant, permission or billing logic; a new integration. T1 needs a PRD in `docs/prd/` with **Status: Approved** before any code. If none exists, draft one from `docs/prd/_TEMPLATE.md` (Status *Draft*) and **stop for approval**.
   - **T2** covers bug fixes, tweaks and small refactors. T2 needs only a line in `docs/changelog/YYYY-MM.md`.
   - Unsure of the tier? Treat it as T1 and ask.
   - Cross-repo PRDs have their source of truth in `zcom-backend/docs/prd/`; consumer repos keep a pointer PRD.
2. **Read docs before, update docs after (MANDATORY, no exceptions).** Documentation is part of the definition of done. Every change, including code, config, infra, dependencies and decisions, updates all related docs in the same change. Record decisions and approvals from conversation in the PRD or ADR immediately, before implementing. A task isn't finished while any doc disagrees with the code.
   - **Before** a change, read this file, `README.md`, `docs/README.md`, and the relevant PRD, ADR and architecture docs.
   - **After** it, in the same change, update whatever is now stale: the README (setup, commands, env names), `docs/architecture/*` (contracts), PRD status and implementation log, the changelog, `docs/README.md` (the index), and this `CLAUDE.md` (rules and known issues).
   - End every task with a **"Docs impact"** line.
3. **Ask, don't guess.**
   - Ask one precise question, with options and a recommendation, when the request conflicts with a PRD, an ADR, this file, or the code.
   - Do the same when docs and code disagree, or when a change would affect a contract, a security or tenant boundary, the design system, dependencies or deployment.
   - Don't ask about things you can verify in the code yourself.
4. **Scoped and safe.**
   - No drive-by refactors or mass reformatting.
   - Don't add dependencies without asking.
   - Never commit, push, deploy or touch databases unless asked.
   - Never print or commit secrets or `.env` values, including the token embedded in `git remote -v`.
   - Report checks honestly, keeping pre-existing failures separate from new ones.
5. **Coding style: the owner's signature (mandatory).** Follow the workspace `CODING_STYLE.md` (`../CODING_STYLE.md`, or `../../CODING_STYLE.md` for storefronts). Its baseline is the `zcom-backend` style.
   - 2 spaces, double quotes, semicolons, trailing commas, 80 columns.
   - Named exports with barrel `index.ts` files (React page and component files are the exception: `export default X;` at the end).
   - File names are `kebab-case.role.ts`.
   - Static-class controllers and services, with `return await`.
   - `xEnum = {…} as const`; the `I` prefix only for Mongoose documents; `UPPER_SNAKE` constants with unit suffixes (`_MS`, `_DAYS`).
   - `GraphQLError` with `extensions.code`; one `createLogger({ service })` per module.
   - JSDoc module headers and `// ─── ` section dividers.

   **New files** follow it exactly. **Edits** keep the file's existing formatting; never reformat untouched code. When you commit, use Conventional Commits: `type(scope): summary (PRD-NNN)`.
6. **Storefront specifics.**
   - Use only backend operations listed in the storefront contract doc, and validate field-level.
   - The server computes money.
   - When you fix shared logic (tokenManager, Apollo links, AuthContext/session, useVisitor, the checkout handler, sanitiser, stores), check `../deveshe-dreams` for the same issue.

## 1. What this is

The **Rare Element** brand storefront (the brand name in content and assets is **Nahara**, `assets.nahara.co.in`, site `nahara.co.in`). It's a custom-designed shopper site on ZCommerce, with home, product listing and detail, category catch-all, account (orders, settings, wishlist; the fake offers page was removed by PRD-014 UX-06), checkout (the store's payment app: Nimbbl, Razorpay, Cashfree or PayU, PRD-011) and login. It is the **reference pattern for new storefronts**.

**Stack:**
- Next.js 15.5 with the **App Router**, React 19, **JavaScript**.
- Apollo Client 4 + `@apollo/client-integration-nextjs`, zustand 5, react-hook-form + zod 4.
- GSAP 3.13 (public package) with ScrollTrigger and CustomEase, `lenis`, Swiper.
- three / R3F (dynamic import, `ssr: false`), lottie-react (only through `LazyLottie`, JSON fetched from `/public`), `@remixicon/react` icons, react-toastify, `html-react-parser` (also used by the sanitiser).

**Removed:** `uuid` (PRD-002 round 3; guest ids are server-issued since R2-C2), `js-cookie` and `cross-fetch` (RMAINT-9), framer-motion earlier (SF-21).

**Integration status: on the current backend contract (PRD-002 WS-F1, round 2 R2-W6 and round 3, 2026-10-14).**
- All 36 operations validate against the composed backend schema (PRD-002 round 2 added `issueGuestCartId` and `mergeGuestCart`; round 3 added `unsubscribeNewsletter`; PRD-003 FR-0.5 added `customerRequestPasswordReset` and `customerResetPassword` for `/forgot-password` and `/reset-password`). The contract is `../../zcom-backend/docs/architecture/storefront-api-contract.md`.
- **Tenant by host, through the middleware proxy (PRD-002 R2-C1):** the browser calls same-origin `/v1/graphql`; `src/middleware.js` rewrites it to `${API_GATEWAY_URL}/v1/graphql` and sets the edge headers from `lib/edge-headers.js` (strips client `x-zcom-*`, `x-tenant-domain` and `x-forwarded-host` (VSEC-4) and the shopper's `Origin`/`Referer` (`BROWSER_ONLY_HEADERS`, PRD-007 FR-8.2), then adds `x-zcom-client-ip`, `x-tenant-domain` and `x-zcom-edge-secret`). The gateway accepts the tenant only with the edge secret, so `EDGE_SHARED_SECRET` is required in production (PRD-007 FR-8.3). The client IP (VSEC-3, `getClientIp`) is `x-vercel-forwarded-for` only when `VERCEL` is set, else `request.ip`, else the **right-most** `x-forwarded-for` hop; the first hop and `x-real-ip` are client-controlled and never used. In production a missing `NEXT_PUBLIC_TENANT_DOMAIN` makes the proxy fail closed with a 500 (never an untenanted request); in dev it falls back to `localhost:3000`. SSR calls carry no `x-zcom-client-ip` (open design decision, §5). The `next.config.mjs` rewrite is gone (a config rewrite can't set request headers). Server components and the SSR pass of client components call `${API_GATEWAY_URL}/v1/graphql` directly with `x-tenant-domain` / `x-forwarded-host` = `NEXT_PUBLIC_TENANT_DOMAIN` plus the edge secret. A production build fails without `API_GATEWAY_URL` and `NEXT_PUBLIC_TENANT_DOMAIN`.
- **Newsletter unsubscribe (PRD-002 VCON-1):** `/unsubscribe` (`app/unsubscribe/page.jsx`, `noindex,nofollow`, + `unsubscribe-client.jsx`) is the target of the link the backend puts in campaign emails (`https://<tenant domain>/unsubscribe?email=…&token=…`, signed with `NEWSLETTER_TOKEN_SECRET`). It reads `email` and `token` once, removes them from the address bar (`history.replaceState`), and calls `unsubscribeNewsletter(email, token)`. The server answers uniformly, so every server answer shows the same neutral message; only a network failure offers a retry. The backend builds the link from the tenant's **configured domain**, so that domain must serve this storefront or redirect keeping the query string (FIN-3; the owner checks it per tenant).
- **Checkout requires login** (the backend checkout operations are customer-only). The guest cart id is server-issued (`issueGuestCartId`, R2-C2) and the guest bag is moved at login with one `mergeGuestCart` call (R2-C3).
- **Backend gaps shown as such:** no public stock level or badge name (no stock UI, no ribbons; "Unavailable / Notify me" appears when an option combination has no published variant or the backend answers `PRODUCT_UNAVAILABLE`); no password change while logged in (ChangePassword removed; a forgotten password is reset through `/forgot-password`, PRD-003 FR-0.5); no product lookup by id list (wishlist cards load each product; cart and order lines link to `/products/<id>`, which redirects to the slug); lookbook documents removed.
- Nothing has been tested in a browser or end to end against a running backend or any payment sandbox yet.

## 2. Directory map (`src/`)

```
app/                 layout.jsx (fonts, GTM/GA/Meta Pixel, metadataBase), providers.jsx (Apollo provider, GSAP registration),
                     error.jsx, not-found.jsx, page.jsx, products/, products/[slug]/ (generateMetadata), [...categories]/,
                     account/{order/[id],settings,wishlist}, checkout/[id] (checkout-client.jsx), checkout/thank-you,
                     checkout/payment-failed, checkout/payment-return (PRD-011: verifies a redirect / form-post payment),
                     api/payments/return (route handler: PayU POST / Cashfree redirect → 303 to payment-return),
                     login, unsubscribe (VCON-1, noindex), about, contact, legal pages
                     Pattern: server page.jsx (data + metadata) → *-client.jsx ('use client') → loading.jsx beside each route
middleware.js        /v1/graphql proxy to API_GATEWAY_URL with edge headers (R2-C1), and route guard: /account/* and /checkout/*
                     (except thank-you, payment-failed) need a session cookie → /login?next=…
lib/apollo-client-rsc.js   registerApolloClient → SERVER components (absolute gateway URL + tenant headers + edge secret)
lib/apollo-wrapper.js      ApolloNextAppProvider → CLIENT components: error → tenant → auth → http links (SSR pass adds the edge secret)
lib/edge-headers.js        SERVER ONLY: EDGE_SHARED_SECRET, client IP, proxy headers (keep in sync with deveshe edge-headers.server.js)
lib/fpixel.js        Meta Pixel helpers
graphql/             queries/*.gql.jsx, mutations/*.mutation.jsx, index.jsx barrel
store/               zustand: auth-store (persisted "user-data" v1: logged-in hint + customer id only, no profile or tokens), cart-store, product-store,
                     category-store, sizeguide-store
context/AuthContext.jsx    completeLogin (token, profile, mergeGuestCart), profile reload after a refresh, logout (customerLogout + clear everything)
hooks/               useVisitor (server-issued guest id: issueGuestCartId, runWithGuestId retries once on INVALID_GUEST_ID;
                     compare-and-clear, so a late failure never clears a newer id, VBUG-6),
                     useWishlist (getWishlist / toggleWishlist)
utils/               tokenManager.js (in-memory access token, single-flight refresh), errors.js (error → message), env.js (site/env
                     constants), redirect.js (safe ?next=), pending-order.js (unpaid order per cart + details fingerprint, sessionStorage),
                     sanitize-html.js, json-ld.js, analytics.js (GA4 e-commerce events), analytics-events.js (PRD-013 event layer),
                     ga-attribution.js (PRD-012), payment-checkout.js (PRD-011), Constant.jsx, Util.jsx
styles/allCssImport.css    @imports every CSS file; globals.css has hand-written utility classes (no Tailwind)
components/common/   LenisScroll.jsx (sets window.lenis), FacebookPixel.jsx, LazyLottie.jsx, Header/MobileHeader/Footer, …
```

## 3. Rules

- **App Router conventions.**
  - A server `page.jsx` fetches data with the RSC client and exports `metadata` or `generateMetadata` (with a per-route canonical). Interactivity goes into a sibling `*-client.jsx` with `'use client'`. Add a `loading.jsx` for new routes.
  - Never import `next/router` (use `next/navigation`). Don't use Pages Router APIs.
  - Call `notFound()` only for a null result or `NOT_FOUND`; other errors go to `app/error.jsx`.
- **Caching.** Catalog pages use `export const revalidate = 300`. Keep account, cart and checkout dynamic, and never cache per-user data.
- **Data.**
  - Server components use `getClient()` from `apollo-client-rsc.js`; client components use hooks under `ApolloNextAppProvider` (`lib/apollo-wrapper.js`). `context.skipAuth` sends a request anonymously.
  - **`EDGE_SHARED_SECRET` is server-only.** Import `lib/edge-headers.js` only from `middleware.js` and server code; in `apollo-wrapper.js` it's loaded under an inline `typeof window === "undefined"` check so the browser bundle drops it. Never prefix it with `NEXT_PUBLIC_`, and check `.next/static` for it after build changes.
  - Cart operations go through `useVisitor().runWithGuestId` (never invent a guest id client-side).
  - gql documents go in `graphql/`. No inline `gql`.
  - Show errors with `utils/errors.js` (branches on `extensions.reason` / `code`).
  - Site URL, support email and analytics IDs come from `utils/env.js` (env with the current Nahara defaults).
- **Auth and tokens.**
  - The access token lives **in memory only** (`utils/tokenManager.js`); its expiry comes from the JWT `exp`, and it refreshes 60 s before expiry with `customerRefreshToken` (single-flight, `credentials: "include"`). The refresh token is the HttpOnly `__Host-zc_cust_rt` cookie; never select or store `refreshToken`.
  - A refresh refused with UNAUTHENTICATED/FORBIDDEN (or a tenant/auth code) ends the session; network, rate-limit and internal errors do not (RBUG-19). `INVALID_AUTH_TOKEN` / `TENANT_MISMATCH` end the session (`INVALID_DB_TOKEN` was removed with the backend db-token, PRD-007); `TENANT_NOT_FOUND` shows one "store unavailable" toast (R2-C5).
  - The legacy JS `refresh_token` cookie is **left alone**, so the backend can read it once during its `LEGACY_REFRESH_COOKIE_UNTIL` window (deveshe deletes it instead).
  - Login and signup honour `?next=` only through `utils/redirect.js` (same-origin check with `new URL`, RSEC-6); without a valid `next` they go to `/`. The Apollo store is reset at login and cleared at logout.
  - The persisted auth store holds no PII (RSEC-11: `partialize` + v1 migration); the profile is reloaded from `getMyProfile` after a reload.
- **Money and checkout.** The server computes every price and total. Checkout (`app/checkout/[id]/checkout-client.jsx`): `createCheckoutSessionFromCart` (inline address, plus `attribution` from `utils/ga-attribution.js`: GA cookie ids and the visit's UTMs captured in `providers.jsx`, PRD-012) → poll `getCheckoutSession` (1 s, up to 30 s) until RESERVED → `completeCheckout` → `createPaymentSession({orderId})` → `openPaymentCheckout` (`utils/payment-checkout.js`, PRD-011: opens the provider-neutral `checkout`: Razorpay / Cashfree scripts on demand, Nimbbl via a dynamic `nimbbl_sonic` import, PayU form post) → `verifyPayment` (provider response + `paymentId`) → thank-you; PayU and Cashfree redirects return through `app/api/payments/return/route.js` (303) to `/checkout/payment-return`, which verifies with the shopper's session → which polls `myOrder` (3 s, up to 60 s). Purchase events (GA4, Pixel) fire only when PAID, once per order. The unpaid order id is kept in `sessionStorage` per cart with a fingerprint of the lines and coupon and, since VBUG-4, of the checkout details (email + shipping + billing address as sent) (`utils/pending-order.js`, RBUG-8); while it exists the bag is locked and a retry (also after a reload) pays that order, but only while both fingerprints match: a changed address or email creates a new order, and a legacy entry without the details fingerprint is never reused. `CHECKOUT_REPLACED`, `PAYMENT_NOT_CONFIGURED`, `MISSING_PROVIDER_ORDER` and `INVALID_EMAIL` have messages in `utils/errors.js` (VCON-2). The backend also reuses the active checkout session for an unchanged cart (R2-C8). The thank-you page ends on a "Payment not confirmed yet" state when polling ends without PAID (RBUG-20).
- **HTML and JSON-LD.** Render CMS HTML only through `utils/sanitize-html.js`, and JSON-LD only through `utils/json-ld.js`.
- **Styling.**
  - Use plain CSS imported via `styles/allCssImport.css`, plus the existing utility classes in `globals.css`. Match the page you're in.
  - Don't add Tailwind, CSS-in-JS, or a UI kit.
  - Fonts: `next/font` Inter plus `styles/fontSetting.css`.
  - Icons: `@remixicon/react`.
- **Animation.**
  - GSAP plugins are registered once in `providers.jsx`. Use `useGSAP` or `gsap.context` + `revert()` for cleanup; **never** `ScrollTrigger.killAll()` (SF-20).
  - Lenis is the single `LenisScroll` (`window.lenis`).
  - Lazy-load three/R3F (`dynamic`, `ssr: false`) and lottie (`LazyLottie`), and respect `prefers-reduced-motion` in new animations.
- **Images.** Use `next/image` with `sizes` on responsive and `fill` images. `remotePatterns` allows only `assets.nahara.co.in`; adding hosts needs approval (and a CSP update).
- **Headers.** `next.config.mjs` sets the CSP (GTM/GA, Meta, `*.nimbbl.tech` and Nimbbl helper hosts, the payment-app hosts in the `PAYMENT_*_ORIGINS` constants (Razorpay, Cashfree, PayU; PRD-011), the assets domain, `frame-ancestors 'none'`) and the security headers; `CSP_REPORT_ONLY=true` switches the CSP to report-only for rollout. `script-src` keeps `'unsafe-inline'` on purpose (SF-9 partial): a per-request nonce forces dynamic rendering, which ends ISR on catalog pages, and GTM custom-HTML tags need it.
- **Analytics.** GTM, GA and the Meta Pixel are set up in `layout.jsx` (the first PageView); `FacebookPixel` tracks client-side navigations only. Use `utils/analytics.js` and `lib/fpixel.js`, and keep e-commerce event names aligned with deveshe.
  - **Event layer (PRD-013 FR-4).** `utils/analytics-events.js` mirrors the backend vocabulary (`zcom-backend/packages/core/src/analytics/analytics-events.vocabulary.ts`: `StorefrontEventEnum`, `CtaEnum`, `CUSTOM_DIMENSION_PARAMETERS`, 100-char clip) by hand; keep both, and the deveshe twin `utils/analytics-events.util.js`, in sync. Send every non-e-commerce event through `trackEvent` or its typed helpers (`trackSelectItem`, `trackSelectVariant`, `trackCtaClick`, `trackGalleryInteraction`, `trackSizeGuideOpen`, `trackNotifyMe`, `trackCouponApply`/`trackCouponFailed`, `trackAddShippingInfo`, `trackAddPaymentInfo`, `trackCheckoutError`, `trackSearch`): it is a no-op without `gtag`, clips strings, drops empty values and never throws. **`item_id` is always the identifier the e-commerce items use here, the variant `_id`** (first variant when none is chosen): take it from `getAnalyticsItemId(product, variant)`, never from a product id or slug, so the backend can join the event to the product. `reason` is the GraphQL `extensions.reason`/`code`, never message text; no PII in any parameter. **To add an event:** add the name (and its parameters) to the backend vocabulary first, mirror it in both storefront files, add a typed helper, and call it where the UI does the thing; list it in the PRD-013 pointer. The wired events and their components are in `docs/prd/PRD-013-behaviour-analytics-depth.md` §2; there is no site search, so `search` isn't wired.

## 4. Commands

| Task | Command | Notes |
|---|---|---|
| Install | `npm ci` | |
| Dev | `npm run dev` | `next dev --turbopack`, http://localhost:3000 |
| Build | `npm run build` | The only real check; there are no tests. In production mode it fails without `NEXT_PUBLIC_TENANT_DOMAIN` and `API_GATEWAY_URL` |
| Lint | `npm run lint` | `eslint.config.mjs` exists, but **`eslint` isn't installed**, so this fails; say so rather than installing it unasked |
| Start | `npm run start` | |

Env var names (`.env.example`): `API_GATEWAY_URL` (server-only, required in production), `EDGE_SHARED_SECRET` (server-only, required in production; the gateway's edge secret, R2-C1, PRD-007 FR-8.3), `NEXT_PUBLIC_GRAPHQL_API_URL` (**leave unset**: the default `/v1/graphql` is what makes the cookie first-party), `NEXT_PUBLIC_TENANT_DOMAIN` (required in production, `nahara.co.in`), `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_FB_PIXEL_ID`, `CSP_REPORT_ONLY`. `NEXT_PUBLIC_BACKEND_ENDPOINT` and `NEXT_PUBLIC_NIMBBL_BASE_URL` are not read.

## 5. Known issues (don't fix unless asked)

- **Deployment prerequisites (owner):** set `API_GATEWAY_URL` and `NEXT_PUBLIC_TENANT_DOMAIN=nahara.co.in` in hosting, and **unset the absolute `NEXT_PUBLIC_GRAPHQL_API_URL`** (otherwise the browser calls cross-site and the cookie doesn't flow); set `EDGE_SHARED_SECRET` (the same value as EB); do **not** add the domain to the gateway `CORS_ORIGINS` (not needed since PRD-007 FR-8.2); consider `CSP_REPORT_ONLY=true` first, since GTM tags from unlisted hosts would be blocked.
- **Edge secret (R2-C1, required since PRD-007):** the code side is done (middleware proxy, RSC and SSR clients send `x-zcom-edge-secret`). The owner sets `EDGE_SHARED_SECRET` on this host and EB in the same deploy (without it the gateway resolves no tenant for this store), and confirms the client IP the host provides (`x-vercel-forwarded-for` on Vercel, else the right-most `x-forwarded-for` hop). Off Vercel the right-most hop is only trustworthy when the host's own proxy appends it; check the host (lead's final verification). Since PRD-002 round 3 the backend also limits logins to 30/min per client IP across all tenants (`AUTH_IP_RATE_LIMIT_PER_MIN`): the secret is what lets the gateway use each shopper's own IP for that bucket.
- **SSR client IP (open, design decision):** the middleware proxy sends the shopper's IP, but the SSR pass of client components (`lib/apollo-wrapper.js`) and the RSC client send only the tenant and the edge secret, no `x-zcom-client-ip`: a client component can't read `headers()`, and calling `headers()` in the root layout would end ISR. The gateway rate-limits those calls on the host's IP. A server-side customer-data path is the proposed fix.
- **Accepted (PRD-002 R3-D7):** SF-9 `'unsafe-inline'` and VPERF-4 (every browser API call passes through the Edge middleware, the price of the edge headers).
- **Shopper-visible round 2 changes:** guest bags from before R2-C2 (unsigned UUIDs) are dropped once at deploy; login without `next` lands on `/`; checkout stays locked while a pending order exists.
- **Backend gaps:** public badge name, storefront stock/availability, customer password change while logged in, product lookup by id list (see §1).
- **Shared logic is duplicated with `../deveshe-dreams`** under different file names (here `utils/errors.js`, `utils/sanitize-html.js`, `context/AuthContext.jsx`, `utils/tokenManager.js`; there `utils/api-error.util.js`, `utils/sanitize-html.util.js`, `lib/customer-session.service.js`, `utils/tokenManager.js`). Since RMAINT-7 the shared files carry a "Keep in sync with …" header naming their deveshe twin (also `utils/redirect.js`, `utils/pending-order.js`, `utils/json-ld.js`, `hooks/useVisitor.jsx`, `lib/edge-headers.js`). A shared package is ADR-level; until then fix both.
- ESLint isn't installed; no tests.
- **CSP:** `script-src 'unsafe-inline'` kept (see §3 Headers); roll out with `CSP_REPORT_ONLY=true` first.
- No payment app has run against its sandbox: Nimbbl's callback payload, Razorpay Checkout.js, the Cashfree JS SDK result shape and the PayU return are unverified (PRD-011 Q3).
- **Audit 2026-10-14:** `docs/audits/2026-10-14-storefront-audit.md` has the per-finding remediation status, including the round 2 re-audit findings.
- **PRD-014 Wave 0 (2026-10-25, `docs/prd/PRD-014-production-readiness-remediation.md`):** `/account/offers` removed (UX-06); `next` is `^15.5.28`. `npm audit` still reports `postcss` (high, bundled by next) and `next` (moderate), which clear only with next 16 (a major, owner decision). The payment-failed page has no "Retry payment" yet (`PendingOrder.findCartId` exists for it, as in deveshe-dreams).

## 6. Before you finish a change

- [ ] I read the contract doc and checked that every operation I touched exists in the backend.
- [ ] The server/client component split is correct, nothing per-user is cached, and no prices are sent from the client.
- [ ] I checked `../deveshe-dreams` for the same shared-logic issue.
- [ ] `npm run build` passes (or I reported why not), and I checked the change in the browser on desktop and mobile widths.
- [ ] Docs are updated (§0.2), and I wrote a "Docs impact" line.
