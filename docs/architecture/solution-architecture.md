# rare-element: Solution Architecture (Rare Element / Nahara storefront)

| | |
|---|---|
| **Status** | Living document. Verified against code on **2026-11-10** (on `@zcom/storefront-kit` 1.x, kit PRD-002 step 3; earlier: PRD-002 WS-F1 and round 2) |
| **Parent** | Workspace `../../ARCHITECTURE.md` · `../../storefronts/CLAUDE.md` |
| **API contract** | `../../zcom-backend/docs/architecture/storefront-api-contract.md` |
| **Role** | App Router storefront on the kit (RSC, ISR, host-based tenant, same-origin API through the kit's proxy, cookie session). New storefronts start from the kit's `/integrate-zcom` skill. Contract: 61/61 operations valid |

---

## 1. Purpose and context

This is the brand storefront where shoppers browse Rare Element / Nahara products, manage an account and wishlist, and check out with the store's payment app (Razorpay, Cashfree or PayU).

```mermaid
flowchart LR
    SH(["👤 Shopper"]) --> NX["rare-element<br/>Next.js 16 App Router<br/>on @zcom/storefront-kit (Vercel)"]
    NX -- "browser: same-origin /v1/graphql<br/>proxy.js = kit createZcomMiddleware → API_GATEWAY_URL<br/>+ x-zcom-client-ip · x-tenant-domain · x-zcom-edge-secret<br/>Bearer (memory) · cookie __Host-zc_cust_rt only" --> GW["ZCommerce gateway"]
    NX -- "RSC (kit zcomFetch) / SSR (kit ZcomSsrProvider):<br/>API_GATEWAY_URL/v1/graphql + edge headers (server-only)" --> GW
    NX -- "kit launchPayment (known hosts only)" --> NB["Payment app<br/>Razorpay · Cashfree · PayU"]
    NX -- "next/image" --> CDN[("assets.nahara.co.in")]
    NX -- "GTM · GA (analytics consent) · Meta Pixel · Google Ads (marketing consent)" --> AN["Analytics and ads"]
```

## 2. Rendering architecture

```mermaid
flowchart TB
    subgraph Server["Server (RSC)"]
        MW["proxy.js (kit createZcomMiddleware)<br/>/v1/graphql → gateway with edge headers · /.well-known/zcom-store<br/>suspended → branded 503 · /account/* → /login?next= without a session cookie (checkout open to guests, PRD-041)"]
        L["app/layout.jsx<br/>next/font Inter · kit CONSENT_DEFAULT_SCRIPT + ConsentBanner · providers · metadataBase"]
        P["route page.jsx<br/>serverQuery() (lib/server-query.js = kit zcomFetch, 300 s)<br/>metadata / generateMetadata (canonical per route)<br/>notFound() only on null / NOT_FOUND; else app/error.jsx"]
        LD["loading.jsx (per route; none at the root: the home skeleton is in the (home) group,<br/>so product pages answer a real 404 / 308)"]
    end
    subgraph Client["Client components ('use client')"]
        PR["app/providers.jsx<br/>kit ZcomSsrProvider (Apollo Client 4, session) + ZcomTags<br/>AuthProvider · GSAP plugin registration"]
        CC["*-client.jsx<br/>interactions, cart, forms"]
        LS["LenisScroll (window.lenis)"]
        ZS["zustand stores<br/>auth · cart · product · category · sizeguide"]
    end
    L --> PR
    P -- "props: server data" --> CC
    PR --> CC
    CC --> ZS
```

### Route map and caching

| Route | Server data | Caching |
|---|---|---|
| `/` | Home collections | `revalidate = 300` (ISR) |
| `/products` | Product list | ISR 300 |
| `/products/[slug]` | Product detail, `generateMetadata` (seo, Open Graph, Twitter), Product JSON-LD (offers; `availability` from `Product.availability` when the store's stock signal is on, PRD-020 FR-14), latest 10 approved reviews (`getReviews`, PRD-014 FR-2.8); an id permanently redirects to the slug | ISR 300 |
| `/search?q=` | Product search, `filters.search` on `getClientSideProducts` (client, PRD-014 FR-2.8) | Dynamic, `noindex, follow` |
| `/sitemap.xml`, `/robots.txt` | `app/sitemap.js` (static pages, categories, ≤ 1000 published products) and `app/robots.js` (sitemap URL from `NEXT_PUBLIC_SITE_URL`), PRD-014 FR-2.8 | Sitemap revalidated hourly; robots static |
| `/[...categories]` | Category listing, `generateMetadata`; an unknown path answers a real 404 (no `loading.jsx` here) | ISR 300 |
| `/lookbook`, `/lookbook/[slug]` | Backend lookbooks through the kit (`getLookbooks`, `getLookbook`; PRD-027 D10): cover grid, then hero, featured products and one look section per look; an old slug → 308, unknown → 404; in the sitemap | ISR 300 |
| `/account`, `/account/settings`, `/account/wishlist`, `/account/order/[id]` (`/account/offers` removed, PRD-014 UX-06; the order page shows `displayStatus`, tracking, Cancel and returns, PRD-015 FR-20) | Per user (client side) | Dynamic, never cached |
| `/checkout` | Signed in: the customer's own cart (no id in the URL; `/checkout/<id>` was removed 2026-11-12); signed out: the kit guest checkout on the guest bag, or "Sign in to check out" when accounts are REQUIRED (PRD-041) | Dynamic, public |
| `/orders/status/[token]` | PRD-041: the kit's `getOrderStatus(token)` on the server (shopper IP, never cached); unknown token → 404 with "Contact us"; outage → error with the contact | Dynamic, `noindex, nofollow`, `no-referrer`, canonical without the token |
| `/checkout/start` | PRD-034 FR-1.9: parses `?products=`, `getVariantAvailability` → `addItemToCart` per line, then checkout (guests too unless accounts are REQUIRED, PRD-041) or login (client) | Dynamic, noindex, public |
| `/checkout/thank-you` | Polls `myOrder` (client) | Static shell |
| `/checkout/payment-failed` | — | Static |
| `/unsubscribe` | Reads `?email=&token=` once, strips them from the URL, calls `unsubscribeNewsletter` (client, VCON-1) | Static shell, `noindex,nofollow` |
| `/back-in-stock/confirm` | Reads `?token=` once, strips it from the URL, calls `confirmBackInStock(token)` (client, CP-22): confirmed, expired-or-used, rate-limited (`extensions.reason`) and network states. A guest's notify-me alert sends nothing until this runs | Static shell, `noindex,nofollow`, robots-disallowed |
| `/forgot-password`, `/reset-password` | Password reset (PRD-003 FR-0.5): `customerRequestPasswordReset` (uniform answer), then the emailed link `/reset-password?token=…` is read once, stripped from the URL and sent with `customerResetPassword` (client) | Static shells, `noindex, nofollow` |
| `/login` | PRD-041: the kit's `useCodeSignIn` (email code, also the sign-up) or the password form | Static shell, `noindex, nofollow` |
| `/about`, `/contact`, legal pages | — | Static |

## 3. Data access

```mermaid
flowchart LR
    subgraph RSC
        SQ["serverQuery() — kit zcomFetch<br/>Nahara's own documents · revalidate 300 s<br/>throws on any error but NOT_FOUND"] -- "API_GATEWAY_URL/v1/graphql<br/>x-tenant-domain + x-zcom-edge-secret" --> GW["Gateway"]
    end
    subgraph Edge["Next proxy (server)"]
        MW["proxy.js — kit createZcomMiddleware<br/>strip client tenant headers · forward only the refresh cookie<br/>x-zcom-client-ip from Vercel's header only<br/>body cap (413) · no tenant domain → fails closed"]
    end
    subgraph Browser
        AW["kit ZcomSsrProvider<br/>Apollo Client 4: error → auth → http<br/>shared with Nahara's useQuery calls"] -- "/v1/graphql (same origin)<br/>Authorization: Bearer (memory)" --> MW
        TM["kit tokenManager<br/>single-flight customerRefreshToken<br/>60 s before exp · ready() on first load"] --> AW
    end
    MW -- "→ API_GATEWAY_URL/v1/graphql" --> GW
```

- **Edge headers (PRD-002 R2-C1):** the gateway trusts `x-tenant-domain` and `x-zcom-client-ip` only with a valid `x-zcom-edge-secret`. Only the kit reads `EDGE_SHARED_SECRET` (proxy, `zcomFetch`, the SSR pass of `ZcomSsrProvider`); it is required in production and staging.
- **Client IP:** the kit takes it only from a trusted source (Vercel's `x-vercel-forwarded-for` here); server reads send none (cached pages are shared), except the payment-link page (`getRequestClientIp`).
- **Error link (kit):** `TOKEN_EXPIRED` / `UNAUTHENTICATED` → refresh once, retry; `INVALID_AUTH_TOKEN` / `TENANT_MISMATCH` → the session ends (Nahara toasts it); `TENANT_NOT_FOUND` → one "store unavailable" toast (`onStoreUnavailable`); `TENANT_SUSPENDED` → reload at most once a minute. Network, 429 and 5xx never end a session. `context.skipAuth` sends a request anonymously.
- **Errors** are shown with `utils/errors.js` (Nahara's copy; it reads Apollo and kit errors through the kit).

**Operations in use:** 60 documents (Nahara's own, `src/graphql/`), all valid against the composed supergraph (`npm run validate:ops`, backend `validate:clients` 60/60, 2026-11-12; PRD-041 removed `CustomerSignup`), plus the kit's own documents for the flows it runs (session refresh and logout, checkout start, payment return, tag config, and since PRD-041 the guest checkout, the email-code sign-in, the store's checkout options and the order status page).

## 4. Session and guest identity

```mermaid
stateDiagram-v2
    [*] --> Guest: first visit
    Guest: guest id = server-signed id from issueGuestCartId<br/>(issued lazily at first add; kit guestCartStore via useVisitor) = cart guestId<br/>INVALID_GUEST_ID → drop, re-issue, retry once
    Guest --> Authenticated: kit useCodeSignIn (email code, also the sign-up, PRD-041) or password login (AuthContext)<br/>clear store · mergeGuestCart(guestId) · reset store · load profile
    Authenticated: access token in memory (kit tokenManager)<br/>refresh = HttpOnly __Host-zc_cust_rt<br/>auth-store persists hint + customer id, kept in step with the kit
    Authenticated --> Authenticated: customerRefreshToken (single-flight)
    Authenticated --> Guest: logout → customerLogout, then always clear token, store, localStorage, cache<br/>or refresh refused (UNAUTHENTICATED/FORBIDDEN)
```

The guest id is cleared after a successful `mergeGuestCart` (one idempotent, server-re-priced call, R2-C3), or when the server rejects it; on any other failure it is kept and the shopper is warned ("Some items from your bag could not be added"). The profile isn't persisted (RSEC-11); after a reload it's fetched again with `getMyProfile`. On the first visit after the move to the kit, the old `user-data` hint, `visitorId`, `zc_consent` and click ids are moved to the kit's keys once (`migrateLegacyStorage`), and old token keys are removed. The legacy `refresh_token` cookie isn't forwarded (kit PRD-002 D10).

## 5. Checkout flow

Both paths run on the kit's `useCheckout()` (kit 1.1.0): the signed-in `CustomerCheckout` with `start` → `pay` (since 2026-11-12, PRD-041 pointer log), the guest with `startGuest` → `pay` (§5a). Both follow one flow (owner, 2026-11-12, as Deveshe Dreams): "Continue to payment" reserves and shows the server total, "Pay now" is enabled only while the session is reserved for exactly the bag, coupon and details on screen (`isReservedFor`; otherwise disabled with "Continue to payment to see your final total"), and a closed window gives "Pay again".

```mermaid
sequenceDiagram
    autonumber
    actor S as Shopper (signed in)
    participant C as CustomerCheckout (checkout-client.jsx)
    participant K as kit useCheckout
    participant GW as Gateway
    participant NB as Payment app
    participant OS as status page / thank-you

    S->>C: fill the form or pick a saved address (zod CheckoutSchema)
    S->>C: "Continue to payment"
    C->>K: start({cartId, lines, email, shippingAddress, billingAddress}) (utils/checkout-kit.js)
    Note over K: same bag + details as the kept unpaid order (PendingOrderStore, this tab, 2 h) → reuse it, no new session
    K->>GW: createCheckoutSessionFromCart (+ attribution, consent) → poll getCheckoutSession until RESERVED
    Note over C: server total shown in the summary · FAILED / EXPIRED → toast, bag re-read, SHIPPING_UNAVAILABLE focuses the address
    S->>C: "Pay now" (enabled only while reserved for these exact details)
    C->>K: pay()
    K->>GW: completeCheckout → orderId (₹0 → already PAID, COM-08) · kept as the unpaid order
    K->>GW: createPaymentSession({orderId})
    K->>NB: launchPayment (SDK window, redirect or form post; known hosts only)
    NB-->>K: callback → verifyPayment → myOrder until PAID (sends the ads purchase in this tab)
    K-->>C: paid / unconfirmed / dismissed / failed
    C->>OS: paid → orderStatusPath(statusToken), else thank-you?orderId · dismissed → "Pay again" (retryPayment; the kit sends checkout_error) · failed with the kept order → payment-failed (retryPayment)
    Note over OS: thank-you polls myOrder 3 s up to 60 s; PAID → PurchaseTracker ads purchase (deduplicated per order by the kit); GA4 purchase from the backend; ends unpaid → "Payment not confirmed yet" (RBUG-20)
```

The client **never sends prices**: `addItemToCart` takes `{productId, variantId, qty}` plus `guestId`, and the payable total comes from the session pricing. The kit's fingerprint covers the cart id, lines, email and both addresses but not the bag's own coupon (no `promotionCode` is sent), so the store clears `PendingOrderStore` on any bag or coupon change and drops a kept order of another bag or coupon on load (`isKeptOrderStale`); a changed email or address places a new order (VBUG-4) and the backend cancels the old one (PRD-015 FR-14). The bag is locked only while the checkout is busy. The backend separately reuses an unchanged cart's active checkout session (R2-C8). Reservation reasons `CHECKOUT_EXPIRED` and `RESERVATION_RELEASED` map to "reservation expired" (R2-C7); `CHECKOUT_REPLACED`, `PAYMENT_NOT_CONFIGURED`, `MISSING_PROVIDER_ORDER` and `INVALID_EMAIL` have their own messages (VCON-2). **Analytics:** the kit sends `begin_checkout`, `add_shipping_info`, `add_payment_info`, `checkout_error` and the place-order / pay-now `cta_click`; including a closed payment window's `PAYMENT_DISMISSED` (with `provider`); the store sends only the ads begin checkout, once per page load on both paths (`hooks/useAdsBeginCheckout.jsx`).

### 5a. Guest checkout and the order status page (backend PRD-041 FR-17)

```mermaid
sequenceDiagram
    autonumber
    actor S as Shopper (signed out)
    participant P as checkout-client.jsx
    participant G as GuestCheckout.jsx (kit useCheckout)
    participant GW as Gateway
    participant NB as Payment app
    participant OS as /orders/status/[token]

    P->>GW: kit useSession + useStoreCheckoutOptions
    Note over P: customer → CustomerCheckout (above) · accounts REQUIRED → "Sign in to check out" · OPTIONAL → guest
    S->>G: Contact (email, phone, names, news box) · Delivery · billing (zod GuestCheckoutSchema)
    G->>GW: "Continue to payment" → kit startGuest → createGuestCheckoutSession (guestId, contact.acceptsMarketing) → poll until RESERVED
    Note over G: server total shown; a changed bag, coupon, contact, news box or address disables "Pay now" until "Continue" again
    G->>GW: "Pay now" → kit pay → completeGuestCheckout → createPaymentSession(guestToken)
    G->>NB: kit launchPayment
    NB-->>G: callback → kit verifyPayment(guestToken) → orderStatus(token) until PAID (kit sends the ads purchase)
    G->>OS: paid → orderStatusPath(statusToken) (else thank-you) · failed with a placed order → payment-failed (kit retryPayment)
    OS->>GW: server getOrderStatus(token) (never cached, shopper IP) → view, or 404 "Contact us"
```

The guest checkout token lives only in the kit (`GuestCheckoutStore`, `sessionStorage`, this tab). Redirect payment apps come back through `/checkout/payment-return` (kit `usePaymentReturn`), which goes to the status page whenever the kit has a status token. `/login` is the kit's `useCodeSignIn` (email → 6-digit code; the sign-up too), with "Sign in with password instead"; "Already have an account? Sign in" at checkout returns to `/checkout`, where the signed-in checkout opens the bag merged at sign-in. Account › Orders › an order links "View order status" (`useMyOrderStatusToken`).

## 6. Presentation layer

| Concern | Implementation |
|---|---|
| Styling | Plain CSS: `styles/allCssImport.css` `@import`s every sheet, and `globals.css` holds hand-written utility classes. No Tailwind or CSS-in-JS |
| Fonts | `next/font` Inter + `styles/fontSetting.css` |
| Motion | GSAP 3.13 (ScrollTrigger, CustomEase) registered once in `providers.jsx`, scoped cleanup (`gsap.context`); `lenis` smooth scroll; lottie via `LazyLottie` (visible only, JSON from `/public`); three/R3F via `dynamic(..., {ssr:false})` |
| Icons | `@remixicon/react` |
| Images | `next/image` with `sizes`; `remotePatterns` allows `assets.nahara.co.in` and the platform media CDN (`media.zerrorstudios.com`, `media-uat.zerrorstudios.com`, PRD-039); avif/webp; 1-year cache TTL |
| SEO | `metadataBase` from `NEXT_PUBLIC_SITE_URL`; per-route canonicals; `generateMetadata` on categories and products; JSON-LD schema components serialised with `utils/json-ld.js` |
| CMS HTML | `utils/sanitize-html.js` (allowlist over `html-react-parser`'s `htmlToDOM`) |
| Security headers | The kit's `buildSecurityHeaders` (payment apps, GA4/GTM, Meta and Google Ads, platform media CDN and S3 uploads, `frame-ancestors 'none'`, HSTS in production) plus `assets.nahara.co.in`; report-only with `CSP_REPORT_ONLY=true` |
| Analytics | Consent first (PRD-014 FR-1.9, D10): the kit's `CONSENT_DEFAULT_SCRIPT` (denied, then the stored choice); `ConsentBanner` saves through the kit's `updateConsent`; the kit's `ZcomTags` loads GTM + GA4 with analytics consent and the Meta Pixel + Google Ads with ads ("marketing") consent, tag ids from `storefrontTrackingConfig` with the env fallback; GA4 events queue until GA4 loads and go to GA4 only; attribution only with analytics consent, click ids only with ads consent |

## 7. Deployment

```mermaid
flowchart LR
    SRC["src/"] --> NB["next build"] --> OUT[".next (RSC + ISR)"]
    OUT --> HOST["Node / edge host [Unverified]"]
    ENV["API_GATEWAY_URL (server-only)<br/>NEXT_PUBLIC_TENANT_DOMAIN<br/>(build fails without them in production)<br/>EDGE_SHARED_SECRET (server-only, optional)<br/>NEXT_PUBLIC_GRAPHQL_API_URL unset"] --> NB
    HOST -- "origin must be in backend CORS_ORIGINS<br/>registrable domain must be in db_configs.domain" --> GW["Gateway"]
```

## 8. Gaps

| Gap | Impact | Path |
|---|---|---|
| No badge name or password change | No merchant ribbons (stock badges come from PRD-020) | Backend T1 PRDs (contract doc §2) |
| Stock signal is off by default per store (PRD-020 D8) | `null` renders as before; the owner enables it per store after UAT | Owner, UAT on and off |
| Strict tenant mode (`EDGE_SHARED_SECRET`) | Code ready (middleware proxy, RSC and SSR clients send the secret); until the owner sets it, the gateway runs in legacy mode and the backend's per-IP login bucket sees every shopper as this host's IP | Owner sets it here, on EB and on the CloudFront origin header at the same moment, in the same deploy as backend round 3; confirm the host's client IP source |
| SSR calls send no `x-zcom-client-ip` | RSC and client-component SSR calls are rate-limited on the host's IP | Design decision (server-side customer-data path) |
| Every browser API call runs through the Edge middleware (VPERF-4) | Latency and cost per call | Accepted (R3-D7) |
| CSP keeps `script-src 'unsafe-inline'` | XSS defence relies on the sanitiser and JSON-LD escaping | Accepted (ISR, GTM); report-only rollout first |
| Shared logic duplicated with deveshe-dreams | Fixes must be made twice | ADR for a shared package |
| Not browser-tested since the move onto the kit (Next 16, library majors); no payment app run against a sandbox | Unknown runtime and visual issues | Kit `zcom-live-check` + a manual browser pass (owner), then a sandbox payment |
| ESLint not installed | Hygiene | T2 |

## PRD-020 stock signal and PRD-015 post-purchase (2026-10-26, not browser-tested)

- **Stock (FR-12, FR-14):** `utils/stock-signal.js` (twin of deveshe `utils/stock-signal.util.js`) maps the nullable `availability` / `availableQuantity` to states; `null` is today's behaviour everywhere. The PDP reads the ISR value, then `hooks/useVariantAvailability.jsx` (`getVariantAvailability`, ≤ 50 ids, never cached server-side) on mount and on a variant change; a failed read keeps the ISR value. Sold-out options are struck through (`aria-label="<value>, sold out"`, still selectable); a sold-out selection shows "Sold out" + "Notify me" (an email field for guests, no login); `LOW_STOCK` shows "Only N left" (opt-in count) or "Low stock". Listing cards show "Sold out" / "Low stock" ribbons from `Product.availability`; the store's `SHOW | SORT_LAST | HIDE` is applied by the server. The cart drawer re-reads on open: a sold-out line shows "Sold out" (Remove stays) and checkout is held with "Remove sold-out items to continue". JSON-LD `offers.availability` comes from the rollup (`utils/product-offers.js`). `select_variant.in_stock` uses the signal when non-null.
- **Post-purchase (FR-20):** `/account/order/[id]` shows the server's `displayStatus`, a tracking block (`shipment { courier awb trackingUrl tracking }`; https links only; the latest five scans), Cancel when `canCancel` (inline confirmation, `cancelMyOrder`), "Request a return" while `returnableItems` is non-empty (per-line steppers capped at `returnableQty`, reason, condition, return-by date, link to `/shipping-returns`; `createReturnRequest` with line ids) and the order's `returnRequests` with "Withdraw" on a REQUESTED one (`cancelMyReturnRequest`). Helpers in `utils/order-detail.js`; every refusal reason is mapped in `utils/errors.js` (also PRD-016 `STORE_ORDERS_PAUSED`).
- Tests: `test/stock-signal.test.mjs`, `test/order-detail.test.mjs`.
