# PRD-020: Public stock signal, storefront (pointer)

| Field | Value |
|---|---|
| Status | **Approved** 2026-10-26. Not started |
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
_Not started._
