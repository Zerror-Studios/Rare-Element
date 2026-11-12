"use client";

/**
 * The checkout's shipping estimate (2026-11-13): the kit's
 * `useShippingEstimate` for the delivery address being typed, asked once
 * the address settles (debounced), and again when the bag changes.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/hooks/useCheckoutShippingEstimate.jsx`.
 */

import { useEffect, useState } from "react";
import { useShippingEstimate } from "@zcom/storefront-kit/client";

export const SHIPPING_ESTIMATE_DEBOUNCE_MS = 500;

export const useCheckoutShippingEstimate = (address, cartFingerprint) => {
  const country = String(address?.country ?? "").trim();
  const state = String(address?.states ?? address?.state ?? "").trim();
  const pincode = String(address?.pincode ?? "").trim();
  const key = JSON.stringify([country, state, pincode]);
  const [settled, setSettled] = useState(key);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(key), SHIPPING_ESTIMATE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [key]);

  const [c, s, p] = JSON.parse(settled);
  const { estimate, loading } = useShippingEstimate(
    c ? { country: c, state: s || null, pincode: p || null } : null,
    { cartKey: cartFingerprint },
  );
  return { estimate, estimating: loading || (Boolean(country) && settled !== key) };
};
