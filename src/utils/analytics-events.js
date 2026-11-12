/**
 * Storefront analytics events (PRD-013 FR-4)
 * Keep in sync with deveshe-dreams `utils/analytics-events.util.js` and
 * with the backend vocabulary
 * `zcom-backend/packages/core/src/analytics/analytics-events.vocabulary.ts`
 * (the analytics service reads those names and parameters to fill
 * `analytics_page_daily`, `analytics_product_daily` and
 * `analytics_event_daily`; a name that drifts is simply never counted).
 *
 * The GA4 e-commerce events `view_item` and `add_to_cart` stay in
 * `utils/analytics.js` (`trackEcomEvent`). The checkout's events
 * (`begin_checkout`, `add_shipping_info`, `add_payment_info`,
 * `checkout_error`, the place-order and pay-now `cta_click`) are sent by
 * the kit's `useCheckout` (kit 1.1.0) for both checkouts; the store adds
 * only `checkout_error` for a closed payment window and a failed payment
 * return. The GA4 `purchase` is sent by the backend (PRD-012). Everything
 * else goes through
 * `trackEvent`, which clips every string to `EVENT_PARAMETER_MAX_LENGTH`
 * and drops empty values (also inside `items[]`), then hands the event to
 * the kit (PRD-002): sent only with analytics consent, queued until GA4
 * has loaded, to GA4 only. It never throws.
 *
 * `item_id` is always the identifier `mapProductToGA4Item` uses for this
 * storefront (the variant id, falling back to the first variant), so the
 * backend can join every event to the same product (PRD-013 FR-2.2).
 * No parameter may carry PII (emails, names, phones, addresses).
 */

import { trackEvent as kitTrackEvent } from "@zcom/storefront-kit/core";
import { mapProductToGA4Item } from "@/utils/analytics";

// ─── Vocabulary (mirrors analytics-events.vocabulary.ts) ─────────────────

export const StorefrontEventEnum = {
  // GA4 standard e-commerce events the storefront already sends
  VIEW_ITEM: "view_item",
  ADD_TO_CART: "add_to_cart",
  BEGIN_CHECKOUT: "begin_checkout",
  PURCHASE: "purchase",
  // Standard events PRD-013 adds
  SELECT_ITEM: "select_item",
  ADD_SHIPPING_INFO: "add_shipping_info",
  ADD_PAYMENT_INFO: "add_payment_info",
  SEARCH: "search",
  // ZCOM events
  SELECT_VARIANT: "select_variant",
  CTA_CLICK: "cta_click",
  GALLERY_INTERACTION: "gallery_interaction",
  SIZE_GUIDE_OPEN: "size_guide_open",
  NOTIFY_ME: "notify_me",
  COUPON_APPLY: "coupon_apply",
  COUPON_FAILED: "coupon_failed",
  CHECKOUT_ERROR: "checkout_error",
  // PRD-027 FR-8: lookbook pages
  LOOKBOOK_VIEW: "lookbook_view",
  LOOKBOOK_HOTSPOT_CLICK: "lookbook_hotspot_click",
};

/** The `cta` parameter values of `cta_click`. */
export const CtaEnum = {
  ADD_TO_CART: "add_to_cart",
  BUY_NOW: "buy_now",
  NOTIFY_ME: "notify_me",
  SIZE_GUIDE: "size_guide",
  WISHLIST: "wishlist",
  APPLY_COUPON: "apply_coupon",
  CHECKOUT: "checkout",
  PLACE_ORDER: "place_order",
  PAY_NOW: "pay_now",
};

/** The `step` parameter values of `checkout_error`. */
export const CheckoutStepEnum = {
  ADDRESS: "address",
  SHIPPING: "shipping",
  PAYMENT: "payment",
};

/** The `action` parameter values of `gallery_interaction`. */
export const GalleryActionEnum = {
  THUMBNAIL: "thumbnail",
  PREV: "prev",
  NEXT: "next",
  SWIPE: "swipe",
  ZOOM: "zoom",
  VIDEO_PLAY: "video_play",
};

/** Event parameters the merchant registers as GA4 custom dimensions. */
export const CUSTOM_DIMENSION_PARAMETERS = [
  "cta",
  "variant_id",
  "variant_label",
  "in_stock",
  "action",
  "reason",
  "step",
  "coupon",
  "page_path",
  "item_id",
  // PRD-027 FR-8
  "lookbook_slug",
  "look_position",
];

/** Parameter values are clipped to this length before they reach GA4. */
export const EVENT_PARAMETER_MAX_LENGTH = 100;

// ─── Sanitising ───────────────────────────────────────────────────────────

