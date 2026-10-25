# rare-element storefront audit (2026-10-14)

| | |
|---|---|
| **Scope** | Next.js 15 App Router storefront (Nahara) |
| **Method** | Read-only code audit plus the machine-checked GraphQL contract. **[C]** confirmed in code, **[I]** inferred |
| **Cross-repo summary** | `../../zcom-backend/docs/audits/2026-10-14-platform-audit.md` (top 15, remediation plan) |
| **Status** | **Remediated by PRD-002 WS-F1 (2026-10-14)**; re-audited the same day (`../../zcom-backend/docs/audits/2026-10-14-re-audit.md`), and the re-audit findings for this repo were fixed in round 2 (R2-W6); round 3 status follows below. SF-9 and SF-21 partial; see "Remediation status" and "Round 2 status" |

## Findings

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| SF-1 | Critical | **26 of 33 operations fail schema validation**. Catalog, cart and order queries request fields the backend no longer has (Product price/ribbon, Variant `variantPrice`/stock, CartItem name/price/asset, `OrderResponse.data`), so category and product pages hit `notFound()` (cached 300 s), and cart and checkout fail | `src/graphql/queries/{products,cart,categories,order}.gql.jsx`; backend `catalog/.../product.schema.ts:78-92`, `commerce/.../cart.graphql.ts:14-20` | Migrate documents (PRD-001 phase 2 + contract PRD); field-level validation in CI |
| SF-3 | High | A shopper can be shown another shopper's cart. The backend `{}` filter (platform SEC-6) is reached when an expired token makes the caller anonymous and the drawer sends `{token}` without `guestId`, because there's no refresh link | `components/cart/CartDrawer.jsx:56-60`; backend `commerce/src/services/cart.service.ts:17-21` | Backend owner check; add the refresh/error link |
| SF-4 | High | Every page's canonical is `/`; product pages have no `generateMetadata`; JSON-LD uses `nahara.com` while the site is `nahara.co.in`, which risks de-indexing | `app/layout.jsx:20-22`; `utils/Constant.jsx:2` | Per-route canonical; product metadata; one domain constant |
| SF-5 | High | `NEXT_PUBLIC_TENANT_DOMAIN` is unset, so server/ISR requests resolve the tenant as `localhost:3000`, and the wrong or empty catalog is cached for 300 s | `lib/apollo-client-rsc.js:14`; `lib/apollo-wrapper.js:20` | Required variable; fail the build if missing |
| SF-8 | High | Order history broken: backend `getOrdersByFilters` is admin-only; the storefront selects `data` and picks the `userId` filter itself | `components/account/OrderList.jsx:16`; backend `order.controller.ts:16` | Customer-scoped `myOrders` (T1) |
| SF-9 | High | Account takeover from any XSS: access token in `localStorage`, refresh token in a JS-readable cookie; no CSP, `frame-ancestors` or `nosniff` (checkout can be clickjacked) | `utils/tokenManager.js:14,23`; `next.config.mjs` (no `headers()`) | PRD-001 phase 2 HttpOnly cookies; security headers |
| SF-10 | Medium | XSS sinks: JSON-LD `</script>` breakout from a product description; `htmlParser` on unsanitised descriptions | `components/seo/ProductSchema.jsx:36`; `ProductContant.jsx` | Escape `<` in JSON-LD; DOMPurify |
| SF-11 | Medium | Logout calls the missing `userLogout`, which always throws; the Apollo cache isn't cleared, so the previous user's data stays on shared devices | `context/AuthContext.jsx:19` | `customerLogout` + `clearStore()` in `finally` |
| SF-12 | Medium | Checkout: "Pay Now" re-enabled while Nimbbl is open (double `clientCheckout`); no-`redirectUrl` spins forever; failed verification shows nothing; Nimbbl opened with `token: undefined` | `app/checkout/[id]/checkout-client.jsx:101-111,143-145` | Disable until callback; explicit failure paths |
| SF-13 | Medium | Thank-you always says "Payment Successful"; Meta `Purchase` fires on every visit and refresh; contact link is a personal Gmail URL | `app/checkout/thank-you/page.jsx`; `PurchaseTracker.jsx:40-44` | Verify order state; fire once per order id |
| SF-14 | Medium | A transient backend error becomes a cached 404 (`notFound()` in `catch`); title `"undefined \| …"` with a duplicated suffix | `app/[...categories]/page.jsx:73-76`; `products/[slug]/product-data.jsx:45-47` | Distinguish not-found from errors; guard titles |
| SF-16 | Medium | `/account/*` has no guard at all (`proxy.jsx` is inert on Next 15) | `components/account/AccountLayout.jsx`; `src/proxy.jsx` | Rename to `middleware.js` with a real check; client guard |
| SF-17 | Medium | Lottie (~280 KB JSON) imported in the global footer; 0 of 53 `<Image>` set `sizes`; three/R3F imported statically | `components/common/Footer.jsx:5-10`; `ScrollVelocity` → `AboutImageEffect` | Dynamic imports; `sizes` |
| SF-18 | Medium | Guest cart lost at login (`visitorId` removed, no merge); Apollo cache not reset; errors branched on message text | `components/login/Login.jsx:44,65` | Merge carts server-side; `clearStore`; error codes |
| SF-20 | Low | Contact-form listeners and ScrollTriggers not cleaned up | `ContactForm.jsx` | Cleanup in effects |
| SF-21 | Low | Duplicated logic with deveshe (`tokenManager`, `AuthContext`, `useVisitor`, analytics); dead `lib/apolloClient.jsx` and `lib/withAuth.jsx`; ESLint not installed; framer-motion unused | — | Shared package (ADR); cleanup |
| SF-22 | Low [I] | Hard-coded GA, GTM and Pixel IDs; PageView may fire twice (layout script + `FacebookPixel`) | `app/layout.jsx` | Env-driven; one Pixel init |

