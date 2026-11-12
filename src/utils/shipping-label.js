/**
 * The checkout's shipping line (both paths, 2026-11-13): what the order
 * will be charged once "Continue to payment" priced it; before that the
 * server's estimate for the address entered (backend `shippingEstimate`,
 * kit `useShippingEstimate`); else a prompt for the address.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/shipping-label.util.js`.
 */

const rupees = (amount) => `₹ ${amount}`;

/**
 * @param {object} p
 * @param {object|null} p.pricing  the reserved session's pricing
 * @param {boolean} p.isPricing    "Continue to payment" is running
 * @param {object|null} p.estimate `{ shipping, isFreeShipping, available }`
 * @param {boolean} p.estimating   the estimate is loading
 * @param {boolean} p.isFreeShippingEnabled the bag has free shipping
 * @param {(n: number) => string} p.format the store's price formatter
 */
export const getShippingLabel = ({
  pricing = null,
  isPricing = false,
  estimate = null,
  estimating = false,
  isFreeShippingEnabled = false,
  format = rupees,
} = {}) => {
  if (pricing) {
    return pricing.isFreeShipping || !pricing.shipping ? "Free" : format(pricing.shipping);
  }
  if (isPricing) return "Calculating…";
  if (estimate) {
    if (!estimate.available) return "We can't ship to this address yet";
    return estimate.isFreeShipping || !estimate.shipping ? "Free" : format(estimate.shipping);
  }
  if (estimating) return "Calculating…";
  if (isFreeShippingEnabled) return "Free";
  return "Enter your address to see shipping";
};

/** The estimated shipping to add to the bag total, or 0. */
export const getEstimatedShipping = (pricing, estimate) =>
  !pricing && estimate?.available && !estimate.isFreeShipping ? Number(estimate.shipping) || 0 : 0;
