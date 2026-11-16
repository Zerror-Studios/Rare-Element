/**
 * Listing sort query values (PRD-014 Wave 2, W2-STORE)
 *
 * `?sort=` reads as one of the kit's listing sorts; an unknown or missing
 * value is the default, which is never written to the URL or sent to the
 * API. Written against the default, so it holds on kit 1.3 (NEWEST) and
 * 1.4 (FEATURED, backend PRD-045: the collection's own order).
 *
 * Keep in sync with the other storefront's `test/listing-sort.test.mjs`
 * (`src/utils/listing-sort.util.js` there).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const {
  DEFAULT_LISTING_SORT,
  parseListingSort,
  toSortQueryValue,
  LISTING_SORT_OPTIONS,
} =
  await import("@/utils/listing-sort");

describe("listing sort", () => {
  it("reads known values, case-insensitively, from a string or an array", () => {
    assert.equal(parseListingSort("PRICE_ASC"), "PRICE_ASC");
    assert.equal(parseListingSort("price_desc"), "PRICE_DESC");
    assert.equal(parseListingSort(["NAME_ASC", "NEWEST"]), "NAME_ASC");
  });

  it("falls back to the default for anything else", () => {
    assert.equal(parseListingSort(undefined), DEFAULT_LISTING_SORT);
    assert.equal(parseListingSort(""), DEFAULT_LISTING_SORT);
    assert.equal(parseListingSort("createdAt:-1"), DEFAULT_LISTING_SORT);
  });

  it("leaves the default out of the URL and the API call", () => {
    assert.equal(toSortQueryValue(DEFAULT_LISTING_SORT), undefined);
    assert.equal(toSortQueryValue("bogus"), undefined);
    assert.equal(toSortQueryValue("PRICE_ASC"), "PRICE_ASC");
  });

  it("offers the default first and every sort once", () => {
    const values = LISTING_SORT_OPTIONS.map((option) => option.value);
    assert.equal(values[0], DEFAULT_LISTING_SORT);
    assert.equal(new Set(values).size, values.length);
    for (const value of ["NEWEST", "PRICE_ASC", "PRICE_DESC", "NAME_ASC"]) {
      assert.ok(values.includes(value), value);
    }
  });
});
