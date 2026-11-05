# PRD-034 — Meta and Google ads (pointer)

| Field | Value |
|---|---|
| Status | **Phase 1 implemented** 2026-11-05 (this repo's FR-1.2–FR-1.4, FR-1.6, FR-1.9); not browser-tested or run against a live gateway, Meta Test Events or Google Tag Assistant |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-034-meta-and-google-ads.md`](../../../../zcom-backend/docs/prd/PRD-034-meta-and-google-ads.md) |
| Approved by / on | Anand (owner), 2026-11-05 ("Approve with recommendations", D1–D13; D8: ad signals denied until the shopper agrees, everywhere) |

## What this storefront does

- **Per-store tag ids (FR-1.2).** `app/layout.jsx` reads `storefrontTrackingConfig` once on the server (`lib/tracking-config.js`: anonymous RSC read, 3 s timeout, fetch revalidated every 5 minutes; any failure is null) and resolves the ids with `utils/tracking-config.js` `resolveTagIds`: **a backend value wins; a null one falls back** to `NEXT_PUBLIC_GA_MEASUREMENT_ID` / `NEXT_PUBLIC_FB_PIXEL_ID` (transition rule, so a store without the apps keeps today's tracking). GTM stays env-only (`NEXT_PUBLIC_GTM_ID`); Google Ads has no env fallback. The ids reach the browser as a `ConsentBanner` prop and are stored for the tag helpers while it renders (`setTagIds` / `getTagIds`); GA4 `send_to` now reads them at call time (`getGaTrackingId`). Because the fetch revalidates every 5 minutes, the formerly fully static pages (about, login, legal, result pages) are now ISR at 5 minutes too.
- **Consent (FR-1.3, D8).** `utils/consent.js` loads the Meta Pixel **and the Google Ads tag** (`gtag('config', 'AW-…', { allow_enhanced_conversions })`, gtag.js requested once for GA and Ads) only with "marketing"; Consent Mode v2 `ad_storage`, `ad_user_data`, `ad_personalization` follow "marketing" (default denied, unchanged), `analytics_storage` follows "analytics". Withdrawal: Consent Mode update to denied and `fbq('consent','revoke')`; every ads helper re-reads the consent at call time, so the next event is not sent.
- **One dispatcher (FR-1.3).** `trackEcomEvent` (`utils/analytics.js`) sends GA4 and, through `utils/ads-tracking.js`, Meta and Google Ads: view item → `ViewContent`; add to cart → `AddToCart` + the Ads `addToCartLabel` conversion when set; begin checkout → `InitiateCheckout` + `beginCheckoutLabel` when set; purchase → Meta `Purchase` with **`eventID` = order `_id`**, value, currency, `content_ids` / `contents` keyed by **variant id**, `content_type: 'product'`, and the Ads purchase conversion `send_to: AW-…/purchaseLabel` with `value`, `currency`, `transaction_id` = order `_id` (the GA4 purchase already used `_id`). The direct `fpixel.event` calls in the product page and `PurchaseTracker` are gone (the Pixel used product ids before; now variant ids, the feed id).
- **Enhanced conversions (FR-1.6).** Only when `googleAds.enhancedConversions` is true and "marketing" is granted: before the purchase conversion, `gtag('set','user_data',{ sha256_email_address, sha256_phone_number })`, hashed in the browser with SubtleCrypto after normalising (email trimmed, lower-case; phone E.164, `+91XXXXXXXXXX` for a 10-digit Indian number, the order address `countryCode` otherwise). Plain email or phone never reach a tag. Taken from the order's billing (else shipping) address.
- **Click ids and consent at checkout (FR-1.4).** `utils/ad-click-ids.js` (started in `providers.jsx`): `gclid`, `gbraid`, `wbraid`, `fbclid`, `ctwa_clid` from the landing URL go to sessionStorage `zc_ad_click_ids` for the session; with "marketing" they are persisted in localStorage for 90 days from the click (dropped on withdrawal and after expiry). `createCheckoutSessionFromCart` sends them, plus the `_fbp` / `_fbc` cookies, in `attribution` **only with "marketing"**, keeps the GA ids and UTMs under "analytics" as before, and **always** sends `consent: { analytics, marketing }` (both false before an answer). Values are clipped to 200 characters with control characters stripped.
- **User agent.** The `/v1/graphql` proxy already forwards the browser's own `user-agent` (only tenant, `x-zcom-*`, Origin and Referer are stripped); a middleware test now pins it.
- **Checkout URL (FR-1.9).** `/checkout/start?products=<variantId>:<qty>,…` (`app/checkout/start/`, dynamic, noindex; public in the middleware guard): `utils/checkout-start.js` validates (≤ 20 lines, qty 1–10, 24-hex ids, repeats merged and still ≤ 10, all or nothing), `getVariantAvailability` maps variants to products (published only), each line goes in through `addItemToCart` (signed-in, or `runWithGuestId` for guests; a refused line is skipped), then `router.replace` to `/checkout/<cartId>`, or `/login?next=…` for a guest (login merges the bag). Bad input or nothing addable: a message and links to `/products`.
- **CSP.** `GOOGLE_ADS_ORIGINS` (`www.googleadservices.com`, `googleads.g.doubleclick.net`, `td.doubleclick.net`, `www.google.co.in`) added to `script-src`, `img-src`, `connect-src`; `td.doubleclick.net` to `frame-src`. Meta hosts unchanged.
- **Tests.** `test/ads-tracking.test.mjs` (19): env fallback, consent gating (no Pixel, Ads tag, conversion or `user_data` without "marketing"; withdrawal), Purchase ids and variant ids, enhanced conversions on/off, E.164 and SHA-256, click-id capture, persistence and expiry, the checkout payload, the checkout URL parser; `test/middleware.test.mjs` +2 (user agent forwarded, `/checkout/start` public).

## Deviations and notes

- The source PRD's FR-1.2 says the storefronts drop the `NEXT_PUBLIC_*` tag names; per the transition rule they stay as the **fallback** until every store has its apps, and GTM stays env-only (the backend config has no GTM id).
- The first `ViewContent` on a landing product page is still lost when the Pixel isn't loaded yet (the banner applies consent after the page's first effect); pre-existing, as before this change.
- `/checkout/start` adds to the existing bag (it doesn't replace it).

## Owner steps

- Install the Meta Ads and Google Ads apps per store (backend), then check in Meta Test Events that the Pixel and Conversions API Purchase deduplicate for one order, and in Google Tag Assistant the purchase conversion with `transaction_id` (and enhanced conversions when ticked).
- Roll the CSP out with `CSP_REPORT_ONLY=true` first if the Ads tag requests other Google hosts.
- Deploy the backend (PRD-034 Phase 1) before this storefront.

## Implementation log

- 2026-11-05: Phase 1 storefront part implemented (files above). `npm test` 114/114 (was 93), `npm run build` OK (with `NEXT_PUBLIC_TENANT_DOMAIN` and a placeholder `API_GATEWAY_URL`), `validate:clients --all --write` rare-element 61/61, 0 failures. Not browser-tested.
