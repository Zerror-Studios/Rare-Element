/**
 * Product JSON-LD offers (PRD-014 FR-2.8, UX-33)
 *
 * `Offer` (one price) or `AggregateOffer` (a price range) from the
 * product's published variants. Archived variants and missing or zero
 * prices are skipped; no price means no `offers`. `availability` comes
 * from the product rollup `Product.availability` (PRD-020 FR-14, D12):
 * IN_STOCK and LOW_STOCK are `InStock`, OUT_OF_STOCK is `OutOfStock`,
 * BACKORDER is `BackOrder`, and `null` (no signal) leaves it out.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/product-offers.util.js`.
 */

import { toSchemaAvailability } from "@/utils/stock-signal";

// ─── Constants ────────────────────────────────────────────────────────────

export const OFFER_CURRENCY = "INR";
const NEW_CONDITION = "https://schema.org/NewCondition";
const ARCHIVED_STATUS = "ARCHIVED";

// ─── Helpers ──────────────────────────────────────────────────────────────

export const toProductOffers = (variants, url, availability = null) => {
  const prices = (variants || [])
    .filter((variant) => variant?.status !== ARCHIVED_STATUS)
    .map((variant) => Number(variant?.price))
    .filter((price) => Number.isFinite(price) && price > 0);
  if (!prices.length) return undefined;

  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);
  const schemaAvailability = toSchemaAvailability(availability);
  const common = {
    url,
    priceCurrency: OFFER_CURRENCY,
    itemCondition: NEW_CONDITION,
    ...(schemaAvailability ? { availability: schemaAvailability } : {}),
  };
  return lowPrice === highPrice
    ? { "@type": "Offer", price: lowPrice, ...common }
    : {
        "@type": "AggregateOffer",
        lowPrice,
        highPrice,
        offerCount: prices.length,
        ...common,
      };
};
