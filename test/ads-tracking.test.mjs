/**
 * Ads tracking (PRD-034 FR-1.2–FR-1.4, FR-1.6, FR-1.9, D8)
 *
 * Runs the real `src/utils/{tracking-config,consent,ads-tracking,
 * ad-click-ids,checkout-start}.js` against a minimal browser shim (storage,
 * cookies, location, a recording `gtag` / `fbq` and `document.head`).
 * Covered: the backend-first / env-fallback tag ids, no ads tag, Pixel or
 * `user_data` without "marketing", the Purchase ids (Pixel eventID and
 * Google transaction_id = order id, variant ids), enhanced-conversion
 * hashing and E.164, click-id capture and persistence, the checkout
 * attribution and consent payload, and the checkout URL parser.
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

const injected = [];
let gtagCalls = [];
let fbqCalls = [];

function resetBrowser({ search = "", cookie = "" } = {}) {
  injected.length = 0;
  gtagCalls = [];
  fbqCalls = [];
  globalThis.localStorage = createStorage();
  globalThis.sessionStorage = createStorage();
  globalThis.document = {
    cookie,
    referrer: "",
    createElement: () => ({}),
    head: { appendChild: (node) => injected.push(node.src) },
  };
  globalThis.window = {
    location: { origin: "https://shop.example", pathname: "/", search },
    dataLayer: [],
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    gtag: (...args) => gtagCalls.push(args),
  };
}

let caseNumber = 0;
async function loadModules() {
  caseNumber += 1;
  const q = `?case=ads-${caseNumber}`;
  return {
    consent: await import(`../src/utils/consent.js${q}`),
    config: await import(`../src/utils/tracking-config.js${q}`),
    ads: await import(`../src/utils/ads-tracking.js${q}`),
    clicks: await import(`../src/utils/ad-click-ids.js${q}`),
    analytics: await import(`../src/utils/analytics.js${q}`),
  };
}

const BACKEND_CONFIG = {
  ga4MeasurementId: "G-BACKEND123",
  metaPixelId: "1234567890",
  googleAds: {
    conversionId: "AW-111222333",
    purchaseLabel: "PurchLbl",
    addToCartLabel: "CartLbl",
    beginCheckoutLabel: null,
    enhancedConversions: true,
  },
};

/** Loads fresh modules with the given tag ids and an applied choice. */
async function setup(consentChoice, config = BACKEND_CONFIG) {
  const modules = await loadModules();
  const tagIds = modules.config.resolveTagIds(config, {
    gaId: "",
    gtmId: "",
    pixelId: "",
  });
  modules.config.setTagIds(tagIds);
  if (consentChoice) {
    modules.consent.saveConsent(consentChoice, modules.config.getTagIds());
    // The Pixel's base code queues calls; record them instead.
    window.fbq = (...args) => fbqCalls.push(args);
  }
  return modules;
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gtagEvents = (name) =>
  gtagCalls.filter((call) => call[0] === "event" && call[1] === name);

// ─── Tag ids (FR-1.2) ─────────────────────────────────────────────────────

describe("tag ids: backend first, env fallback", () => {
  beforeEach(() => resetBrowser());

  it("uses the backend ids when they are set", async () => {
    const { config } = await loadModules();
    const ids = config.resolveTagIds(BACKEND_CONFIG, {
      gaId: "G-ENV",
      gtmId: "GTM-ENV",
      pixelId: "999",
    });
    assert.equal(ids.gaId, "G-BACKEND123");
    assert.equal(ids.pixelId, "1234567890");
    assert.equal(ids.gtmId, "GTM-ENV");
    assert.equal(ids.googleAds.conversionId, "AW-111222333");
  });

  it("falls back to env when the backend value is null or the read failed", async () => {
    const { config } = await loadModules();
    const env = { gaId: "G-ENV", gtmId: "GTM-ENV", pixelId: "999" };
    assert.deepEqual(config.resolveTagIds(null, env), {
      ...env,
      googleAds: null,
    });
    const partial = config.resolveTagIds(
      { ga4MeasurementId: null, metaPixelId: "1234567890", googleAds: null },
      env,
    );
    assert.equal(partial.gaId, "G-ENV");
    assert.equal(partial.pixelId, "1234567890");
  });

  it("reads the env names at load for the default fallback", async () => {
    const saved = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-FROMENV1";
    try {
      const { config } = await loadModules();
      assert.equal(config.resolveTagIds(null).gaId, "G-FROMENV1");
      assert.equal(config.getGaTrackingId(), "G-FROMENV1");
    } finally {
      if (saved === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = saved;
    }
  });

  it("drops a malformed Google Ads block (no env fallback for it)", async () => {
    const { config } = await loadModules();
    const ids = config.resolveTagIds({
      googleAds: { conversionId: "123", purchaseLabel: "x" },
    });
    assert.equal(ids.googleAds, null);
  });
});

// ─── Consent gating (FR-1.3, D8) ──────────────────────────────────────────

describe("ads consent gating", () => {
  beforeEach(() => resetBrowser());

  it("loads no ads tag and no Pixel with analytics only", async () => {
    const { consent, ads } = await setup({ analytics: true, marketing: false });
    assert.equal(consent.isTagLoaded("pixel"), false);
    assert.equal(consent.isTagLoaded("googleAds"), false);
    assert.ok(!injected.some((src) => src.includes("fbevents")));
    assert.ok(!gtagCalls.some((c) => c[0] === "config" && c[1] === "AW-111222333"));
    // Consent Mode keeps the ad types denied
    const update = gtagCalls.find((c) => c[0] === "consent" && c[1] === "update");
    assert.equal(update[2].ad_storage, "denied");
    assert.equal(update[2].ad_user_data, "denied");
    assert.equal(update[2].ad_personalization, "denied");
    assert.equal(update[2].analytics_storage, "granted");

    await ads.trackAdsPurchase({
      orderId: "o1",
      value: 100,
      items: [{ id: "v1", quantity: 1 }],
      customer: { email: "a@b.co", phone: "9876543210" },
    });
    assert.equal(fbqCalls.length, 0);
    assert.equal(gtagEvents("conversion").length, 0);
    assert.ok(!gtagCalls.some((c) => c[0] === "set" && c[1] === "user_data"));
  });

  it("loads the Pixel and the Google Ads tag with marketing", async () => {
    const { consent } = await setup({ analytics: false, marketing: true });
    assert.equal(consent.isTagLoaded("pixel"), true);
    assert.equal(consent.isTagLoaded("googleAds"), true);
    assert.equal(consent.isTagLoaded("ga"), false);
    assert.ok(injected.some((src) => src.includes("gtag/js?id=AW-111222333")));
    const config = gtagCalls.find((c) => c[0] === "config" && c[1] === "AW-111222333");
    assert.equal(config[2].allow_enhanced_conversions, true);
  });

  it("stops ads events after withdrawal and revokes the Pixel", async () => {
    const { consent, ads } = await setup({ analytics: true, marketing: true });
    consent.saveConsent({ analytics: true, marketing: false }, BACKEND_CONFIG);
    assert.deepEqual(fbqCalls.at(-1), ["consent", "revoke"]);
    const update = gtagCalls.filter((c) => c[0] === "consent").at(-1);
    assert.equal(update[2].ad_user_data, "denied");
    fbqCalls = [];
    ads.trackAdsAddToCart({ items: [{ id: "v1", quantity: 1 }], value: 10 });
    assert.equal(fbqCalls.length, 0);
    assert.equal(gtagEvents("conversion").length, 0);
  });
});

// ─── Events (FR-1.3, FR-1.6) ──────────────────────────────────────────────

describe("ads events", () => {
  beforeEach(() => resetBrowser());

  it("sends the purchase with the order id to Meta and Google, variant ids, hashed user data first", async () => {
    const { analytics } = await setup({ analytics: true, marketing: true });
    await analytics.trackEcomEvent.purchase(
      "order-id-1",
      2500,
      [{ productId: "p1", variantId: "v1", qty: 2, finalPrice: 1250, name: "Ring" }],
      0,
      0,
      { currency: "INR", customer: { email: " A@B.Co ", phone: "98765 43210" } },
    );

    const purchase = fbqCalls.find((c) => c[0] === "track" && c[1] === "Purchase");
    assert.deepEqual(purchase[3], { eventID: "order-id-1" });
    assert.deepEqual(purchase[2].content_ids, ["v1"]);
    assert.deepEqual(purchase[2].contents, [{ id: "v1", quantity: 2 }]);
    assert.equal(purchase[2].content_type, "product");
    assert.equal(purchase[2].value, 2500);

    const setIndex = gtagCalls.findIndex((c) => c[0] === "set" && c[1] === "user_data");
    const convIndex = gtagCalls.findIndex(
      (c) => c[0] === "event" && c[1] === "conversion",
    );
    assert.ok(setIndex !== -1 && setIndex < convIndex, "user_data before the conversion");
    assert.deepEqual(gtagCalls[setIndex][2], {
      sha256_email_address: sha256("a@b.co"),
      sha256_phone_number: sha256("+919876543210"),
    });
    assert.ok(!JSON.stringify(gtagCalls).includes("a@b.co"));
    assert.ok(!JSON.stringify(gtagCalls).includes("9876543210\""));
    assert.deepEqual(gtagCalls[convIndex][2], {
      send_to: "AW-111222333/PurchLbl",
      value: 2500,
      currency: "INR",
      transaction_id: "order-id-1",
    });
    const ga = gtagEvents("purchase")[0];
    assert.equal(ga[2].transaction_id, "order-id-1");
    assert.equal(ga[2].send_to, "G-BACKEND123");
  });

  it("sets no user_data when the store hasn't turned enhanced conversions on", async () => {
    const { ads } = await setup(
      { analytics: false, marketing: true },
      { ...BACKEND_CONFIG, googleAds: { ...BACKEND_CONFIG.googleAds, enhancedConversions: false } },
    );
    await ads.trackAdsPurchase({
      orderId: "o2",
      value: 1,
      items: [{ id: "v1", quantity: 1 }],
      customer: { email: "a@b.co" },
    });
    assert.ok(!gtagCalls.some((c) => c[0] === "set" && c[1] === "user_data"));
    assert.equal(gtagEvents("conversion").length, 1);
  });

  it("sends add to cart with its label and skips begin checkout without one", async () => {
    const { ads } = await setup({ analytics: false, marketing: true });
    ads.trackAdsAddToCart({ items: [{ id: "v9", quantity: 1 }], value: 99 });
    ads.trackAdsBeginCheckout({ items: [{ id: "v9", quantity: 3 }], value: 297 });
    const conversions = gtagEvents("conversion");
    assert.equal(conversions.length, 1);
    assert.equal(conversions[0][2].send_to, "AW-111222333/CartLbl");
    const initiate = fbqCalls.find((c) => c[1] === "InitiateCheckout");
    assert.equal(initiate[2].num_items, 3);
    assert.deepEqual(initiate[2].content_ids, ["v9"]);
  });
});

// ─── Normalisation ────────────────────────────────────────────────────────

describe("enhanced-conversion normalisation", () => {
  it("normalises phones to E.164", async () => {
    const { ads } = await loadModules();
    assert.equal(ads.normalizePhoneE164("9876543210"), "+919876543210");
    assert.equal(ads.normalizePhoneE164("098765 43210"), "+919876543210");
    assert.equal(ads.normalizePhoneE164("91-98765-43210"), "+919876543210");
    assert.equal(ads.normalizePhoneE164("+91 98765 43210"), "+919876543210");
    assert.equal(ads.normalizePhoneE164("2025550123", "+1"), "+12025550123");
    assert.equal(ads.normalizePhoneE164("12345"), "");
    assert.equal(ads.normalizePhoneE164(""), "");
  });

  it("normalises email and hashes with SHA-256 hex", async () => {
    const { ads } = await loadModules();
    assert.equal(ads.normalizeEmail("  Shopper@Example.COM "), "shopper@example.com");
    assert.equal(ads.normalizeEmail("not-an-email"), "");
    assert.equal(await ads.sha256Hex("shopper@example.com"), sha256("shopper@example.com"));
    assert.equal(await ads.buildEnhancedUserData({ email: "x", phone: "1" }), null);
  });
});

// ─── Click ids and the checkout payload (FR-1.4) ──────────────────────────

describe("click ids and checkout consent", () => {
  const SEARCH = "?gclid=G1&fbclid=F1&ctwa_clid=W1&utm_source=ads";
  const COOKIE = "_fbp=fb.1.1700000000.111; _fbc=fb.1.1700000000.F1";

  it("keeps click ids for the session only, until marketing is granted", async () => {
    resetBrowser({ search: SEARCH, cookie: COOKIE });
    const { clicks } = await setup({ analytics: true, marketing: false });
    clicks.captureAdClickIds();
    assert.ok(sessionStorage.getItem(clicks.CLICK_IDS_STORAGE_KEY));
    assert.equal(localStorage.getItem(clicks.CLICK_IDS_STORAGE_KEY), null);
    assert.equal(clicks.getAdsAttribution(), null);

    const { attribution, consent } = clicks.getCheckoutTrackingVariables();
    assert.deepEqual(consent, { analytics: true, marketing: false });
    for (const field of ["gclid", "fbclid", "ctwaClid", "fbp", "fbc"]) {
      assert.equal(attribution?.[field], undefined, `${field} needs marketing`);
    }
  });

  it("persists for 90 days and sends ids and _fbp/_fbc with marketing", async () => {
    resetBrowser({ search: SEARCH, cookie: COOKIE });
    const { clicks, consent } = await setup({ analytics: false, marketing: false });
    clicks.captureAdClickIds();
    consent.saveConsent({ analytics: false, marketing: true }, {});
    const now = Date.now();
    clicks.captureAdClickIds(now);
    const stored = JSON.parse(localStorage.getItem(clicks.CLICK_IDS_STORAGE_KEY));
    assert.equal(stored.ids.gclid, "G1");
    assert.ok(Math.abs(stored.expiresAt - (now + 90 * 86400000)) < 1000);

    const { attribution, consent: snapshot } = clicks.getCheckoutTrackingVariables();
    assert.deepEqual(snapshot, { analytics: false, marketing: true });
    assert.equal(attribution.gclid, "G1");
    assert.equal(attribution.fbclid, "F1");
    assert.equal(attribution.ctwaClid, "W1");
    assert.equal(attribution.fbp, "fb.1.1700000000.111");
    assert.equal(attribution.fbc, "fb.1.1700000000.F1");
    // No analytics consent: no UTMs or GA ids
    assert.equal(attribution.utmSource, undefined);

    // A later visit reads the persisted ids; after 90 days they are gone
    sessionStorage.clear();
    assert.equal(clicks.readAdClickIds(now + 89 * 86400000).gclid, "G1");
    assert.equal(clicks.readAdClickIds(now + 91 * 86400000).gclid, undefined);
    assert.equal(localStorage.getItem(clicks.CLICK_IDS_STORAGE_KEY), null);
  });

  it("drops the persisted ids when marketing is withdrawn", async () => {
    resetBrowser({ search: SEARCH });
    const { clicks, consent } = await setup({ analytics: false, marketing: true });
    clicks.captureAdClickIds();
    assert.ok(localStorage.getItem(clicks.CLICK_IDS_STORAGE_KEY));
    consent.saveConsent({ analytics: false, marketing: false }, {});
    clicks.captureAdClickIds();
    assert.equal(localStorage.getItem(clicks.CLICK_IDS_STORAGE_KEY), null);
  });

  it("always sends a consent snapshot, both false before an answer", async () => {
    resetBrowser();
    const { clicks } = await setup(null);
    assert.deepEqual(clicks.getCheckoutTrackingVariables(), {
      attribution: null,
      consent: { analytics: false, marketing: false },
    });
  });

  it("clips values and strips control characters", async () => {
    const { clicks } = await loadModules();
    const ids = clicks.parseClickIds(`?gclid=${"a".repeat(300)}&gbraid=x%0Ay`);
    assert.equal(ids.gclid.length, 200);
    assert.equal(ids.gbraid, "xy");
  });
});

// ─── Checkout URL (FR-1.9) ────────────────────────────────────────────────

describe("checkout URL input", () => {
  const ID_A = "a".repeat(24);
  const ID_B = "0123456789abcdef01234567";

  it("parses variant ids and quantities, merging repeats", async () => {
    const { parseCheckoutStartProducts } = await import("@/utils/checkout-start");
    assert.deepEqual(parseCheckoutStartProducts(`${ID_A}:2,${ID_B}:1,${ID_A}:3`), {
      lines: [
        { variantId: ID_A, qty: 5 },
        { variantId: ID_B, qty: 1 },
      ],
    });
    assert.deepEqual(parseCheckoutStartProducts([`${ID_B}`]), {
      lines: [{ variantId: ID_B, qty: 1 }],
    });
  });

  it("refuses bad ids, quantities and too many lines", async () => {
    const { parseCheckoutStartProducts, CheckoutStartErrorEnum: E } = await import(
      "@/utils/checkout-start"
    );
    assert.equal(parseCheckoutStartProducts("").error, E.EMPTY);
    assert.equal(parseCheckoutStartProducts(undefined).error, E.EMPTY);
    assert.equal(parseCheckoutStartProducts("not-an-id:1").error, E.INVALID_LINE);
    assert.equal(parseCheckoutStartProducts(`${ID_A}:1:2`).error, E.INVALID_LINE);
    assert.equal(parseCheckoutStartProducts(`${ID_A}:0`).error, E.INVALID_QUANTITY);
    assert.equal(parseCheckoutStartProducts(`${ID_A}:11`).error, E.INVALID_QUANTITY);
    assert.equal(parseCheckoutStartProducts(`${ID_A}:-1`).error, E.INVALID_QUANTITY);
    assert.equal(parseCheckoutStartProducts(`${ID_A}:6,${ID_A}:5`).error, E.INVALID_QUANTITY);
    const many = Array.from({ length: 21 }, (_, i) =>
      `${i.toString(16).padStart(24, "0")}:1`,
    ).join(",");
    assert.equal(parseCheckoutStartProducts(many).error, E.TOO_MANY_LINES);
  });
});
