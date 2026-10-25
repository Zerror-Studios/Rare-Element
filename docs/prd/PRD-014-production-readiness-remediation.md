# PRD-014 — Production-readiness remediation: rare-element (pointer)

| Field | Value |
|---|---|
| Status | **In progress** — Wave 0 (W0-G) and Wave 1 (W1-STORE: FR-1.9, UX-30/31/34/36/37, payment retry; FU-STORE: ₹0 orders, `SHIPPING_UNAVAILABLE`; QA-12 middleware tests) code complete 2026-10-25, not committed; not browser-tested; Wave 1 exit PASS WITH NOTES 2026-10-25 (two verification passes, one fix round; audit Appendix I); **Wave 2 (W2-STORE, FR-2.8 + FE-22, plus the listing sort) implemented and verified 2026-10-26 (uncommitted); Wave 2 exit PASS WITH NOTES (two verification passes, one fix round; backend audit Appendix J)** · **Close-out implemented and verified 2026-10-26 (uncommitted); final re-audit (backend audit Appendix K): PRD-014 code complete pending owner acceptance of the residual register (backend PRD-014 §10 "Close-out")** |
| Source-of-truth PRD | [`../../../zcom-backend/docs/prd/PRD-014-production-readiness-remediation.md`](../../../zcom-backend/docs/prd/PRD-014-production-readiness-remediation.md) |
| Approved by / on | Workspace owner, 2026-10-25, "approve with recommendations" (backend PRD §8.1) |
| Audit | `zcom-backend/docs/audits/2026-10-25-production-readiness/E-clients-journeys.md` (UX-06), `A-security-tenancy.md` (SEC-12) |

This repo's Wave 0 share: FR-0.9 (UX-06) and FR-0.2 (SEC-12). Wave 1 (W1-STORE): FR-1.9 (UX-05, FE-24, UX-32 partial), UX-30, UX-31, UX-34, UX-36, UX-37 and "Retry payment" (§1a). FR-2.8 (search/sort/newsletter/SEO) is not started here.

## 1. What changed (Wave 0)

- **FR-0.9 / UX-06:** `/account/offers` is deleted (`app/account/offers/page.jsx` and `loading.jsx`, the hard-coded "Flat 90 % off" code that no tenant had, indexed). The route now 404s. The commented-out "Discounts & Offers" link in `components/account/AccountAside.jsx` is removed too. A real offers page can come back later on `getAllValidPromotions` (backend exists) under its own change.
- **FR-0.12 support (shared logic, RMAINT-7):** `utils/pending-order.js` gains `PendingOrder.findCartId(orderId)`, kept identical to deveshe-dreams (which uses it for "Retry payment" on its payment-failed page). Unused here today: rare's payment-failed page links to the order and back to shopping.
- **FR-0.2 / SEC-12:** `next` `^15.5.12` → **`^15.5.28`** (latest 15.x patch; fixes the rewrite request-smuggling advisory, the App Router segment-prefetch middleware bypass and every other 15.x advisory listed); `npm audit fix` (no `--force`) updated the lockfile (swiper 12.2.0, axios, form-data, nanoid, zod, sharp and others). No `eslint-config-next` in this repo. **Remaining:** 1 high (`postcss`, bundled by next) + 1 moderate (`next`), 0 critical; both clear only with **next 16** (a major; owner decision under backend PRD-014 Q14).

## 1a. What changed (Wave 1, W1-STORE, 2026-10-25)

