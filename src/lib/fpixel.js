/**
 * Meta Pixel helpers (PRD-034 FR-1.2, FR-1.3)
 *
 * The pixel id comes from `utils/tracking-config.js` (the store's backend
 * config, env fallback) and the Pixel is loaded only by `utils/consent.js`
 * after "marketing" consent. E-commerce events go through `trackEcomEvent`
 * (`utils/analytics.js` → `utils/ads-tracking.js`); this file keeps the
 * page-view call for client-side navigations (`FacebookPixel`).
 */

import { isTagLoaded, readConsent } from "@/utils/consent";
import { getTagIds } from "@/utils/tracking-config";

/** The pixel id in use ("" when the store has none). */
export const getPixelId = () => getTagIds().pixelId;

const pixelReady = () =>
  typeof window !== "undefined" &&
  typeof window.fbq === "function" &&
  isTagLoaded("pixel") &&
  readConsent()?.marketing === true;

export const pageview = () => {
  if (pixelReady()) {
    window.fbq("track", "PageView");
  }
};

// https://developers.facebook.com/docs/facebook-pixel/advanced/
export const event = (name, options = {}) => {
  if (pixelReady()) {
    window.fbq("track", name, options);
  }
};
