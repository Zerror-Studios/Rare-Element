# KIT-PRD-002 — Move Deveshe Dreams and Nahara onto the kit (pointer to the kit's PRD-002)

| Field | Value |
|---|---|
| Status | **Approved** 2026-11-10 (owner) · step 3 (Nahara onto the kit) **implemented in the working tree** 2026-11-10, not committed or pushed |
| Source-of-truth PRD | `../../../../zcom-storefront-kit/docs/prd/PRD-002-storefronts-onto-the-kit.md` (the kit repo; it changes no backend contract, backend ADR-010) |
| Repos affected | zcom-storefront-kit · storefronts/rare-element (this repo) · storefronts/deveshe-dreams · zcom-backend (client manifests only) |

This repo keeps only Nahara's notes. Decisions D1–D10, the gap review and the requirements are in the source PRD.

## Nahara (step 3)

**Moved onto the kit (FR-4.1):**
- `src/middleware.js` → `src/proxy.js` (Next 16), the kit's `createZcomMiddleware`: proxy, store identity, branded 503 (`buildStoreUnavailableHtml`), login guard for `/account` and `/checkout` (the result pages and `/checkout/start` stay public).
- `lib/apollo-wrapper.js` + `utils/tokenManager.js` → the kit's `ZcomSsrProvider` (Apollo Client 4 shared with Nahara's own queries, SSR pass on the gateway) and session; `context/AuthContext.jsx` now signs in, signs up and out through the kit and keeps `useAuthStore` in step.
- `lib/apollo-client-rsc.js` → `lib/server-query.js` (the kit's `zcomFetch`, revalidate 300 s), keeping Nahara's documents so the pages read the same fields.
- Consent, tags and attribution (`utils/consent.js`, `utils/tracking-config.js`, `lib/tracking-config.js`, `lib/fpixel.js`, `FacebookPixel`, `utils/ga-attribution.js`, `utils/ad-click-ids.js`, `utils/ads-tracking.js`) → the kit's `CONSENT_DEFAULT_SCRIPT`, `ZcomTags`, `updateConsent`, `buildAttribution`, `buildCheckoutConsent` and ads functions; `utils/analytics.js` / `analytics-events.js` keep Nahara's item mapping and helpers on top of them.
- Payment launch (`utils/payment-checkout.js` on the kit's `launchPayment`), the payment-return page (the kit's `usePaymentReturn`), the provider return route (the kit's `paymentReturnHandler`), the payment-link return storage (the kit's `PaymentLinkTokenStore`), `/checkout/start` (the kit's `useCheckoutStart`), the guest cart id (`hooks/useVisitor.jsx` on the kit's `guestCartStore`), the fresh stock read (`useStockSignal`), stock, sort, redirect and JSON-LD helpers, the security headers (`buildSecurityHeaders`).
- Packages (D3, D7): Next 16.4.6, React 19.3.1, Apollo Client 4.3.8, graphql 17.1, rxjs 7.8, three 0.187, r3f 9.8, drei 10.7, gsap 3.15, swiper 14.4, html-react-parser 6.1, lottie-react 3.1, @hookform/resolvers 7.0, react-hook-form 7.91, zustand 5.1, lenis 1.3.27, react-toastify 11.2; `nimbbl_sonic` removed. `vercel.json` installs the kit with the shared `GITHUB_TOKEN`.

**Still Nahara's (by design):** the checkout page's own flow and pending-order store (per cart, "Retry payment"), the sanitiser (renders to React, no jsdom), the back-in-stock confirm page (retry), the consent banner UI, error copy, labels and SEO schema components.

**Checks (2026-11-10):** `npm run build` (60/60 tests, all 27 pages, Next 16 + Turbopack); backend `validate:clients` 61/61 operations. **Not run yet:** the kit's `zcom-live-check` against a running backend and the manual browser pass (FR-6.2): owner. Library majors (Swiper 14, html-react-parser 6, lottie-react 3, three 0.187) built cleanly but need the visual check.
