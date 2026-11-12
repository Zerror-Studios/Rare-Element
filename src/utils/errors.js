/**
 * GraphQL error → shopper message (PRD-002 SF-1 / SF-18)
 *
 * Branches only on `extensions.reason` and `extensions.code`, never on
 * message text. Reasons come from the commerce, payment and auth services
 * (storefront contract, PRD-002 §8 WS-C).
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/api-error.util.js`
 * and the reason codes in zcom-backend (`packages/core/src/utils/` and the
 * commerce/payment services); see PRD-002 RMAINT-7.
 */

import { ServerError } from "@apollo/client";
import {
  DEFAULT_ERROR_MESSAGES as KIT_MESSAGES,
  getErrorInfo as readKitError,
  getErrorMessage as getKitErrorMessage,
} from "@zcom/storefront-kit/core";
import { isPromotionReason } from "./coupon";

// ─── Messages ─────────────────────────────────────────────────────────────

export const REASON_MESSAGES = {
  PRICE_CHANGED: "Prices have changed. Please review your bag and try again.",
  // R2-C7: the hold expired or was released before the order completed.
  CHECKOUT_EXPIRED: "Your reservation expired. Please try again.",
  RESERVATION_RELEASED: "Your reservation expired. Please try again.",
  INVALID_ITEMS:
    "Some items in your bag are no longer available. Please review your bag.",
  RESERVATION_ERROR: "We couldn't reserve your items. Please try again.",
  CHECKOUT_FAILED: "Checkout could not be completed. Please try again.",
  CHECKOUT_IN_PROGRESS: "Your order is already being placed. Please wait.",
  RESERVATION_PENDING: "We are still reserving your items. Please wait.",
  RESERVATION_UNAVAILABLE:
    "Checkout is temporarily unavailable. Please try again shortly.",
  OUT_OF_STOCK: "Some items in your bag are out of stock.",
  EMPTY_CART: "Your bag is empty.",
  INVALID_QTY: "That quantity isn't available for this item.",
  TOO_MANY_LINES: "Your bag has too many items.",
  INVALID_GUEST_ID: "Your bag session expired. Please add your items again.",
  ADDRESS_REQUIRED: "Please enter address line 1, city and pincode.",
  VARIANT_REQUIRED: "Please select all product options.",
  PRODUCT_UNAVAILABLE: "This item is currently unavailable.",
  PROMOTION_INVALID: "This discount code is not valid.",
  PROMOTION_EXPIRED: "This discount code has expired.",
  PROMOTION_INACTIVE: "This discount code is not active.",
  PROMOTION_EXHAUSTED: "This discount code has reached its usage limit.",
  PROMOTION_CUSTOMER_LIMIT: "You have already used this discount code.",
  PROMOTION_MINIMUM: "Your bag doesn't meet the minimum for this code.",
  PROMOTION_NOT_APPLICABLE: "This code doesn't apply to items in your bag.",
  // Who can use a code (backend PRD-036 round 2)
  PROMOTION_SIGN_IN_REQUIRED: "Sign in to use this discount code.",
  PROMOTION_NEW_CUSTOMERS_ONLY: "This discount code is for first orders only.",
  PROMOTION_NOT_ELIGIBLE: "This discount code isn't available for your account.",
  ALREADY_PAID: "This order has already been paid.",
  ORDER_CANCELLED: "This order was cancelled.",
  ACCOUNT_INACTIVE: "This account is inactive. Please contact support.",
  // R3 (VCON-2): checkout, payment and newsletter reasons.
  CHECKOUT_REPLACED:
    "Your checkout was updated in another window. Please try again.",
  PAYMENT_NOT_CONFIGURED:
    "Online payment is unavailable right now. Please try again later.",
  MISSING_PROVIDER_ORDER:
    "We couldn't confirm your payment. Please check your order or try again.",
  INVALID_EMAIL: "Please enter a valid email address.",
  // PRD-011: payment apps.
  PAYMENT_PROVIDER_NOT_CONFIGURED:
    "Online payment is unavailable right now. Please try again later.",
  INVALID_PAYMENT_SIGNATURE:
    "We couldn't confirm your payment. Please check your order or try again.",
  PROVIDER_ORDER_MISMATCH:
    "We couldn't confirm your payment. Please check your order or try again.",
  // PRD-014 Wave 1 (W1-MONEY): no shipping zone covers the address.
  SHIPPING_UNAVAILABLE:
    "We can't ship to this address yet. Please use a different address.",
  // PRD-003 FR-0.5: customer password reset.
  INVALID_RESET_TOKEN: "This reset link is invalid or has expired.",
  WEAK_PASSWORD: "Use at least 8 characters for your password.",
  // PRD-016 FR-25: the store's billing has paused new orders.
  STORE_ORDERS_PAUSED: "This store isn't taking orders right now.",
  // PRD-015 FR-20: shopper cancel and returns.
  ORDER_NOT_CANCELLABLE:
    "This order can no longer be cancelled; contact the store.",
  PAYMENT_IN_PROGRESS:
    "A payment is in progress; try again in a few minutes.",
  ORDER_NOT_DELIVERED: "You can request a return once the order is delivered.",
  RETURN_WINDOW_CLOSED: "The return window for this order has closed.",
  RETURNS_DISABLED: "This store doesn't accept returns online; contact the store.",
  ORDER_NOT_RETURNABLE: "This order can't be returned here; contact the store.",
  INVALID_ORDER_ITEM:
    "One of these items isn't on this order. Please refresh and try again.",
  INVALID_QUANTITY: "Choose a quantity of at least 1.",
  RETURN_QUANTITY_EXCEEDED:
    "You've already requested a return for some of these items. Please refresh and try again.",
  INVALID_TRANSITION:
    "This return can no longer be changed. Please refresh the page.",
  RETURN_CHANGED: "This return was updated. Please refresh and try again.",
  // CP-22: notify-me (and other public) limits; neutral, never the server text.
  RATE_LIMITED: "We’ve had a lot of requests. Please try again later.",
};

