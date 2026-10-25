/**
 * Product JSON-LD offers (PRD-014 FR-2.8, UX-33)
 *
 * `Offer` (one price) or `AggregateOffer` (a price range) from the
 * product's published variants. Archived variants and missing or zero
 * prices are skipped; no price means no `offers`. Stock levels aren't
 * exposed to storefronts (PRD-020), so `availability` is omitted rather
 * than guessed.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/product-offers.util.js`.
 */

// ─── Constants ────────────────────────────────────────────────────────────

export const OFFER_CURRENCY = "INR";
const NEW_CONDITION = "https://schema.org/NewCondition";
const ARCHIVED_STATUS = "ARCHIVED";

// ─── Helpers ──────────────────────────────────────────────────────────────

export const toProductOffers = (variants, url) => {
  const prices = (variants || [])
    .filter((variant) => variant?.status !== ARCHIVED_STATUS)
    .map((variant) => Number(variant?.price))
    .filter((price) => Number.isFinite(price) && price > 0);
  if (!prices.length) return undefined;

  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);
  const common = {
    url,
    priceCurrency: OFFER_CURRENCY,
    itemCondition: NEW_CONDITION,
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
