/**
 * Public stock signal helpers (PRD-020 FR-12..FR-14)
 *
 * `null` availability must behave exactly as before the signal existed:
 * no badge, no note, nothing struck through, nothing blocked, no
 * schema.org availability. The fresh read overrides the rendered value
 * only for the ids it answered.
 *
 * Keep in sync with the other storefront's `test/stock-signal.test.mjs`.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const signal = await import("@/utils/stock-signal");
const { toProductOffers } = await import("@/utils/product-offers");

const variant = (id, availability, extra = {}) => ({
  _id: id,
  status: "PUBLISHED",
  availability,
  availableQuantity: null,
  ...extra,
});

// ─── null = today's behaviour ─────────────────────────────────────────────

describe("no signal", () => {
  it("shows no badge, note or block and omits schema availability", () => {
    const none = signal.resolveVariantSignal(variant("a", null), {});
    assert.equal(signal.isSoldOut(none), false);
    assert.equal(signal.getStockNote(none), null);
    assert.equal(signal.getListingBadge(null), null);
    assert.equal(signal.toSchemaAvailability(null), undefined);
    assert.equal(signal.toInStockFlag(none, true), true);
    assert.equal(signal.toInStockFlag(none, false), false);
    const offers = toProductOffers([{ price: 100 }], "https://s.example/p", null);
    assert.equal("availability" in offers, false);
  });

  it("never blocks a cart without a fresh answer", () => {
    const lines = [{ productId: "p", variantId: "v", qty: 3 }];
    assert.equal(signal.hasSoldOutLine(lines, {}), false);
    assert.deepEqual(signal.getCartLineStock(lines[0], undefined), {
      soldOut: false,
      onlyLeft: null,
    });
  });
});

// ─── Copy ─────────────────────────────────────────────────────────────────

describe("copy", () => {
  it("maps the buckets to listing badges", () => {
    assert.equal(signal.getListingBadge("OUT_OF_STOCK"), "Sold out");
    assert.equal(signal.getListingBadge("LOW_STOCK"), "Low stock");
    assert.equal(signal.getListingBadge("IN_STOCK"), null);
  });

  it("says 'Only N left' only when the count is exposed", () => {
    assert.equal(
      signal.getStockNote({ availability: "LOW_STOCK", availableQuantity: 2 }),
      "Only 2 left",
    );
    assert.equal(
      signal.getStockNote({ availability: "LOW_STOCK", availableQuantity: null }),
      "Low stock",
    );
    assert.equal(
      signal.getStockNote({ availability: "IN_STOCK", availableQuantity: 9 }),
      null,
    );
  });
});

// ─── schema.org (FR-14) ───────────────────────────────────────────────────

describe("schema.org availability", () => {
  it("maps every bucket", () => {
    assert.equal(
      signal.toSchemaAvailability("IN_STOCK"),
      "https://schema.org/InStock",
    );
    assert.equal(
      signal.toSchemaAvailability("LOW_STOCK"),
      "https://schema.org/InStock",
    );
    assert.equal(
      signal.toSchemaAvailability("OUT_OF_STOCK"),
      "https://schema.org/OutOfStock",
    );
    assert.equal(
      signal.toSchemaAvailability("BACKORDER"),
      "https://schema.org/BackOrder",
    );
  });

  it("extends Offer and AggregateOffer", () => {
    const url = "https://s.example/p";
    const single = toProductOffers([{ price: 100 }], url, "OUT_OF_STOCK");
    assert.equal(single["@type"], "Offer");
    assert.equal(single.availability, "https://schema.org/OutOfStock");
    const range = toProductOffers(
      [{ price: 100 }, { price: 200 }],
      url,
      "LOW_STOCK",
    );
    assert.equal(range["@type"], "AggregateOffer");
    assert.equal(range.availability, "https://schema.org/InStock");
  });
});

// ─── Fresh read ───────────────────────────────────────────────────────────

describe("fresh read", () => {
  it("caps and dedupes the ids", () => {
    const ids = Array.from({ length: 60 }, (_, i) => `v${i % 55}`);
    const result = signal.toAvailabilityIds([null, ...ids, ""]);
    assert.equal(result.length, signal.MAX_AVAILABILITY_IDS);
    assert.equal(new Set(result).size, result.length);
  });

  it("overrides the rendered value only for answered ids", () => {
    const fresh = signal.toAvailabilityMap([
      { variantId: "a", availability: "OUT_OF_STOCK", availableQuantity: null },
      { variantId: "c", availability: null, availableQuantity: null },
    ]);
    assert.equal(
      signal.resolveVariantSignal(variant("a", "IN_STOCK"), fresh).availability,
      "OUT_OF_STOCK",
    );
    assert.equal(
      signal.resolveVariantSignal(variant("b", "LOW_STOCK"), fresh).availability,
      "LOW_STOCK",
    );
    // The store turned the signal off since the page was rendered.
    assert.equal(
      signal.resolveVariantSignal(variant("c", "OUT_OF_STOCK"), fresh)
        .availability,
      null,
    );
  });
});

// ─── PDP options and cart ─────────────────────────────────────────────────

describe("option chips", () => {
  const variants = [
    variant("s-red", "OUT_OF_STOCK", { optionValues: ["S", "Red"] }),
    variant("m-red", "IN_STOCK", { optionValues: ["M", "Red"] }),
    variant("s-blue", "OUT_OF_STOCK", { optionValues: ["S", "Blue"] }),
    variant("l-red", null, { optionValues: ["L", "Red"] }),
  ];

  it("strikes a choice only when all its variants are sold out", () => {
    assert.equal(signal.isChoiceSoldOut(variants, "S", [], {}), true);
    assert.equal(signal.isChoiceSoldOut(variants, "M", [], {}), false);
    assert.equal(signal.isChoiceSoldOut(variants, "Red", [], {}), false);
    assert.equal(signal.isChoiceSoldOut(variants, "Red", ["S"], {}), true);
    assert.equal(signal.isChoiceSoldOut(variants, "L", [], {}), false);
    assert.equal(signal.isChoiceSoldOut(variants, "XL", [], {}), false);
  });

  it("uses the fresh read", () => {
    const fresh = signal.toAvailabilityMap([
      { variantId: "s-red", availability: "IN_STOCK" },
    ]);
    assert.equal(signal.isChoiceSoldOut(variants, "S", [], fresh), false);
  });
});

describe("cart lines", () => {
  const fresh = signal.toAvailabilityMap([
    { variantId: "v1", availability: "OUT_OF_STOCK" },
    { variantId: "v2", availability: "LOW_STOCK", availableQuantity: 2 },
    { variantId: "v3", availability: "LOW_STOCK", availableQuantity: null },
  ]);

  it("flags sold-out lines and blocks checkout", () => {
    const lines = [
      { productId: "p1", variantId: "v1", qty: 1 },
      { productId: "p2", variantId: "v2", qty: 1 },
    ];
    assert.equal(signal.getCartLineStock(lines[0], fresh).soldOut, true);
    assert.equal(signal.hasSoldOutLine(lines, fresh), true);
    assert.equal(signal.hasSoldOutLine(lines.slice(1), fresh), false);
  });

  it("says 'Only N left' only above the exposed count", () => {
    assert.equal(
      signal.getCartLineStock({ variantId: "v2", qty: 3 }, fresh).onlyLeft,
      2,
    );
    assert.equal(
      signal.getCartLineStock({ variantId: "v2", qty: 2 }, fresh).onlyLeft,
      null,
    );
    assert.equal(
      signal.getCartLineStock({ variantId: "v3", qty: 9 }, fresh).onlyLeft,
      null,
    );
  });

  it("checks a line without a variant by its product id", () => {
    const productFresh = signal.toAvailabilityMap([
      { variantId: "p9", availability: "OUT_OF_STOCK" },
    ]);
    assert.equal(
      signal.getCartLineStock({ productId: "p9", qty: 1 }, productFresh)
        .soldOut,
      true,
    );
  });
});
