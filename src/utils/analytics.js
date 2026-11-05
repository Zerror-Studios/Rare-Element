/**
 * Google Analytics 4 (GA4) Tracking Utility
 * Provides a standardized way to track events across the platform.
 *
 * PRD-034 FR-1.3: `trackEcomEvent` is the one e-commerce dispatcher. Each
 * event goes to GA4 here and to the Meta Pixel and Google Ads through
 * `utils/ads-tracking.js` (marketing consent only). The GA4 id comes from
 * `utils/tracking-config.js` (the store's backend config, env fallback).
 */

import { getGaTrackingId } from "@/utils/tracking-config";
import {
  trackAdsAddToCart,
  trackAdsBeginCheckout,
  trackAdsPurchase,
  trackAdsViewContent,
} from "@/utils/ads-tracking";

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

/**
 * Tracks a custom event in GA4.
 * @param {string} eventName - Standard or custom event name (e.g., 'view_item').
 * @param {Object} params - Event parameters.
 */
export const trackGAEvent = (eventName, params = {}) => {
  const gaId = getGaTrackingId();
  // No GA4 id: send nothing (an empty send_to would reach the Ads tag).
  if (!gaId) return;
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, {
      ...params,
      send_to: gaId
    });
  } else {
    console.warn(`GA4 event "${eventName}" suppressed (gtag not initialized).`, params);
  }
};

/**
 * Track common eCommerce events
 */
export const trackEcomEvent = {
  viewItem: (product, variant = null) => {
    const item = mapProductToGA4Item(product, variant);
    const value = getVariantPrice(product, variant);
    trackGAEvent("view_item", {
      currency: "INR",
      value,
      items: [item]
    });
    trackAdsViewContent({
      itemId: item?.item_id,
      name: product?.name,
      category: product?.categories?.[0]?.name,
      value,
      currency: "INR",
    });
  },

  addToCart: (product, variant = null, quantity = 1) => {
    const item = mapProductToGA4Item(product, variant, quantity);
    const value = getVariantPrice(product, variant) * quantity;
    trackGAEvent("add_to_cart", {
      currency: "INR",
      value,
      items: [item]
    });
    trackAdsAddToCart({
      items: [{ id: item?.item_id, quantity }],
      name: product?.name,
      category: product?.categories?.[0]?.name,
      value,
      currency: "INR",
    });
  },

  beginCheckout: (cartItems = [], totalValue = 0) => {
    const items = (cartItems || []).map(mapLineToGA4Item);
    trackGAEvent("begin_checkout", {
      currency: "INR",
      value: Number(totalValue),
      items
    });
    trackAdsBeginCheckout({
      items: items.map((item) => ({ id: item.item_id, quantity: item.quantity })),
      value: totalValue,
      currency: "INR",
    });
  },

  // PRD-034 FR-1.3: `orderId` is the order `_id` everywhere (GA4
  // transaction_id, Pixel eventID, Google Ads transaction_id), the id the
  // server-side events use. `options` = `{ currency, customer }`, where
  // customer `{ email, phone, countryCode }` is hashed for enhanced
  // conversions and never sent plain.
  purchase: (orderId, totalValue, items = [], shipping = 0, tax = 0, options = {}) => {
    const lines = (items || []).map(mapLineToGA4Item);
    trackGAEvent("purchase", {
      transaction_id: orderId,
      value: Number(totalValue),
      currency: options.currency || "INR",
      tax: Number(tax),
      shipping: Number(shipping),
      items: lines
    });
    return trackAdsPurchase({
      orderId,
      value: totalValue,
      currency: options.currency || "INR",
      items: lines.map((item) => ({ id: item.item_id, quantity: item.quantity })),
      customer: options.customer || null,
    });
  }
};
