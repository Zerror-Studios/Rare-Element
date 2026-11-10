/**
 * Listing sort (PRD-014 Wave 2, W2-STORE): the kit's helpers for the
 * backend's `ClientProductSort` (`?sort=` value, NEWEST by default and
 * never in the URL, an unknown value reads as NEWEST).
 */

export {
  DEFAULT_LISTING_SORT,
  LISTING_SORT_OPTIONS,
  ListingSortEnum,
  parseListingSort,
  toSortQueryValue,
} from "@zcom/storefront-kit/core";
