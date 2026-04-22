/**
 * Google Analytics 4 (GA4) Tracking Utility
 * Provides a standardized way to track events across the platform.
 */

export const GA_TRACKING_ID = "G-0FTD3SQ58J";

/**
 * Maps an internal product object to the standard GA4 items schema.
 * @param {Object} product - The internal product object.
 * @param {Object} variant - (Optional) Selected variant details.
 * @param {number} quantity - (Optional) Quantity.
 * @returns {Object} GA4 item object.
 */
export const mapProductToGA4Item = (product, variant = null, quantity = 1) => {
  if (!product) return null;

  return {
    item_id: variant?.variantDetailId || product?._id,
    item_name: product.name,
    price: Number(variant?.variantPrice || product.discountedPrice || product.price || 0),
    quantity: Number(quantity),
    item_brand: "Nahara",
    item_category: product.categoryIds?.[0] || "Jewellery",
    item_variant: variant?.name || ""
  };
};

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
      value: Number(variant?.variantPrice || product.discountedPrice || product.price || 0),
      items: [mapProductToGA4Item(product, variant)]
    });
  },

  addToCart: (product, variant = null, quantity = 1) => {
    trackGAEvent("add_to_cart", {
      currency: "INR",
      value: Number(variant?.variantPrice || product.discountedPrice || product.price || 0) * quantity,
      items: [mapProductToGA4Item(product, variant, quantity)]
    });
  },

  beginCheckout: (cartItems = [], totalValue = 0) => {
    trackGAEvent("begin_checkout", {
      currency: "INR",
      value: Number(totalValue),
      items: (cartItems || []).map(item => mapProductToGA4Item(item.product, item.variantDetail, item.qty))
    });
  },

  purchase: (orderId, totalValue, items = [], shipping = 0, tax = 0) => {
    trackGAEvent("purchase", {
      transaction_id: orderId,
      value: Number(totalValue),
      currency: "INR",
      tax: Number(tax),
      shipping: Number(shipping),
      items: (items || []).map(item => mapProductToGA4Item(item.product, item.variantDetail || item.variantId, item.qty))
    });
  }
};