- **FR-1.9 / UX-05 (D10, in-house, no dependency).** Google Consent Mode v2 defaults ("denied" for `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`) run in an inline head script before anything else, then the stored choice is applied. The banner (`components/common/ConsentBanner.jsx`: Accept all / Reject all / Manage with analytics and marketing; Escape closes only once a choice exists) stores `{ v: 1, analytics, marketing, savedAt }` in localStorage `zc_consent` and loads the tags only after consent (GTM + GA after "analytics", the Meta Pixel with its first PageView after "marketing"). The removed head/noscript tag code and the GTM preconnect mean **no request to Google or Meta before consent**. The footer "Cookie preferences" link reopens the banner; withdrawing sends a Consent Mode update and `fbq("consent", "revoke")`. Shared helper: `utils/consent.js` (keep in sync with the other storefront).
- **FR-1.9 / FE-24.** No hard-coded fallback GA/GTM/Pixel ids: an unset env id loads no tag (the owner sets the production ids in hosting).
- **FE-24.** `view_item` and `ViewContent` fire once per product view (`app/products/[slug]/product-client.jsx`, keyed on the product id), no longer on every option change.
- **UX-32 (partial).** Privacy policy `[NAHARA]` → "Nahara", plus one factual sentence that analytics/marketing cookies need consent and the choice is changed from "Cookie preferences". **Owner text needed:** `[Jurisdiction]` (`app/terms-of-service/page.jsx:62`); the returns copy contradicts itself (`app/shipping-returns/page.jsx:27` "no refund" vs `components/cart/CartDrawer.jsx` "easy returns").
- **UX-34.** `PASSWORD_MIN_LENGTH = 8` (`utils/Constant.jsx`) in signup, checkout and reset (signup was 6).
- **UX-30.** Hero: reduced motion sets the final state (opacity, clip-path, info bar, title, loader hidden) instead of returning early; a `prefers-reduced-motion` CSS fallback in `hero.css`.
- **UX-31.** Mobile header menu, cart and close icons, filter close and gallery arrows are `<button>`s with `aria-label`s (decorative images `alt=""`); the mobile menu, cart drawer and size guide are dialogs with `hooks/useDialogA11y.jsx` (focus in, Tab trapped, Escape, focus back, `inert` while closed). "Welcome Sunny" → the customer's first name.
- **UX-36.** `app/not-found.jsx` uses the site's status layout; `globals.css` gains the `block`, `font-bold`, `mt-1/2/4/8` and `opacity-50` utilities the status pages and the listing used without them (no Tailwind here).
- **UX-37.** Cart drawer: "Loading your bag…" and an error with "Try again" instead of "no items"; drawer adds go through `runWithGuestId` (one retry on `INVALID_GUEST_ID`).
- **Payment retry (as deveshe FR-0.12).** `/checkout/payment-failed` shows "Retry payment" when `PendingOrder.findCartId(orderId)` finds the kept order (back to that bag's checkout, which reuses the order while bag and details match), "Back to cart" and "Continue Shopping". No new operation.
- UX-39 has no storefront part (admin/console confirmations).

## 1b. What changed (Wave 2, W2-STORE, 2026-10-26)

- **Search (UX-28):** `/search?q=` (`src/app/search/`, `noindex`, `filters.search` on `getClientSideProducts`, `trackSearch`), search entry in `Header`/`MobileHeader`. **Sort not built:** the backend `sort: ClientProductSort` argument arrived after this workstream (W2-FU-BACKEND); a control is a follow-up.
- **Newsletter (UX-29):** footer `NewsletterForm.jsx` (`subscribeNewsletter`, neutral "Thanks" copy), checkout opt-in now sent and unticked by default, real email preference in account settings (`EmailPreference.jsx`, `updateMyProfile`).
- **Reviews (UX-35 follow-on):** approved reviews on the PDP (`ProductReviews.jsx`, `getReviews`); no form until `createReview` checks a purchase (owner decision).
- **SEO (UX-33):** SiteNavigation JSON-LD fixed, Product JSON-LD with `Offer`/`AggregateOffer` (`utils/product-offers.js`, no availability until PRD-020), `app/robots.js` + `app/sitemap.js` from `NEXT_PUBLIC_SITE_URL`, canonical and PDP meta; `test/seo-helpers.test.mjs` (4).
- **FE-22:** the wishlist loads its products in one `getClientSideProductsByIds` call (≤ 50). Deploy the backend first.

## 2. Contract

**Wave 2 (2026-10-26):** 40/40 operations valid (with variable shapes). New: `subscribeNewsletter`, `getReviews` (PDP), `getClientSideProductsByIds`; `getClientSideProducts` with `filters.search`. Backend source of truth: `zcom-backend` PRD-014 §5.4.

Wave 0–1:

Unchanged: 36/36 operations valid against the composed supergraph. `createOrder` is not used.

## 3. Verification (2026-10-25)

- `npm run build` passes (placeholder env; the ISR prerender logs the expected `fetch failed` without a gateway); `/account/offers` is no longer in the route table.
- Contract validator 36/36; grep `NAHARA90` → nothing in `src/`.
- Not run: a browser or a live gateway.

## 4. Implementation log

- 2026-10-25 · W0-G · FR-0.9 (UX-06), FR-0.2 (SEC-12), `PendingOrder.findCartId` (shared with deveshe-dreams).
- 2026-10-25 · W1-STORE · FR-1.9 consent banner + Consent Mode v2, no fallback tag ids, FE-24, UX-32 (partial), UX-30, UX-31, UX-34, UX-36, UX-37, payment-failed "Retry payment". Build green, contract 36/36; not browser-tested (no Playwright run of "no tag before consent" yet).
- 2026-10-25 · FU-STORE (Wave 1 follow-up) · ₹0 orders (COM-08): `COMPLETE_CHECKOUT` selects `pricing { total }`, and a total of 0 skips `createPaymentSession` (the backend already placed the order PAID) (`src/app/checkout/[id]/checkout-client.jsx`). `SHIPPING_UNAVAILABLE` has its own copy and focuses the address; `VARIANT_REQUIRED` on cart remove has fallback copy through `REMOVE_ITEM_OVERRIDES` in `components/checkout/OrderSummary.jsx` (`src/utils/errors.js`). Contract 36/36.
- 2026-10-25 · W1-CI / TEST-B (FR-1.6, FR-1.7 QA-12) · `npm run validate:ops` (operations and variable shapes, through the backend's `scripts/validate-clients`; the committed manifest is checked in the backend CodeBuild). `npm test` runs `test/middleware.test.mjs` with `node:test` and module hooks (no new dependency, Node ≥ 22.15): 11 tests over the `/v1/graphql` proxy (client tenant and `x-zcom-*` headers stripped, Origin/Referer dropped, edge headers added, fail closed without a tenant domain).
- 2026-10-25 · Wave 1 verification (lead) · Build passes; `npm test` 11/11; `validate:clients` 36/36, 0 failures. Open: owner legal text (UX-32), the tag ids in hosting, the Playwright "no tag before consent" proof; not run in a browser or against a live gateway.
- 2026-10-25 · Wave 1 fix round (re-audit W1V) · W1V-C-03: order attribution (`utils/ga-attribution.js`) is consent-gated (`startVisitAttribution`); without analytics consent nothing is captured and checkout sends `null`. W1V-C-05: `utils/consent.js` pushes `zc_consent_update` with `zcConsentAnalytics`/`zcConsentMarketing` before `gtm.js`; the GTM container must fire non-Google tags only on a marketing trigger (owner, UAT checklist). Second verification: `npm test` 15/15, build passes, `validate:clients` 36/36. Not run in a browser.
- 2026-10-26 · W2-STORE + Wave 2 verification (lead) · Items in §1b. Build passes; `npm test` 19/19; `validate:clients` 40/40, 0 failures. Open: the sort control, the review form (purchase check, owner), `NEXT_PUBLIC_SITE_URL` in hosting, Playwright `data-testid`s; not run in a browser or against a live gateway.
- 2026-10-26 · Wave 2 fix round (re-audit W2V) · W2V-C-02 wishlist chunks settle on their own (`Promise.allSettled`; loaded items plus an error, a message when every item is retired); W2V-C-04 site origin from `NEXT_PUBLIC_SITE_URL`, else the tenant domain, `noindex` when neither is set; W2V-C-05 sitemap slugs encoded per segment; listing sort on `/products` and category pages (`?sort=`, `utils/listing-sort.js`, `hooks/useListingSort.jsx`; read after mount, so a brief NEWEST flash). `npm test` 25/25, build passes, `validate:clients` 40/40.
- 2026-10-26 · Wave 2 exit · Second verification PASS WITH NOTES (backend audit Appendix J). Open (Info, W2V2-05): listing first-page refetches aren't sequenced (a quick second sort change can show the older response); removing the last wishlist item during a load can leave "Loading wishlist..." beside the empty state. `/search` has no sort control.
- 2026-10-26 · Close-out · W2V2-05 closed (listing responses sequenced, a stale one is dropped; no "Loading" beside the empty wishlist); Playwright test ids `pdp-option-choice`, `pdp-add-to-cart`, `product-card-link`, `cart-checkout`, `checkout-pay-now`; `prebuild` runs `npm test` (K-01; owner: Vercel build command `npm run build`, Node ≥ 22.15). Final verification: `npm test` 25/25, build passes, `validate:clients` 40/40. Final re-audit: backend audit Appendix K. Not run in a browser.
