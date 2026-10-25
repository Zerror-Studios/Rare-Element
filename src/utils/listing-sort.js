/**
 * Listing sort (PRD-014 Wave 2, W2-STORE)
 *
 * The values of the backend's `ClientProductSort` enum on
 * `getClientSideProducts(sort:)`, their labels, and the `?sort=` query
 * value. NEWEST is the default and never appears in the URL; an unknown
 * value reads as NEWEST, so a hand-edited URL can't break the page.
 *
 * Keep in sync with the other storefront's `utils/listing-sort.util.js`.
 */

// ─── Constants ────────────────────────────────────────────────────────────

export const ListingSortEnum = Object.freeze({
  NEWEST: "NEWEST",
  PRICE_ASC: "PRICE_ASC",
  PRICE_DESC: "PRICE_DESC",
  NAME_ASC: "NAME_ASC",
});

export const DEFAULT_LISTING_SORT = ListingSortEnum.NEWEST;

export const LISTING_SORT_OPTIONS = Object.freeze([
  { value: ListingSortEnum.NEWEST, label: "Newest" },
  { value: ListingSortEnum.PRICE_ASC, label: "Price: low to high" },
  { value: ListingSortEnum.PRICE_DESC, label: "Price: high to low" },
  { value: ListingSortEnum.NAME_ASC, label: "Name: A to Z" },
]);

// ─── Helpers ──────────────────────────────────────────────────────────────

/** A `?sort=` value (string or array) as an enum value; NEWEST otherwise. */
export function parseListingSort(value) {
  const raw = String(Array.isArray(value) ? value[0] : value || "")
    .trim()
    .toUpperCase();
  return Object.values(ListingSortEnum).includes(raw)
    ? raw
    : DEFAULT_LISTING_SORT;
}

/** The `?sort=` value for a sort, or `undefined` for the default. */
export function toSortQueryValue(sort) {
  const parsed = parseListingSort(sort);
  return parsed === DEFAULT_LISTING_SORT ? undefined : parsed;
}