const clipValue = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "string") {
    return value.slice(0, EVENT_PARAMETER_MAX_LENGTH);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.map(clipValue).filter((entry) => entry !== undefined);
  }
  if (typeof value === "object") return sanitizeParams(value);
  return undefined;
};

/** Clips strings, drops empty values; recurses into `items[]`. */
export const sanitizeParams = (params = {}) => {
  const clean = {};
  for (const [key, value] of Object.entries(params || {})) {
    const clipped = clipValue(value);
    if (clipped !== undefined) clean[key] = clipped;
  }
  return clean;
};

/** GA4 custom dimensions are strings: "true" / "false". */
const toFlag = (value) =>
  value === undefined || value === null ? undefined : value ? "true" : "false";

const currentPagePath = () =>
  typeof window === "undefined" ? undefined : window.location.pathname;

// ─── Core ─────────────────────────────────────────────────────────────────

/** Sends one GA4 event through the kit (consent, queue, GA4 only). */
export function trackEvent(name, params = {}) {
  if (!name) return;
  kitTrackEvent(name, sanitizeParams(params));
}

/** The `item_id` the e-commerce events send for this product (+ variant). */
export const getAnalyticsItemId = (product, variant = null) =>
  mapProductToGA4Item(product, variant)?.item_id;

// ─── Typed helpers ────────────────────────────────────────────────────────

/** A product card was clicked in a list (`select_item`). */
export const trackSelectItem = (product, listName, listId) => {
  const item = mapProductToGA4Item(product);
  if (!item) return;
  trackEvent(StorefrontEventEnum.SELECT_ITEM, {
    item_list_id: listId,
    item_list_name: listName,
    items: [{ ...item, item_list_id: listId, item_list_name: listName }],
  });
};

// ─── Lookbooks (PRD-027 FR-8, F10) ────────────────────────────────────────

/** GA4 `item_list_id` of a lookbook page (backend `lookbookItemListId`). */
export const lookbookItemListId = (slug) => `lookbook:${slug}`;

/** A lookbook page was viewed. */
export const trackLookbookView = (slug) =>
  trackEvent(StorefrontEventEnum.LOOKBOOK_VIEW, { lookbook_slug: slug });

/** A product dot on a look was opened; `position` is the look's position. */
export const trackLookbookHotspotClick = (slug, position, itemId) =>
  trackEvent(StorefrontEventEnum.LOOKBOOK_HOTSPOT_CLICK, {
    lookbook_slug: slug,
    look_position: position,
    item_id: itemId,
  });

/** A size, colour or other option was chosen on the product page. */
export const trackSelectVariant = ({
  itemId,
  variantId,
  variantLabel,
  inStock,
}) =>
  trackEvent(StorefrontEventEnum.SELECT_VARIANT, {
    item_id: itemId,
    variant_id: variantId,
    variant_label: variantLabel,
    in_stock: toFlag(inStock),
  });

/** A tracked button was clicked; `cta` is a `CtaEnum` value. */
export const trackCtaClick = (cta, { itemId, pagePath } = {}) =>
  trackEvent(StorefrontEventEnum.CTA_CLICK, {
    cta,
    page_path: pagePath || currentPagePath(),
    item_id: itemId,
  });

/** Gallery use on the product page; `action` is a `GalleryActionEnum`. */
export const trackGalleryInteraction = (itemId, action) =>
  trackEvent(StorefrontEventEnum.GALLERY_INTERACTION, {
    item_id: itemId,
    action,
  });

export const trackSizeGuideOpen = (itemId) =>
  trackEvent(StorefrontEventEnum.SIZE_GUIDE_OPEN, { item_id: itemId });

/** A back-in-stock request was accepted by the server. */
export const trackNotifyMe = (itemId, variantId) =>
  trackEvent(StorefrontEventEnum.NOTIFY_ME, {
    item_id: itemId,
    variant_id: variantId,
  });

export const trackCouponApply = (coupon) =>
  trackEvent(StorefrontEventEnum.COUPON_APPLY, { coupon });

/** `reason` is the GraphQL `extensions.reason` or code, never a message. */
export const trackCouponFailed = (coupon, reason) =>
  trackEvent(StorefrontEventEnum.COUPON_FAILED, { coupon, reason });

/**
 * A checkout or payment failure the shopper saw. `step` is a
 * `CheckoutStepEnum`, `reason` the `extensions.reason` / code, `provider`
 * the payment app when known.
 */
export const trackCheckoutError = (step, reason, provider) =>
  trackEvent(StorefrontEventEnum.CHECKOUT_ERROR, { step, reason, provider });

/** Site search submitted (no search UI exists yet; kept for parity). */
export const trackSearch = (term, resultCount) =>
  trackEvent(StorefrontEventEnum.SEARCH, {
    search_term: term,
    result_count:
      typeof resultCount === "number" ? resultCount : undefined,
  });
