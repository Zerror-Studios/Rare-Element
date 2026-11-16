/**
 * Listing sort (PRD-014 Wave 2, W2-STORE): the kit's helpers for the
 * `?sort=` value. The default (FEATURED from kit 1.4, the collection's own
 * order, backend PRD-045; NEWEST on kit 1.3) is never in the URL or sent
 * to the API, and an unknown value reads as the default.
 */

/** The first row of a listing (two cards on a phone, four on desktop) is
 * loaded at once: it is the page's LCP. */
export const LISTING_PRELOAD_COUNT = 4;

export {
  DEFAULT_LISTING_SORT,
  LISTING_SORT_OPTIONS,
  ListingSortEnum,
  parseListingSort,
  toSortQueryValue,
} from "@zcom/storefront-kit/core";
