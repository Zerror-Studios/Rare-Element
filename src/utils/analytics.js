/**
 * GA4 and ads e-commerce events (PRD-034 FR-1.3, PRD-002 FR-4.1).
 *
 * `trackEcomEvent` is the store's one e-commerce dispatcher: GA4 through the
 * kit's `trackEvent` (analytics consent, queued until GA4 loads), the Meta
 * Pixel and Google Ads through the kit's ads functions (ads consent; the ids
 * `ZcomTags` loaded). The GA4 `purchase` is sent by the backend from the
 * paid order (PRD-012), so the browser sends only the ads purchase, with the
 * order `_id` as Pixel `eventID` / Google Ads `transaction_id` (the
 * server-side events use the same id, so each network counts it once).
 */

import {
  trackAdsAddToCart,
  trackAdsBeginCheckout,
  trackAdsPurchase,
  trackAdsViewContent,
  trackEvent,
} from "@zcom/storefront-kit/core";

/**
 * Maps an internal product object to the standard GA4 items schema.
 * @param {Object} product - The internal product object.
 * @param {Object} variant - (Optional) Selected variant details.
 * @param {number} quantity - (Optional) Quantity.
 * @returns {Object} GA4 item object.
 */
const getVariantPrice = (product, variant) => {
  if (variant?.price) return Number(variant.price);
  const prices = (product?.variants || [])
    .map((v) => Number(v?.price))
    .filter((price) => price > 0);
  return prices.length ? Math.min(...prices) : 0;
};

export const mapProductToGA4Item = (product, variant = null, quantity = 1) => {
  if (!product) return null;

  return {
    // PRD-013 FR-2.2: the backend joins events through `product_variant`,
    // so a product without a chosen variant reports its first variant.
    item_id: variant?._id || product?.variants?.[0]?._id || product?._id,
    item_name: product.name,
    price: getVariantPrice(product, variant),
    quantity: Number(quantity),
    item_brand: "Nahara",
    item_category: product.categories?.[0]?.name || product.categoryIds?.[0] || "Jewellery",
    item_variant: variant?.title || ""
  };
};

/**
 * Maps a cart line or order line (server-priced snapshot) to a GA4 item.
 * @param {Object} line - CartItem / OrderItemSnapshot.
 * @returns {Object} GA4 item object.
 */
export const mapLineToGA4Item = (line) => ({
  item_id: line?.variantId || line?.productId,
  item_name: line?.name || "",
  price: Number(line?.finalPrice || line?.price || 0),
  quantity: Number(line?.qty || 1),
  item_brand: "Nahara",
});

/** Tracks one GA4 event (kit: analytics consent, GA4 only). */
export const trackGAEvent = (eventName, params = {}) => trackEvent(eventName, params);

const CURRENCY = "INR";

/**
 * Track common eCommerce events
 */
export const trackEcomEvent = {
  viewItem: (product, variant = null) => {
    const item = mapProductToGA4Item(product, variant);
    const value = getVariantPrice(product, variant);
    trackGAEvent("view_item", { currency: CURRENCY, value, items: [item] });
    if (item?.item_id) {
      trackAdsViewContent(null, { id: item.item_id, quantity: 1, price: value }, CURRENCY);
    }
  },

  addToCart: (product, variant = null, quantity = 1) => {
    const item = mapProductToGA4Item(product, variant, quantity);
    const unitPrice = getVariantPrice(product, variant);
    trackGAEvent("add_to_cart", {
      currency: CURRENCY,
      value: unitPrice * quantity,
      items: [item],
    });
    if (item?.item_id) {
      trackAdsAddToCart(null, { id: item.item_id, quantity, price: unitPrice }, CURRENCY);
    }
  },

  beginCheckout: (cartItems = [], totalValue = 0) => {
    const items = (cartItems || []).map(mapLineToGA4Item);
    trackGAEvent("begin_checkout", {
      currency: CURRENCY,
      value: Number(totalValue),
      items,
    });
    trackAdsBeginCheckout(
      null,
      items.map((item) => ({ id: item.item_id, quantity: item.quantity, price: item.price })),
      Number(totalValue),
      CURRENCY,
    );
  },

  /**
   * The ads purchase of a PAID order (once per order on this browser). The
   * GA4 purchase comes from the backend. `options` = `{ currency, customer }`;
   * the customer's email and phone are hashed by the kit, never sent plain.
   */
  purchase: (orderId, totalValue, items = [], _shipping = 0, _tax = 0, options = {}) =>
    trackAdsPurchase(null, {
      orderId,
      value: Number(totalValue),
      currency: options.currency || CURRENCY,
      items: (items || []).map(mapLineToGA4Item).map((item) => ({
        id: item.item_id,
        quantity: item.quantity,
        price: item.price,
      })),
      email: options.customer?.email ?? null,
      phone: options.customer?.phone ?? null,
      countryCode: options.customer?.countryCode ?? null,
    }),
};
