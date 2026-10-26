# PRD-020: Public stock signal, storefront (pointer)

| Field | Value |
|---|---|
| Status | **Approved** 2026-10-26 · **Implemented** 2026-10-26 (FR-12, FR-14; working tree, not browser-tested) |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-020-public-stock-signal.md`](../../../../zcom-backend/docs/prd/PRD-020-public-stock-signal.md) |
| Approved by / on | Anand (owner), 2026-10-26: "please review and approve the six drafted follow-up PRDs" (every §8 recommendation accepted) |
| Rollout step | Backend §7.1 step 3 (FR-12, FR-14), after the backend ships with the signal off; checked per root `CLAUDE.md` §5.5 with the signal off and on |

Only this repo's notes are here; requirements, contract and decisions live in the backend PRD.

## This repo's part
- **`null` means today's behaviour, exactly.** `Variant.availability`, `Variant.availableQuantity` and `Product.availability` are nullable; no client flag is needed.
- **PDP:** `src/app/products/[slug]/product-client.jsx` and `src/components/product/ProductContant.jsx` (ISR `revalidate = 300`). Out-of-stock option chips struck through, still selectable, `aria-label="<value>, sold out"`; CTA "Notify me" (email field, no login needed) for `OUT_OF_STOCK`; "Only N left" (only when `availableQuantity` is set) or "Low stock" for `LOW_STOCK`. `getVariantAvailability` on mount and on variant change overrides the server value; while it is pending show the server value (no CTA spinner); if it fails keep the server value and never block add-to-cart.
- **Listings:** "Sold out" / "Low stock" text badges on listing cards (`components/common/ProductCard.jsx`) on `/products` and the category pages. The store's `SHOW | SORT_LAST | HIDE` is applied by the server; the client sends no availability filter unless the user picks one.
- **Cart:** on the cart drawer and cart page, call `getVariantAvailability` on open; an `OUT_OF_STOCK` line shows "Sold out" + Remove and checkout is disabled with "Remove sold-out items to continue". Checkout's `OUT_OF_STOCK` stays the authority.
- **SEO:** extend the existing `toProductOffers` in `src/utils/product-offers.js` (W2-STORE) with `availability` from `Product.availability` (`IN_STOCK`/`LOW_STOCK` → `https://schema.org/InStock`, `OUT_OF_STOCK` → `OutOfStock`, `null` → omitted), keeping the rare-element and deveshe twins in sync; `node:test` cases for the mapping.
- **Analytics:** `src/utils/analytics-events.js` (`in_stock`, today "the combination exists", `ProductContant.jsx`) takes the signal when non-null.

## Implementation log

**2026-10-26: FR-12 and FR-14 DONE in code** (working tree, not committed, not browser-tested; the backend is built in its working tree with the signal off for every store).

| Item | Status | Where |
|---|---|---|
| Helpers | DONE | `src/utils/stock-signal.js` (twin of deveshe `utils/stock-signal.util.js`): bucket → copy, schema.org, fresh-read merge (the fresh answer wins only for the ids it answered; `null` = no signal), option and cart-line states, analytics flag |
| Fresh read | DONE | `src/hooks/useVariantAvailability.jsx` + `GET_VARIANT_AVAILABILITY`: ≤ 50 distinct ids, `network-only`; keeps the last good answer, so a pending or failed read shows the ISR value and never blocks add to cart |
| PDP | DONE | `product-client.jsx` / `ProductContant.jsx`: read on mount and on a variant change; a choice whose variants (with the other selected options) are all `OUT_OF_STOCK` is struck through, still selectable, `aria-label="<value>, sold out"` (the chips are now `role="button"` with Enter/Space); a sold-out selection shows "Sold out" + "Notify me"; `LOW_STOCK` shows "Only N left" (only with `availableQuantity`) or "Low stock" (plain text, not live-announced) |
| Notify me without login | DONE | guests get an email field (labelled) and `requestBackInStock` is sent with that email (validated on the client, the server checks it too); logged-in shoppers still use their account |
| Listing | DONE | `components/common/ProductCard.jsx`: "Sold out" / "Low stock" ribbon from `Product.availability` (`GET_PRODUCTS`, `GET_PRODUCTS_BY_IDS`, the category's `products` select it); no client availability filter (the server applies `SHOW | SORT_LAST | HIDE`) |
| Cart drawer | DONE | `CartDrawer.jsx` / `CartItem.jsx`: fresh read on open (variant id, else product id); "Sold out" on the line (Remove stays, "+" disabled), "Only N left" when qty > the exposed count; "Proceed to Checkout" is held with "Remove sold-out items to continue" (`aria-disabled`, toast, drawer stays open). Rare has no separate cart page |
| Analytics | DONE | `select_variant.in_stock` from the signal when non-null (`toInStockFlag`), else today's "the combination exists" |
| SEO (FR-14) | DONE | `src/utils/product-offers.js` `toProductOffers(variants, url, availability)`; `ProductSchema.jsx` passes `Product.availability`; `null` omits it |
| Tests | DONE | `test/stock-signal.test.mjs` (null behaviour, copy, schema.org on `Offer` and `AggregateOffer`, fresh-read merge and id cap, option chips, cart lines) |

Contract: `getVariantAvailability` plus `availability` / `availableQuantity` fields; `validate:clients` 44/44. Limits: a bag with more than 50 distinct lines checks the first 50 only (the rest render as no signal). Open: the §7.1 step 5 browser check with the signal off and on (including `HIDE` and every sort), owner copy approval (§6 defaults used).

- 2026-10-26 · **CP-22** (child-PRD review, must-fix before any store enables the signal): a guest's `requestBackInStock` is now stored unconfirmed and the backend mails a `back_in_stock_confirm` link to `/back-in-stock/confirm?token=…`. This repo: after a guest taps Notify me the toast says to check the email to confirm (signed-in shoppers keep "You’ll be notified…"); new noindex page `src/app/back-in-stock/confirm/ (page.jsx + confirm-client.jsx)` reads the token once, removes it from the address bar, calls `confirmBackInStock(token)` through the one Apollo client and shows loading, confirmed, expired-or-used (false or any other server error), rate-limited and network states (retry on the last two); `RATE_LIMITED` is mapped by `extensions.reason` to neutral copy in the error helper (never the server text); `/back-in-stock/` is disallowed in robots so a script-running crawler doesn't confirm. Helpers in `src/utils/back-in-stock.js` (twin), tests in `test/back-in-stock.test.mjs` (9). `validate:clients` 45/45. Not browser-tested or run against a live gateway.
