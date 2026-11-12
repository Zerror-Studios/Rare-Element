# PRD-013 — Behaviour and product analytics depth: storefront event layer (pointer)

| Field | Value |
|---|---|
| Status | **Implemented** 2026-10-23 (this repo's part, FR-4); not browser-tested, not yet seen in GA4 Realtime |
| Source-of-truth PRD | [`../../../zcom-backend/docs/prd/PRD-013-behaviour-analytics-depth.md`](../../../zcom-backend/docs/prd/PRD-013-behaviour-analytics-depth.md) |
| Approved by / on | Anand (owner), 2026-10-23, "approve with recommendations" (every §9 recommendation accepted, nothing deferred) |
| Related | PRD-012 pointer (visit attribution) · `utils/analytics.js` (the four GA4 e-commerce events) |

This storefront's part of PRD-013 is **§4 D, the storefront event layer**: a fixed vocabulary of GA4 events and parameters that the analytics service reads back to fill `analytics_page_daily`, `analytics_product_daily` and `analytics_event_daily`. Nothing here touches the API client, the proxy, money or the contract (36/36 operations, unchanged).

## 1. The event layer

- **`src/utils/analytics-events.js`** mirrors the backend vocabulary `zcom-backend/packages/core/src/analytics/analytics-events.vocabulary.ts` by hand (`StorefrontEventEnum`, `CtaEnum`, `CUSTOM_DIMENSION_PARAMETERS`, `EVENT_PARAMETER_MAX_LENGTH = 100`), plus the storefront-only value sets `CheckoutStepEnum` (`address | shipping | payment`) and `GalleryActionEnum` (`thumbnail | prev | next | swipe | zoom | video_play`). Keep the three files in sync (the deveshe twin is `utils/analytics-events.util.js`).
- **`trackEvent(name, params)`** sends through `window.gtag` with `send_to: GA_TRACKING_ID`. It is a silent no-op on the server or when `gtag` isn't loaded, clips every string to 100 characters, drops `null`, `undefined` and empty values (also inside `items[]`), and never throws.
- **`item_id` convention (FR-2.2).** Every event uses the identifier `mapProductToGA4Item` uses for the e-commerce events in this storefront: the **variant `_id`**. When no variant is chosen yet (listing cards, the first `view_item`) it now falls back to the **first variant's `_id`** instead of the product id, so the backend can resolve every `item_id` through `product_variant`. `getAnalyticsItemId(product, variant)` is the one helper every call site uses.
- **No PII** in any parameter; `reason` is always the GraphQL `extensions.reason` (or `extensions.code`), never message text.
- The four GA4 e-commerce events stay in `utils/analytics.js` (`trackEcomEvent`): `view_item`, `add_to_cart`, `begin_checkout`, `purchase` (unchanged, apart from the `item_id` fallback).

## 2. Events wired (FR-4.1)

| Event | Where it fires | Parameters |
|---|---|---|
| `select_item` | `components/common/ProductCard.jsx` (card click, inside the caller's `<Link>`), with `product` + `listName` from `app/products/products-client.jsx` ("All products"), `app/[...categories]/category-client.jsx` (the category name), `components/product/ProductListGrid.jsx` (the grid title, "You may also like"), `components/home/FeaturedCollection.jsx` ("Featured collection"), `app/account/wishlist/wishlist-client.jsx` ("Wishlist") | `item_list_name`, `items[]` (`item_id`, `item_name`, `item_category`, `price`, `quantity`, `item_brand`, `item_variant`, `item_list_name`) |
| `select_variant` | `components/product/ProductContant.jsx` `handleVariants` (every colour/size choice) | `item_id`, `variant_id` (when a variant matches), `variant_label` (the chosen values joined with ` / `), `in_stock` (`"true"`/`"false"` only once every option is chosen; there is no stock level, so "in stock" = a published variant exists) |
| `cta_click` | `ProductContant.jsx`: main button (`add_to_cart` when every option is chosen, `buy_now` when it starts the option flow), `notify_me`, `size_guide`, `wishlist`; `components/common/ProductCard.jsx` heart (`wishlist`); `components/cart/WishlistPopup.jsx` "Save to wishlist" (`wishlist`); `components/cart/CartDrawer.jsx` "Proceed to Checkout" (`checkout`); `components/checkout/OrderSummary.jsx` coupon "Apply" (`apply_coupon`); "Pay Now" (`pay_now`) and place order (`place_order`) are sent by the kit's `useCheckout` since 2026-11-12 | `cta`, `page_path` (`window.location.pathname`), `item_id` (product pages, cards, cart lines) |
| `gallery_interaction` | `components/product/ProductImageGrid.jsx`: thumbnail hover that changes the slide (`thumbnail`), the arrows (`prev`, `next`), slide video play (`video_play`) | `item_id`, `action` |
| `size_guide_open` | `ProductContant.jsx` `handleOpenSizeGuide` | `item_id` |
| `notify_me` | `app/products/[slug]/product-client.jsx` after `requestBackInStock` succeeds | `item_id`, `variant_id` |
| `coupon_apply` / `coupon_failed` | `components/checkout/OrderSummary.jsx` after `applyCartPromotion` | `coupon`; `reason` (e.g. `PROMOTION_INVALID`, `PROMOTION_EXPIRED`, a code, or `UNKNOWN`) |
| `add_shipping_info` | The kit's `useCheckout` (kit 1.1.0, both checkout paths since 2026-11-12), once the checkout session is RESERVED (the store's own `trackAddShippingInfo` was removed) | the kit's: `currency`, `value` (server session total), `items[]` |
| `add_payment_info` | The kit's `useCheckout` right before the payment app opens (the store's own `trackAddPaymentInfo` was removed, 2026-11-12) | the kit's: `currency`, `value`, `payment_type` (the payment app), `items[]` |
| `checkout_error` | The kit's `useCheckout` for every reservation, place-order, payment-session and payment refusal on both checkout paths (since 2026-11-12); a closed payment window (`PAYMENT_DISMISSED`, with `provider`) is the kit's too since later on 2026-11-12 (the store's copy removed); the store adds only the redirect / form-post returns (`app/checkout/payment-return/payment-return-client.jsx`) → `step: payment` | `step`, `reason` (`provider` no longer sent by the store) |
| `search` | **not wired**: this storefront has no site search UI. `trackSearch(term, resultCount)` exists for the day it does. | `search_term`, `result_count` |

`step: shipping` never fires here: the single-page checkout has no shipping-method step (shipping is server-computed).

## 3. Not done / owner steps

- Register the ten custom dimensions (`cta`, `variant_id`, `variant_label`, `in_stock`, `action`, `reason`, `step`, `coupon`, `page_path`, `item_id`, event scope) in the GA4 property; the admin hub lists what is missing (FR-1.4).
- Confirm the events in GA4 Realtime once a build runs in a browser (PRD-013 §8 step 5).

## Implementation log

| Date | Entry |
|---|---|
| 2026-10-23 | Event layer `utils/analytics-events.js`; events wired as in §2; `mapProductToGA4Item` falls back to the first variant id. Production build passes; contract validation 36/36 (no GraphQL change). Docs: this pointer, docs index, changelog, CLAUDE.md, solution-architecture, `storefronts/CLAUDE.md`. |
