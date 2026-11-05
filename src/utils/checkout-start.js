/**
 * Checkout URL input (PRD-034 FR-1.9)
 *
 * `/checkout/start?products=<variantId>:<qty>,…` is the address Meta sends
 * shoppers to from Shops and ads (the Meta feed's checkout URL). This
 * parses and validates it: at most 20 lines, quantity 1–10, variant ids
 * are 24-character hex ids; the same variant twice is merged (and must
 * still be at most 10). Anything else is refused as a whole, with a
 * reason the page turns into a friendly message. Prices are never read
 * from the URL: the server prices every line.
 */

// ─── Constants ────────────────────────────────────────────────────────────

export const CHECKOUT_START_MAX_LINES = 20;
export const CHECKOUT_START_MAX_QTY = 10;
const VARIANT_ID_PATTERN = /^[a-f0-9]{24}$/i;
const QTY_PATTERN = /^\d{1,2}$/;
const MAX_INPUT_LENGTH = 2000;

export const CheckoutStartErrorEnum = {
  EMPTY: "EMPTY",
  TOO_MANY_LINES: "TOO_MANY_LINES",
  INVALID_LINE: "INVALID_LINE",
  INVALID_QUANTITY: "INVALID_QUANTITY",
};

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * `{ lines: [{ variantId, qty }] }` or `{ error }` for the raw `products`
 * value (a string, or the first of an array from `searchParams`).
 */
export function parseCheckoutStartProducts(raw) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return { error: CheckoutStartErrorEnum.EMPTY };
  if (text.length > MAX_INPUT_LENGTH) {
    return { error: CheckoutStartErrorEnum.TOO_MANY_LINES };
  }

  const parts = text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return { error: CheckoutStartErrorEnum.EMPTY };
  if (parts.length > CHECKOUT_START_MAX_LINES) {
    return { error: CheckoutStartErrorEnum.TOO_MANY_LINES };
  }

  const quantities = new Map();
  for (const part of parts) {
    const [id, qtyText = "1", extra] = part.split(":").map((s) => s.trim());
    if (extra !== undefined || !VARIANT_ID_PATTERN.test(id || "")) {
      return { error: CheckoutStartErrorEnum.INVALID_LINE };
    }
    if (!QTY_PATTERN.test(qtyText)) {
      return { error: CheckoutStartErrorEnum.INVALID_QUANTITY };
    }
    const variantId = id.toLowerCase();
    const qty = (quantities.get(variantId) || 0) + Number(qtyText);
    if (Number(qtyText) < 1 || qty > CHECKOUT_START_MAX_QTY) {
      return { error: CheckoutStartErrorEnum.INVALID_QUANTITY };
    }
    quantities.set(variantId, qty);
  }

  return {
    lines: Array.from(quantities, ([variantId, qty]) => ({ variantId, qty })),
  };
}

/** Shopper copy for a parse error or an add that failed. */
export function getCheckoutStartMessage(error) {
  switch (error) {
    case CheckoutStartErrorEnum.TOO_MANY_LINES:
      return "This link has more items than we can add at once.";
    case CheckoutStartErrorEnum.INVALID_QUANTITY:
      return `Each item can be added 1 to ${CHECKOUT_START_MAX_QTY} times.`;
    case "UNAVAILABLE":
      return "The items in this link aren't available any more.";
    case "ADD_FAILED":
      return "We couldn't add these items to your bag.";
    default:
      return "This link doesn't point to any items we can add.";
  }
}
