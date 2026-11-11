/**
 * Listing sort (PRD-014 Wave 2, W2-STORE): the kit's helpers for the
 * backend's `ClientProductSort` (`?sort=` value, NEWEST by default and
 * never in the URL, an unknown value reads as NEWEST).
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
