/**
 * Google Analytics 4 (GA4) Tracking Utility
 * Provides a standardized way to track events across the platform.
 */

import { GA_MEASUREMENT_ID } from "@/utils/env";

export const GA_TRACKING_ID = GA_MEASUREMENT_ID;

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
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, {
      ...params,
      send_to: GA_TRACKING_ID
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
    trackGAEvent("view_item", {
      currency: "INR",
      value: getVariantPrice(product, variant),
      items: [mapProductToGA4Item(product, variant)]
    });
  },

  addToCart: (product, variant = null, quantity = 1) => {
    trackGAEvent("add_to_cart", {
      currency: "INR",
      value: getVariantPrice(product, variant) * quantity,
      items: [mapProductToGA4Item(product, variant, quantity)]
    });
  },

  beginCheckout: (cartItems = [], totalValue = 0) => {
    trackGAEvent("begin_checkout", {
      currency: "INR",
      value: Number(totalValue),
      items: (cartItems || []).map(mapLineToGA4Item)
    });
  },

  purchase: (orderId, totalValue, items = [], shipping = 0, tax = 0) => {
    trackGAEvent("purchase", {
      transaction_id: orderId,
      value: Number(totalValue),
      currency: "INR",
      tax: Number(tax),
      shipping: Number(shipping),
      items: (items || []).map(mapLineToGA4Item)
    });
  }
};