**Checked and fine:**
- `registerApolloClient` is per request and carries no auth headers, so there's **no cross-request leakage** on the server.
- No ISR route reads cookies.
- No PII goes to pixels.
- `remotePatterns` is limited to `assets.nahara.co.in`.

## Remediation status (PRD-002 WS-F1, 2026-10-14)

Source: `zcom-backend/docs/prd/PRD-002-audit-remediation.md` §8 (WS-F1). To be confirmed by the re-audit; not tested in a browser or against the Nimbbl sandbox.

| ID | Status | How |
|---|---|---|
| SF-1 | Fixed | Every document rewritten; validator **31/31 valid** after round 1 (was 7 valid, 26 invalid), **33/33** after round 2, **34/34** after round 3 (`unsubscribeNewsletter`); errors mapped in `utils/errors.js`; dead lookbook documents, `lib/apolloClient.jsx`, `lib/withAuth.jsx`, `proxy.jsx`, `AuthCookies.jsx`, `useMutationHandler` and ChangePassword removed |
| SF-3 | Fixed (client) | Cart owner is the token or `guestId`; refresh link added |
| SF-4 | Fixed | No layout-wide canonical; per-route canonicals; product `generateMetadata`; one `NEXT_PUBLIC_SITE_URL` |
| SF-5 | Fixed | Production build fails without `NEXT_PUBLIC_TENANT_DOMAIN` / `API_GATEWAY_URL`; RSC sends `x-tenant-domain` and `x-forwarded-host` |
| SF-8 | Fixed | `myOrders` |
| SF-9 | Partial | In-memory access token, HttpOnly cookie refresh; CSP (report-only switch) and security headers. The re-audit noted `script-src 'unsafe-inline'`; round 2 kept it on purpose (a nonce forces dynamic rendering, ending ISR, and GTM custom-HTML tags need it), documented in `next.config.mjs` |
| SF-10 | Fixed | JSON-LD escaping in all 6 schema components; `utils/sanitize-html.js` |
| SF-11 | Fixed | `customerLogout`, then always clear token, store, localStorage and cache |
| SF-12 | Fixed | Final checkout flow; one callback; retry reuses the order; bag locked once an order exists |
| SF-13 | Fixed | Thank-you polls `myOrder`; purchase events once per order when PAID; Gmail compose links replaced with `mailto:` |
| SF-14 | Fixed | `notFound()` only on null/NOT_FOUND; `app/error.jsx`; 404 and id→slug redirect before Suspense; absolute SEO titles |
| SF-16 | Fixed | `src/middleware.js` route guard; validated `next` |
| SF-17 | Fixed | Lazy three/R3F and Lottie; `sizes` on ~25 images |
| SF-18 | Fixed | Errors by code; store reset at login; guest-cart merge |
| SF-20 | Fixed | ContactForm cleanup; MobileHeader no longer calls `ScrollTrigger.killAll()` |
| SF-21 | Partial | framer-motion removed and lockfile pruned; `js-cookie`/`cross-fetch` removed in round 2 (RMAINT-9); "Keep in sync" headers on the shared files (RMAINT-7). Open: shared package with deveshe (ADR), ESLint not installed (`uuid` removed in round 3) |
| SF-22 | Fixed | GA/GTM/Pixel IDs from env; no double PageView |

**Behaviour changes:** checkout requires login; no stock UI or ribbons; ChangePassword removed; lookbook removed.

