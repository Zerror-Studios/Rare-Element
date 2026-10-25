/**
 * Listing sort query values (PRD-014 Wave 2, W2-STORE)
 *
 * `?sort=` reads as one of the backend's `ClientProductSort` values; an
 * unknown or missing value is NEWEST, which is never written to the URL.
 *
 * Keep in sync with the other storefront's `test/listing-sort.test.mjs`
 * (`src/utils/listing-sort.util.js` there).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { parseListingSort, toSortQueryValue, LISTING_SORT_OPTIONS } =
  await import("@/utils/listing-sort");

describe("listing sort", () => {
  it("reads known values, case-insensitively, from a string or an array", () => {
    assert.equal(parseListingSort("PRICE_ASC"), "PRICE_ASC");
    assert.equal(parseListingSort("price_desc"), "PRICE_DESC");
    assert.equal(parseListingSort(["NAME_ASC", "NEWEST"]), "NAME_ASC");
  });

  it("falls back to NEWEST for anything else", () => {
    assert.equal(parseListingSort(undefined), "NEWEST");
    assert.equal(parseListingSort(""), "NEWEST");
    assert.equal(parseListingSort("createdAt:-1"), "NEWEST");
  });

  it("leaves the default out of the URL", () => {
    assert.equal(toSortQueryValue("NEWEST"), undefined);
    assert.equal(toSortQueryValue("bogus"), undefined);
    assert.equal(toSortQueryValue("PRICE_ASC"), "PRICE_ASC");
  });

  it("offers every backend value once", () => {
    assert.deepEqual(
      LISTING_SORT_OPTIONS.map((option) => option.value),
      ["NEWEST", "PRICE_ASC", "PRICE_DESC", "NAME_ASC"],
    );
  });
});
