/**
 * Public stock signal → storefront states (PRD-020 FR-12, FR-14) on the
 * kit's stock helpers (PRD-002 FR-4.1).
 *
 * `null` availability means "no signal": no badge, no note, nothing
 * blocked. The fresh read (`useVariantAvailability`) overrides the
 * server-rendered value for the ids it answered. The store keeps its
 * labels and the schema.org mapping; the rules are the kit's.
 */

import * as kit from "@zcom/storefront-kit/core";

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

const LABELS = {
  ...kit.STOCK_LABELS,
  soldOut: SOLD_OUT_LABEL,
  lowStock: LOW_STOCK_LABEL,
};

const SCHEMA_ORG_AVAILABILITY = {
  [StockAvailabilityEnum.IN_STOCK]: "https://schema.org/InStock",
  [StockAvailabilityEnum.LOW_STOCK]: "https://schema.org/InStock",
  [StockAvailabilityEnum.OUT_OF_STOCK]: "https://schema.org/OutOfStock",
  [StockAvailabilityEnum.BACKORDER]: "https://schema.org/BackOrder",
};

/** The store's `{ [id]: signal }` answers as the kit's Map. */
const toMap = (fresh) =>
  fresh instanceof Map ? fresh : new Map(Object.entries(fresh || {}));

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

export const resolveSignal = (id, fallback, fresh) =>
  kit.resolveSignal(id, fallback, toMap(fresh));

export const resolveVariantSignal = (variant, fresh) =>
  kit.resolveVariantSignal(variant, toMap(fresh));

export const isSoldOut = kit.isSoldOut;

export const isLowStock = kit.isLowStock;

/** "Only N left" when the store exposes the count, else "Low stock". */
export const getStockNote = (signal) => kit.getStockNote(signal, LABELS);

/** Listing card badge from `Product.availability`. */
export const getListingBadge = (availability) =>
  kit.getListingBadge(availability, LABELS);

export const isChoiceSoldOut = (variants, choiceName, otherValues, fresh) =>
  kit.isChoiceSoldOut(variants, String(choiceName), otherValues || [], toMap(fresh));

export const getCartLineStockId = kit.getCartLineStockId;

export const getCartLineStock = (line, fresh) =>
  kit.getCartLineStock(line, toMap(fresh));

export const hasSoldOutLine = (lines, fresh) =>
  kit.hasSoldOutLine(lines, toMap(fresh));

export const toInStockFlag = kit.toInStockFlag;
