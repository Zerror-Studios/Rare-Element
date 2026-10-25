/**
 * Order attribution respects the analytics consent (W1V-C-03, FR-1.9)
 *
 * Runs `src/utils/ga-attribution.js` against a minimal browser shim (storage,
 * cookies, location). Without "analytics" consent nothing is stored and
 * checkout gets no GA ids or UTMs, even when old `_ga` cookies exist.
 *
 * Keep in sync with the other storefront's `test/attribution-consent.test.mjs`.
 */

import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

// ─── Browser shim ─────────────────────────────────────────────────────────

const createStorage = () => {
  const items = new Map();
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
    clear: () => items.clear(),
  };
};

globalThis.localStorage = createStorage();
globalThis.sessionStorage = createStorage();
globalThis.document = {
  cookie: "_ga=GA1.1.123456789.1700000000; _ga_ABC=GS1.1.1700000000.3.1",
  referrer: "https://news.example/article",
};
globalThis.window = {
  location: {
    origin: "https://shop.example",
    pathname: "/landing",
    search: "?utm_source=mail&utm_campaign=sale",
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};

const { captureLandingAttribution, getOrderAttribution } = await import(
  "@/utils/ga-attribution"
);
const { CONSENT_STORAGE_KEY, CONSENT_VERSION } = await import(
  "@/utils/consent"
);

const setConsent = (analytics) =>
  localStorage.setItem(
    CONSENT_STORAGE_KEY,
    JSON.stringify({ v: CONSENT_VERSION, analytics, marketing: false }),
  );

// ─── Tests ────────────────────────────────────────────────────────────────

describe("order attribution consent", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("sends nothing before the shopper answers", () => {
    captureLandingAttribution();
    assert.equal(getOrderAttribution(), null);
  });

  it("sends nothing when analytics is rejected, despite old _ga cookies", () => {
    setConsent(false);
    captureLandingAttribution();
    assert.equal(getOrderAttribution(), null);
  });

  it("sends GA ids and UTMs once analytics is granted", () => {
    setConsent(true);
    captureLandingAttribution();
    const attribution = getOrderAttribution();
    assert.equal(attribution.gaClientId, "123456789.1700000000");
    assert.equal(attribution.gaSessionId, "1700000000");
    assert.equal(attribution.utmSource, "mail");
    assert.equal(attribution.landingPage, "/landing");
  });

  it("drops the stored visit when consent is withdrawn", () => {
    setConsent(true);
    captureLandingAttribution();
    setConsent(false);
    assert.equal(getOrderAttribution(), null);
    setConsent(true);
    assert.equal(getOrderAttribution().utmSource, undefined);
  });
});
