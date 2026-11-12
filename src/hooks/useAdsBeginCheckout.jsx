"use client";

/**
 * The ads networks' begin checkout (Meta `InitiateCheckout`, Google Ads)
 * from the checkout page, once per page load, on both paths: the
 * signed-in checkout (`app/checkout/checkout-client.jsx`) and the guest
 * checkout (`components/checkout/GuestCheckout.jsx`). It is sent when the
 * page opens with items in the bag. The flag lives in this module, so a
 * guest who signs in mid-checkout (the page switches to the signed-in
 * checkout) never sends it twice. The kit sends GA4's `begin_checkout`
 * itself once a session is reserved.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/hooks/useAdsBeginCheckout.jsx`.
 */

import { useEffect } from "react";
import { trackEcomEvent } from "@/utils/analytics";

// ─── State ────────────────────────────────────────────────────────────────

let isBeginCheckoutSent = false;

// ─── Hook ─────────────────────────────────────────────────────────────────

/** Sends the ads begin checkout for `cartData` (a `getCart` result) once. */
export const useAdsBeginCheckout = (cartData) => {
  useEffect(() => {
    if (isBeginCheckoutSent || !cartData?.cart?.length) return;
    isBeginCheckoutSent = true;
    trackEcomEvent.adsBeginCheckout(cartData.cart, cartData.discountedPrice);
  }, [cartData]);
};
