/**
 * SEO helpers (PRD-014 FR-2.8, UX-33)
 *
 * Product JSON-LD offers (availability only from the PRD-020 signal) and the
 * robots.txt sitemap URL, which follows the configured site origin instead
 * of a hard-coded domain.
 *
 * Keep in sync with the other storefront's `test/seo-helpers.test.mjs`.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { toProductOffers } = await import("@/utils/product-offers");

// ─── Offers ───────────────────────────────────────────────────────────────

describe("toProductOffers", () => {
  const url = "https://shop.example/products/a";

  it("returns one Offer for a single price, without availability", () => {
    const offers = toProductOffers([{ price: 1200, status: "PUBLISHED" }], url);
    assert.equal(offers["@type"], "Offer");
    assert.equal(offers.price, 1200);
    assert.equal(offers.priceCurrency, "INR");
    assert.equal("availability" in offers, false);
  });

  it("returns an AggregateOffer for a price range, skipping archived", () => {
    const offers = toProductOffers(
      [
        { price: 900 },
        { price: 1500 },
        { price: 100, status: "ARCHIVED" },
        { price: 0 },
        { price: null },
      ],
      url,
    );
    assert.equal(offers["@type"], "AggregateOffer");
    assert.equal(offers.lowPrice, 900);
    assert.equal(offers.highPrice, 1500);
    assert.equal(offers.offerCount, 2);
  });

  it("returns undefined when no variant has a price", () => {
    assert.equal(toProductOffers([], url), undefined);
    assert.equal(toProductOffers(undefined, url), undefined);
  });
});

// ─── robots.txt ───────────────────────────────────────────────────────────

describe("robots", () => {
  it("points at the configured site's own sitemap", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://store.example/";
    const { default: robots } = await import("../src/app/robots.js?case=1");
    const result = robots();
    assert.equal(result.sitemap, "https://store.example/sitemap.xml");
    assert.ok(result.rules[0].disallow.includes("/checkout"));
    // CP-22: single-use confirmation links stay out of the crawl
    assert.ok(result.rules[0].disallow.includes("/back-in-stock/"));
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });
});

// ─── Site origin (W2V-C-04) ───────────────────────────────────────────────

describe("site origin", () => {
  it("falls back to the tenant domain, never another brand's domain", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_TENANT_DOMAIN = "uat.store.example";
    const env = await import("../src/utils/env.js?case=2");
    assert.equal(env.SITE_URL, "https://uat.store.example");
    assert.equal(env.SITE_URL_CONFIGURED, true);
    assert.equal(env.indexableRobots(), "index, follow");
    delete process.env.NEXT_PUBLIC_TENANT_DOMAIN;
  });

  it("is noindex and keeps crawlers out when no origin is configured", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_TENANT_DOMAIN;
    const env = await import("../src/utils/env.js?case=3");
    assert.equal(env.SITE_URL_CONFIGURED, false);
    assert.ok(!env.SITE_URL.includes("nahara"));
    assert.equal(env.indexableRobots(), "noindex, nofollow");
    const { default: robots } = await import("../src/app/robots.js?case=3");
    const result = robots();
    assert.equal(result.sitemap, undefined);
    assert.equal(result.rules[0].disallow, "/");
  });
});
