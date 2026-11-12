/**
 * The store's checkout form and bag → the kit's `useCheckout()` inputs
 *
 * Pure helpers the signed-in checkout (`app/checkout/checkout-client.jsx`)
 * and the guest checkout (`components/checkout/GuestCheckout.jsx`) use
 * around the kit's `start` / `startGuest` → `pay` (kit 1.1.0):
 * - `getCartFingerprint`: the bag's lines and coupon, so a changed bag or
 *   coupon drops the shown total and the kit's kept unpaid order;
 * - `toCustomerCheckoutInput`: the signed-in form (email, delivery and
 *   billing address) and the bag → `start`'s input, the addresses as the
 *   backend's `OrderAddressInput` (a saved address is sent as its values,
 *   as the store always did);
 * - `isKeptOrderStale`: whether the kit's kept unpaid order (its
 *   `PendingOrderStore` entry) no longer belongs to this bag;
 * - `getDetailsKey` / `isReservedFor`: the one checkout flow of both paths
 *   ("Continue to payment" → "Pay now"): "Pay now" is enabled only while
 *   the kit's session was reserved for exactly the bag, coupon and details
 *   on screen.
 *
 * No kit or React imports, so `node:test` loads them directly.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/checkout-kit.util.js`.
 */

import { toCheckoutLines, toOrderAddressInput } from "./guest-checkout";

// ─── Helpers ──────────────────────────────────────────────────────────────

const upper = (value) => String(value ?? "").trim().toUpperCase();

// ─── Bag ──────────────────────────────────────────────────────────────────

/** Lines (product, variant, qty) and coupon code of a `getCart` result. */
export const getCartFingerprint = (cart) => {
  const lines = (cart?.cart || [])
    .map((line) => `${line.productId}:${line.variantId || ""}:${line.qty}`)
    .sort();
  return JSON.stringify([lines, cart?.promotion?.promotionCode || ""]);
};

// ─── Signed-in checkout ───────────────────────────────────────────────────

/**
 * The signed-in form and the bag → the kit's `start` input. The billing
 * address is the delivery address unless the shopper entered another one
 * (both are always sent, as before). No discount code is sent: the bag's
 * own coupon applies on the server.
 */
export const toCustomerCheckoutInput = (cart, values = {}) => {
  const email = String(values.email ?? "").trim();
  const shipping = values.shippingAddress;
  const billing = values.useShippingAsBilling ? shipping : values.billingAddress;
  return {
    cartId: cart?._id || "",
    lines: toCheckoutLines(cart),
    email,
    shippingAddress: toOrderAddressInput(shipping, email),
    billingAddress: toOrderAddressInput(billing, email),
  };
};

/**
 * True when the kit's kept unpaid order (`PendingOrderStore.get()`) can't
 * be paid for this bag: another cart, or a coupon that changed since it was
 * placed (the kit's fingerprint covers the lines, not the bag's coupon).
 * A missing entry is not stale.
 */
export const isKeptOrderStale = (pending, cart) => {
  if (!pending) return false;
  if (!cart?._id || pending.cartId !== cart._id) return true;
  const keptCoupon = upper(pending.session?.promotionCode);
  const bagCoupon = upper(cart?.promotion?.promotionCode);
  return keptCoupon !== bagCoupon;
};

// ─── Continue to payment → Pay now ────────────────────────────────────────

/** Kit steps in which no reserved session can be paid. */
const UNRESERVED_STEPS = ["idle", "reserving", "failed"];

/**
 * The key of what "Continue to payment" reserves: the bag (lines and
 * coupon) plus every detail sent, the news box included. Null until the
 * bag has loaded. Any change gives another key, so "Pay now" is disabled
 * until the shopper continues again.
 */
export const getDetailsKey = (cartFingerprint, details) =>
  cartFingerprint ? JSON.stringify([cartFingerprint, details ?? null]) : null;

/**
 * True when "Pay now" may pay: the kit holds a session (`hasSession`), it
 * is past reserving and not failed (`step`, the kit's checkout step), and
 * "Continue to payment" reserved it for these exact details
 * (`reservedKey` equals `detailsKey`).
 */
export const isReservedFor = ({ hasSession, step, reservedKey, detailsKey }) =>
  Boolean(hasSession) &&
  reservedKey !== null &&
  reservedKey !== undefined &&
  reservedKey === detailsKey &&
  !UNRESERVED_STEPS.includes(step);
