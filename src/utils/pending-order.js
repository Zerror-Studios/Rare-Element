/**
 * Pending (unpaid) checkout order (PRD-002 RBUG-8 / VBUG-4, contract R2-C8)
 *
 * After `completeCheckout` the UN_PAID order id and (optionally) its
 * checkout session id are kept in sessionStorage, keyed by cart id, with
 * two fingerprints:
 * - the cart: lines and coupon (checked on read);
 * - the checkout details: email and the shipping and billing addresses as
 *   sent to the server (checked on submit, VBUG-4).
 *
 * A payment retry, also after a reload, reuses that order instead of
 * creating a new session, order and stock hold, but only while both still
 * match. A shopper who closes the payment window and changes the address or
 * email gets a new order with the new details (the server's checkout
 * fingerprint covers the addresses too). The entry is dropped when the
 * payment succeeds or when either fingerprint no longer matches.
 *
 * `checkoutId` is optional and unused here; it keeps the entry identical
 * to the deveshe-dreams twin (PRD-014 W0V-C-03), where a reload shows that
 * session's pricing again.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/pending-order.util.js`.
 */

// ─── Constants ────────────────────────────────────────────────────────────

const KEY_PREFIX = "zc_pending_order:";

// ─── Helpers ──────────────────────────────────────────────────────────────

const keyFor = (cartId) => `${KEY_PREFIX}${cartId}`;

const normalise = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

/** Address fields as sorted `[key, value]` pairs, empty values dropped. */
const addressPairs = (address) =>
  Object.keys(address || {})
    .sort()
    .map((key) => [key, normalise(address[key])])
    .filter(([, value]) => value !== "");

/** Lines (product, variant, qty) and coupon code of a `getCart` result. */
export const getCartFingerprint = (cart) => {
  const lines = (cart?.cart || [])
    .map((line) => `${line.productId}:${line.variantId || ""}:${line.qty}`)
    .sort();
  return JSON.stringify([lines, cart?.promotion?.promotionCode || ""]);
};

/**
 * Email and both order addresses (the `OrderAddressInput` values sent to
 * `createCheckoutSessionFromCart`), ignoring case and extra whitespace.
 */
export const getCheckoutDetailsFingerprint = (details) =>
  JSON.stringify([
    normalise(details?.email),
    addressPairs(details?.shippingAddress),
    addressPairs(details?.billingAddress),
  ]);

// ─── API ──────────────────────────────────────────────────────────────────

export const PendingOrder = {
  /**
   * The pending order entry `{ orderId, checkoutId, detailsFingerprint }`
   * for `cart`, or null (an entry for a changed bag or coupon is removed).
   */
  read(cart) {
    if (!cart?._id) return null;
    try {
      const raw = sessionStorage.getItem(keyFor(cart._id));
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (entry?.fingerprint === getCartFingerprint(cart) && entry.orderId) {
        return {
          orderId: entry.orderId,
          checkoutId: entry.checkoutId || null,
          detailsFingerprint: entry.detailsFingerprint || null,
        };
      }
      sessionStorage.removeItem(keyFor(cart._id));
    } catch {
      // Storage unavailable or corrupt: no pending order.
    }
    return null;
  },

  /** True when `entry` was saved for exactly these checkout details. */
  matches(entry, details) {
    return (
      !!entry?.orderId &&
      entry.detailsFingerprint === getCheckoutDetailsFingerprint(details)
    );
  },

  /** Keeps the order for retries; returns the entry (also without storage). */
  save(cart, orderId, details, checkoutId = null) {
    if (!cart?._id || !orderId) return null;
    const entry = {
      orderId,
      checkoutId,
      detailsFingerprint: getCheckoutDetailsFingerprint(details),
    };
    try {
      sessionStorage.setItem(
        keyFor(cart._id),
        JSON.stringify({ ...entry, fingerprint: getCartFingerprint(cart) }),
      );
    } catch {
      // Storage unavailable: the entry lives in page state only.
    }
    return entry;
  },

  /**
   * The cart id whose pending entry holds `orderId`, or null. The
   * payment-failed page uses it to send "Retry payment" back to that
   * cart's checkout, which then reuses the same order (PRD-014 FR-0.12).
   */
  findCartId(orderId) {
    if (!orderId) return null;
    try {
      const key = Object.keys(sessionStorage).find((candidate) => {
        if (!candidate.startsWith(KEY_PREFIX)) return false;
        const entry = JSON.parse(sessionStorage.getItem(candidate) || "{}");
        return entry?.orderId === orderId;
      });
      return key ? key.slice(KEY_PREFIX.length) : null;
    } catch {
      // Storage unavailable or corrupt: no pending order to retry.
      return null;
    }
  },

  /** Forget the pending order of one cart, or of every cart. */
  clear(cartId) {
    try {
      if (cartId) {
        sessionStorage.removeItem(keyFor(cartId));
        return;
      }
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith(KEY_PREFIX))
        .forEach((key) => sessionStorage.removeItem(key));
    } catch {
      // Storage unavailable; nothing to clear.
    }
  },
};
