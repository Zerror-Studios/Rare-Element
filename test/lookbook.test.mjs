/**
 * Lookbook rendering rules (backend PRD-027 §6)
 *
 * Mobile image and hotspots, no tiny dots without a mobile image, the
 * look's product strip, look order and safe CTA links.
 *
 * Keep in sync with the other storefront's `test/lookbook.test.mjs`
 * (`src/utils/lookbook.util.js` there).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { featuredProducts, lookProducts, pickLookMedia, sortLooks, toSafeCtaHref } =
  await import("@/utils/lookbook");

const product = (id) => ({ _id: id, name: `P${id}`, slug: `p-${id}` });

const media = {
  type: "IMAGE",
  url: "https://media.example/desk.jpg",
  width: 1200,
  height: 1600,
  alt: "A look",
  hotspots: [
    { x: 0.2, y: 0.4, productId: "a", product: product("a") },
    { x: 1.4, y: -1, productId: "b", product: product("b") },
    { x: 0.5, y: 0.5, productId: "c", product: null },
  ],
  mobile: { url: "https://media.example/mob.jpg", width: 800, height: 1400 },
  mobileHotspots: [{ x: 0.6, y: 0.3, productId: "a", product: product("a") }],
};

describe("lookbook media", () => {
  it("uses the desktop image and its dots on a large screen", () => {
    const picked = pickLookMedia(media, false);
    assert.equal(picked.url, media.url);
    assert.equal(picked.showDots, true);
    // An unpublished product's dot is dropped; positions are clamped to 0–1
    assert.deepEqual(
      picked.hotspots.map((spot) => [spot.productId, spot.x, spot.y]),
      [["a", 0.2, 0.4], ["b", 1, 0]],
    );
  });

  it("uses the mobile image and its own dots on a phone", () => {
    const picked = pickLookMedia(media, true);
    assert.equal(picked.url, media.mobile.url);
    assert.equal(picked.width, 800);
    assert.equal(picked.showDots, true);
    assert.deepEqual(picked.hotspots.map((spot) => spot.x), [0.6]);
  });

  it("shows no dots on a phone without a mobile image", () => {
    const { mobile, ...desktopOnly } = media;
    const picked = pickLookMedia(desktopOnly, true);
    assert.equal(picked.url, media.url);
    assert.equal(picked.showDots, false);
  });

  it("never puts dots on a video", () => {
    const picked = pickLookMedia({ type: "VIDEO", url: "https://m/v.mp4", posterUrl: "https://m/p.jpg" });
    assert.equal(picked.showDots, false);
    assert.equal(picked.posterUrl, "https://m/p.jpg");
    assert.equal(pickLookMedia(null), null);
  });
});

describe("lookbook products and order", () => {
  it("lists the strip first, then hotspot-only products, each once", () => {
    const look = { products: [{ product: product("b") }, { product: null }], media: [media] };
    assert.deepEqual(lookProducts(look).map((p) => p._id), ["b", "a"]);
  });

  it("orders looks by position and drops unpublished featured products", () => {
    assert.deepEqual(sortLooks([{ position: 2 }, { position: 0 }, { position: 1 }]).map((l) => l.position), [0, 1, 2]);
    assert.deepEqual(featuredProducts({ featuredProducts: [{ product: product("x") }, { product: null }] }).map((p) => p._id), ["x"]);
  });
});

describe("lookbook CTA links", () => {
  it("keeps relative paths and https URLs only", () => {
    assert.equal(toSafeCtaHref("/products"), "/products");
    assert.equal(toSafeCtaHref("https://shop.example/x"), "https://shop.example/x");
    assert.equal(toSafeCtaHref("//evil.example"), null);
    assert.equal(toSafeCtaHref("http://shop.example"), null);
    assert.equal(toSafeCtaHref("javascript:alert(1)"), null);
    assert.equal(toSafeCtaHref("/\\evil"), null);
    assert.equal(toSafeCtaHref(undefined), null);
  });
});
