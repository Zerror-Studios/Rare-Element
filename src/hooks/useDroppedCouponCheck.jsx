"use client";

/**
 * A bag code the server dropped at "Continue to payment"
 *
 * When the kit's `start` / `startGuest` opens a session, the backend
 * re-checks the bag's code and leaves it out when it no longer applies;
 * the bag still shows it until it is read again. Both checkout paths
 * (`app/checkout/checkout-client.jsx`,
 * `components/checkout/GuestCheckout.jsx`) call
 * `check(session)` right after a session comes back: when the bag had a
 * code and the session hasn't, it re-reads the bag and shows "Your code
 * {CODE} no longer applies to this order." The notice is non-blocking: the
 * shopper can still pay the session's total.
 *
 * The re-read bag has another fingerprint, which normally drops the
 * reserved session; `isExpectedChange(fingerprint)` tells the path's
 * bag-change effect that this one is the server's own drop, and `check`
 * returns the fingerprint the reserved details key must be built from.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/hooks/useDroppedCouponCheck.jsx`.
 */

import { useRef, useState } from "react";
import { getCartFingerprint } from "@/utils/checkout-kit";
import {
  getDroppedCodeMessage,
  getDroppedPromotionCode,
  withoutPromotion,
} from "@/utils/coupon";

// ─── Hook ─────────────────────────────────────────────────────────────────

/** `cartData` is the `getCart` result on screen, `refetch` re-reads it. */
export const useDroppedCouponCheck = (cartData, refetch) => {
  const [notice, setNotice] = useState("");
  const expectedFingerprintRef = useRef(null);

  /** Call with the session `start` returned; returns the bag fingerprint. */
  const check = async (session) => {
    const dropped = getDroppedPromotionCode(cartData, session);
    if (!dropped) {
      setNotice("");
      return getCartFingerprint(cartData);
    }
    expectedFingerprintRef.current = getCartFingerprint(
      withoutPromotion(cartData),
    );
    setNotice(getDroppedCodeMessage(dropped));
    try {
      const result = await refetch();
      const fresh = result?.data?.getCart;
      return getCartFingerprint(fresh?._id ? fresh : withoutPromotion(cartData));
    } catch {
      // The bag on screen wasn't re-read: it still shows the code
      return getCartFingerprint(cartData);
    }
  };

  /** True when a bag change is the drop `check` saw (keep the session). */
  const isExpectedChange = (fingerprint) =>
    Boolean(fingerprint) && fingerprint === expectedFingerprintRef.current;

  /** Any other bag change: forget the drop and its notice. */
  const clear = () => {
    expectedFingerprintRef.current = null;
    setNotice("");
  };

  return { notice, check, isExpectedChange, clear };
};
