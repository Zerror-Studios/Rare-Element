/**
 * Public stock signal → storefront states (PRD-020 FR-12, FR-14)
 *
 * The catalog API gives each variant (and product) a nullable
 * `availability` bucket and, only when the store opts in, an exact
 * `availableQuantity` for low stock. `null` means "no signal" (the store has
 * it off, stock isn't tracked, or the figure isn't seeded yet), and every
 * helper here maps it to today's behaviour: no badge, no note, nothing
 * blocked. `getVariantAvailability` (the fresh read) overrides the
 * server-rendered value for the ids it answers; a failed read keeps the
 * server value. Checkout reservation stays the authority.
 *
 * Pure functions, no imports, so `node:test` loads them directly.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/stock-signal.util.js`.
 */

// ─── Constants ────────────────────────────────────────────────────────────

export const StockAvailabilityEnum = {
  IN_STOCK: "IN_STOCK",
  LOW_STOCK: "LOW_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  BACKORDER: "BACKORDER",
};

/** `getVariantAvailability` answers at most this many ids per call. */
export const MAX_AVAILABILITY_IDS = 50;

export const SOLD_OUT_LABEL = "Sold out";
export const LOW_STOCK_LABEL = "Low stock";
export const SOLD_OUT_CHECKOUT_MESSAGE = "Remove sold-out items to continue";

const SCHEMA_ORG_AVAILABILITY = {
  [StockAvailabilityEnum.IN_STOCK]: "https://schema.org/InStock",
  [StockAvailabilityEnum.LOW_STOCK]: "https://schema.org/InStock",
  [StockAvailabilityEnum.OUT_OF_STOCK]: "https://schema.org/OutOfStock",
  [StockAvailabilityEnum.BACKORDER]: "https://schema.org/BackOrder",
};

const NO_SIGNAL = Object.freeze({
  availability: null,
  availableQuantity: null,
});

// ─── Helpers ──────────────────────────────────────────────────────────────

/** schema.org `offers.availability` URL, or undefined (omit) for no signal. */
export const toSchemaAvailability = (availability) =>
  SCHEMA_ORG_AVAILABILITY[availability] || undefined;

/** Distinct, non-empty ids for one `getVariantAvailability` call (≤ 50). */
export const toAvailabilityIds = (ids) =>
  [...new Set((ids || []).filter(Boolean).map(String))].slice(
    0,
    MAX_AVAILABILITY_IDS,
  );

/** `getVariantAvailability` rows keyed by variant id. */
export const toAvailabilityMap = (rows) => {
  const map = {};
  for (const row of rows || []) {
    if (!row?.variantId) continue;
    map[row.variantId] = {
      availability: row.availability ?? null,
      availableQuantity: row.availableQuantity ?? null,
    };
  }
  return map;
};

/**
 * The signal for one variant (or a cart line's id): the fresh read when it
 * answered this id, else the server-rendered fields, else no signal.
 */
export const resolveSignal = (id, fallback, fresh) => {
  if (id && fresh && Object.prototype.hasOwnProperty.call(fresh, id)) {
    return fresh[id];
  }
  if (!fallback) return NO_SIGNAL;
  return {
    availability: fallback.availability ?? null,
    availableQuantity: fallback.availableQuantity ?? null,
  };
};

/** A variant's signal (its own fields, overridden by the fresh read). */
export const resolveVariantSignal = (variant, fresh) =>
  resolveSignal(variant?._id, variant, fresh);

export const isSoldOut = (signal) =>
  signal?.availability === StockAvailabilityEnum.OUT_OF_STOCK;

export const isLowStock = (signal) =>
  signal?.availability === StockAvailabilityEnum.LOW_STOCK;

/**
 * PDP note under the CTA: "Only N left" when the store exposes the count,
 * else "Low stock"; nothing for any other state.
 */
export const getStockNote = (signal) => {
  if (!isLowStock(signal)) return null;
  const quantity = Number(signal.availableQuantity);
  return Number.isInteger(quantity) && quantity > 0
    ? `Only ${quantity} left`
    : LOW_STOCK_LABEL;
};

/** Listing card badge from `Product.availability`. */
export const getListingBadge = (availability) => {
  if (availability === StockAvailabilityEnum.OUT_OF_STOCK) {
    return SOLD_OUT_LABEL;
  }
  if (availability === StockAvailabilityEnum.LOW_STOCK) return LOW_STOCK_LABEL;
  return null;
};

/**
 * True when every published variant carrying `choiceName` (and the other
 * selected option values) is sold out. A choice with no such variant, or
 * any variant without a signal, is not struck through.
 */
export const isChoiceSoldOut = (variants, choiceName, otherValues, fresh) => {
  const wanted = (otherValues || []).filter(Boolean).map(String);
  const matching = (variants || []).filter((variant) => {
    const values = (variant?.optionValues || []).map(String);
    return (
      variant?.status !== "ARCHIVED" &&
      values.includes(String(choiceName)) &&
      wanted.every((value) => values.includes(value))
    );
  });
  return (
    matching.length > 0 &&
    matching.every((variant) => isSoldOut(resolveVariantSignal(variant, fresh)))
  );
};

/** The id a cart line is checked by: its variant, else the product. */
export const getCartLineStockId = (line) =>
  line?.variantId || line?.productId || null;

/**
 * Cart line state: `soldOut`, and `onlyLeft` (the count) when the store
 * exposes it and the line asks for more than that.
 */
export const getCartLineStock = (line, fresh) => {
  const signal = resolveSignal(getCartLineStockId(line), null, fresh);
  const quantity = Number(signal.availableQuantity);
  const onlyLeft =
    isLowStock(signal) &&
    Number.isInteger(quantity) &&
    quantity > 0 &&
    Number(line?.qty) > quantity
      ? quantity
      : null;
  return { soldOut: isSoldOut(signal), onlyLeft };
};

export const hasSoldOutLine = (lines, fresh) =>
  (lines || []).some((line) => getCartLineStock(line, fresh).soldOut);

/**
 * Analytics `in_stock` (PRD-013): the signal when there is one, else the
 * caller's fallback (today's "the combination exists").
 */
export const toInStockFlag = (signal, fallback) => {
  if (!signal?.availability) return fallback;
  return signal.availability !== StockAvailabilityEnum.OUT_OF_STOCK;
};