## Round 2 status (PRD-002 R2-W6, 2026-10-14)

Findings from the platform re-audit (`../../zcom-backend/docs/audits/2026-10-14-re-audit.md`) that touch this repo. Fixed in the working tree; build OK, validator 33/33, no secret in `.next/static`, redirect and edge-header smoke tests pass. Not tested in a browser or against the Nimbbl sandbox; round 3 status follows below.

| ID | Status | How |
|---|---|---|
| ROPS-1 / R2-C1 | Fixed (code) | `src/middleware.js` proxies `/v1/graphql` (the `next.config.mjs` rewrite is gone) with `lib/edge-headers.js`: client `x-zcom-*` stripped, `x-zcom-client-ip`, `x-tenant-domain`, optional `x-zcom-edge-secret`. The RSC client and the SSR pass of `apollo-wrapper.js` send the secret. Owner: set `EDGE_SHARED_SECRET` with EB and CloudFront |
| RSEC-3 / R2-C2 | Fixed | `useVisitor` gets a server-signed id from `issueGuestCartId` lazily; old UUIDs dropped; `runWithGuestId` retries once on `INVALID_GUEST_ID` |
| RSEC-6 | Fixed | `utils/redirect.js` (same-origin check with `new URL`, rejects `\` and control characters); no `next` → `/` |
| RSEC-11 | Fixed | `auth-store` persists only the logged-in hint and customer id (`partialize`, v1 migration); profile reloaded from the server |
| RPERF-11 / RBUG-18 / R2-C3 | Fixed | One `mergeGuestCart(guestId)` call at login |
| RBUG-8 / R2-C8 | Fixed | `utils/pending-order.js`: unpaid order id per cart in `sessionStorage` with a lines + coupon fingerprint; checkout locked while it exists |
| RBUG-19 | Fixed | `tokenManager` ends the session only on auth or tenant codes; network, rate-limit and internal errors keep it |
| RBUG-20 | Fixed | Thank-you page ends on "Payment not confirmed yet" instead of a false success |
| RCON-3 / R2-C5 | Fixed | `INVALID_DB_TOKEN` ends the session with `INVALID_AUTH_TOKEN`/`TENANT_MISMATCH`; `TENANT_NOT_FOUND` shows one "store unavailable" toast |
| RCON-4 / R2-C7, RCON-6 | Fixed | `utils/errors.js` maps `CHECKOUT_EXPIRED`, `RESERVATION_RELEASED`, `INVALID_QTY`, `TOO_MANY_LINES`, `ORDER_CANCELLED`, `INVALID_GUEST_ID`, `TENANT_NOT_FOUND` |
| RMAINT-7 | Fixed | "Keep in sync with …" headers on the files duplicated with deveshe |
| RMAINT-9 | Fixed | `js-cookie` and `cross-fetch` removed; `uuid` removed in round 3 |
| SF-9 (`unsafe-inline`) | Partial | Kept on purpose (ISR, GTM); see the SF-9 row above |
| RMAINT-6, SF-2 | n/a | deveshe-only |

## Round 3 status (PRD-002 R3-C, 2026-10-14)

Verification findings (`../../zcom-backend/docs/audits/2026-10-14-re-audit.md` §7) that touch this repo. Fixed in the working tree; build OK (lists `/unsubscribe`), validator 34/34, no secret in `.next/static`. Not tested in a browser.

| ID | Status | How |
|---|---|---|
| VBUG-4 | Fixed | `utils/pending-order.js` adds a details fingerprint (email + shipping + billing); a change creates a new order; legacy entries are not reused |
| VBUG-6 | Fixed | `useVisitor` compares before clearing the guest id |
| VSEC-3 | Fixed | `getClientIp`: `x-vercel-forwarded-for` only on Vercel, then `request.ip`, then the right-most `x-forwarded-for` hop |
| VSEC-4 | Fixed | Client `x-tenant-domain`/`x-forwarded-host` stripped; production fails closed (500) without `NEXT_PUBLIC_TENANT_DOMAIN` |
| VCON-1 | Fixed | `/unsubscribe` page (`noindex`, query stripped, neutral copy) calls `unsubscribeNewsletter(email, token)` |
| VCON-2 | Fixed | `CHECKOUT_REPLACED`, `PAYMENT_NOT_CONFIGURED`, `MISSING_PROVIDER_ORDER`, `INVALID_EMAIL` mapped |
| SSR client IP | Open (design decision) | RSC and client-component SSR calls send no `x-zcom-client-ip` (`headers()` would end ISR) |
| VPERF-4, SF-9 | Accepted (R3-D7) | Edge middleware on every API call; `'unsafe-inline'` kept |
