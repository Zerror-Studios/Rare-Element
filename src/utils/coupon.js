/**
 * Coupon (promotion code) helpers of the checkout
 *
 * Pure helpers the bag summary (`components/checkout/OrderSummary.jsx`)
 * and both checkout paths (`app/checkout/checkout-client.jsx`,
 * `components/checkout/GuestCheckout.jsx`) share:
 * - `normaliseCouponCode`: what the code field keeps as the shopper types
 *   (upper case, letters, digits, `-` and `_`, at most 64 characters; the
 *   backend matches codes case-insensitively);
 * - `getDroppedPromotionCode` / `getDroppedCodeMessage`: a bag code the
 *   server no longer applied when "Continue to payment" opened the session;
 * - `isSignInRequiredReason`: the answer that offers a "Sign in" link
 *   (`CHECKOUT_SIGN_IN_PATH`).
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/coupon.util.js`.
 *
 * No kit or React imports, so `node:test` loads them directly.
 */

// ─── Constants ────────────────────────────────────────────────────────────

export const COUPON_CODE_MAX_LENGTH = 64;
export const PROMOTION_SIGN_IN_REQUIRED = "PROMOTION_SIGN_IN_REQUIRED";
/** Sign in, then back to the checkout. */
export const CHECKOUT_SIGN_IN_PATH = `/login?next=${encodeURIComponent("/checkout")}`;

const COUPON_DISALLOWED = /[^A-Z0-9_-]/g;

// ─── Helpers ──────────────────────────────────────────────────────────────

const upper = (value) => String(value ?? "").trim().toUpperCase();

// ─── Code field ───────────────────────────────────────────────────────────

/** The typed code as kept: upper case, A–Z, 0–9, `-`, `_`, max 64. */
export const normaliseCouponCode = (value) =>
  String(value ?? "")
    .toUpperCase()
    .replace(COUPON_DISALLOWED, "")
    .slice(0, COUPON_CODE_MAX_LENGTH);

// ─── Answers ──────────────────────────────────────────────────────────────

/** True for the promotion answers (`PROMOTION_*`). */
export const isPromotionReason = (reason) =>
  String(reason || "").startsWith("PROMOTION_");

/** True when the code needs a signed-in shopper (offer "Sign in"). */
export const isSignInRequiredReason = (reason) =>
  reason === PROMOTION_SIGN_IN_REQUIRED;

// ─── Code dropped at "Continue to payment" ────────────────────────────────

/**
 * The bag's code when the session the kit opened for it carries none (or
 * another one): the server dropped it because it no longer applies. Null
 * when the bag has no code, there is no session, or the session kept it.
 */
export const getDroppedPromotionCode = (cart, session) => {
  const bagCode = upper(cart?.promotion?.promotionCode);
  if (!bagCode || !session) return null;
  return upper(session.promotionCode) === bagCode ? null : bagCode;
};

/** The non-blocking notice for a dropped code. */
export const getDroppedCodeMessage = (code) =>
  `Your code ${code} no longer applies to this order.`;

/** The bag without its code (what the server leaves after a drop). */
export const withoutPromotion = (cart) =>
  cart ? { ...cart, promotion: null } : cart;