// PRD-014 COM-32: `removeItemFromCart` without the line's variant is
// ambiguous when the product has several lines (the bag is out of date).
export const REMOVE_ITEM_OVERRIDES = {
  VARIANT_REQUIRED:
    "We couldn't tell which item to remove. Please refresh your bag and try again.",
};

const CODE_MESSAGES = {
  CONFLICT: "This email is already registered.",
  UNAUTHENTICATED: "Please log in to continue.",
  TOKEN_EXPIRED: "Your session expired. Please log in again.",
  FORBIDDEN: "You don't have access to this.",
  NOT_FOUND: "We couldn't find that.",
  RATE_LIMITED: "Too many attempts. Please wait a moment and try again.",
  INVALID_AUTH_TOKEN: "Your session expired. Please log in again.",
  // R2-C5: tenant errors from the gateway.
  TENANT_NOT_FOUND: "This store is unavailable right now. Please try later.",
  TENANT_MISMATCH: "Your session expired. Please log in again.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * `{ code, reason, message }` of the first GraphQL error, if any: Apollo's
 * `CombinedGraphQLErrors` and the kit's `ZcomError` alike (the kit's reader).
 */
export function getErrorInfo(error) {
  if (ServerError.is(error) && error.statusCode === 429) {
    return { code: "RATE_LIMITED", reason: undefined, message: error.message };
  }
  const info = readKitError(error);
  return {
    code: info.code || undefined,
    reason: info.reason || undefined,
    message: info.rawMessage || error?.message,
  };
}

/** Message for a reason code (e.g. a checkout `failureReason`). */
export function getReasonMessage(reason, fallback) {
  return REASON_MESSAGES[reason] || fallback;
}

/**
 * Its own message for every promotion answer (`PROMOTION_*`): the store's
 * copy, else the kit's (a reason the backend adds later), never a generic
 * "Failed to apply coupon".
 */
export function getPromotionMessage(reason) {
  return (
    REASON_MESSAGES[reason] ||
    KIT_MESSAGES[reason] ||
    REASON_MESSAGES.PROMOTION_INVALID
  );
}

/**
 * Shopper-facing message for an Apollo error. `overrides` maps a reason or
 * code to a screen-specific message (e.g. `{ UNAUTHENTICATED: "…" }`).
 */
export function getErrorMessage(
  error,
  fallback = "Something went wrong. Please try again.",
  overrides = {},
) {
  const { code, reason } = getErrorInfo(error);
  if (isPromotionReason(reason) && !overrides[reason]) {
    return getPromotionMessage(reason);
  }
  return (
    (reason && (overrides[reason] || REASON_MESSAGES[reason])) ||
    (code && (overrides[code] || CODE_MESSAGES[code])) ||
    fallback
  );
}

/**
 * Shopper copy for an error key a kit hook holds (`useCheckout().error`,
 * `useCodeSignIn().error`, a `CheckoutResult.reason`; backend PRD-041):
 * the store's own message when it has one, else the kit's (the kit owns
 * the guest checkout and code sign-in copy). "" for no key.
 */
export function getKitKeyMessage(key, overrides = {}) {
  if (!key) return "";
  if (isPromotionReason(key) && !overrides[key]) return getPromotionMessage(key);
  return getKitErrorMessage(
    { extensions: { reason: key } },
    { ...REASON_MESSAGES, ...overrides },
  );
}

/**
 * True for a real "doesn't exist" answer (SF-14). Server pages call
 * `notFound()` only then; any other error reaches the error boundary, so a
 * transient backend failure is never cached as a 404.
 */
export function isNotFoundError(error) {
  const { code } = getErrorInfo(error);
  return code === "NOT_FOUND";
}

/** True when the server rejected the stored guest cart id (R2-C2). */
export function isInvalidGuestIdError(error) {
  return getErrorInfo(error).reason === "INVALID_GUEST_ID";
}
