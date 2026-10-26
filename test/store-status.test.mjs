/**
 * Suspended-store helpers in `src/lib/store-status.js` (PRD-018 FR-1.6)
 *
 * The reason mapping (only `TENANT_NOT_FOUND` + `TENANT_SUSPENDED` holds
 * the store), the probe's fail-open answers, the per-instance cache, the
 * browser reload guard and the 503 page itself.
 *
 * Keep in sync with `storefronts/deveshe-dreams/test/store-status.test.mjs`.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  STORE_UNAVAILABLE_RETRY_AFTER_S,
  buildStoreUnavailableHtml,
  claimSuspendedReload,
  createStoreStatusCache,
  isStoreSuspendedError,
  probeStoreStatus,
  storeStatusEnum,
  storeUnavailableResponse,
} from "../src/lib/store-status.js";

// ─── Helpers ──────────────────────────────────────────────────────────────

const suspended = {
  extensions: { code: "TENANT_NOT_FOUND", reason: "TENANT_SUSPENDED" },
};

function jsonFetch(body) {
  return async () =>
    new Response(typeof body === "string" ? body : JSON.stringify(body));
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

// ─── Mapping ──────────────────────────────────────────────────────────────

describe("store-status: reason mapping", () => {
  it("only TENANT_NOT_FOUND with TENANT_SUSPENDED is a suspended store", () => {
    assert.equal(isStoreSuspendedError([suspended]), true);
    assert.equal(isStoreSuspendedError({ errors: [suspended] }), true);
    assert.equal(
      isStoreSuspendedError([{ extensions: { code: "TENANT_NOT_FOUND" } }]),
      false,
    );
    assert.equal(
      isStoreSuspendedError([
        { extensions: { code: "FORBIDDEN", reason: "TENANT_SUSPENDED" } },
      ]),
      false,
    );
    assert.equal(isStoreSuspendedError(null), false);
  });
});

// ─── Probe and cache ──────────────────────────────────────────────────────

describe("store-status: probe", () => {
  it("maps answers to OK, SUSPENDED or UNKNOWN", async () => {
    const graphqlUrl = "https://api.example.test/v1/graphql";
    assert.equal(
      await probeStoreStatus({ graphqlUrl, fetchImpl: jsonFetch({ data: {} }) }),
      storeStatusEnum.OK,
    );
    assert.equal(
      await probeStoreStatus({
        graphqlUrl,
        fetchImpl: jsonFetch({ errors: [suspended] }),
      }),
      storeStatusEnum.SUSPENDED,
    );
    assert.equal(
      await probeStoreStatus({ graphqlUrl, fetchImpl: jsonFetch("<html>") }),
      storeStatusEnum.UNKNOWN,
    );
    assert.equal(
      await probeStoreStatus({
        graphqlUrl,
        fetchImpl: async () => {
          throw new Error("timeout");
        },
      }),
      storeStatusEnum.UNKNOWN,
    );
    assert.equal(await probeStoreStatus({ graphqlUrl: "" }), storeStatusEnum.UNKNOWN);
  });

  it("caches an answer for its TTL and an UNKNOWN for less", async () => {
    let clock = 0;
    let answers = [storeStatusEnum.UNKNOWN, storeStatusEnum.SUSPENDED];
    let probes = 0;
    const getStatus = createStoreStatusCache({
      probe: async () => {
        probes += 1;
        return answers.shift();
      },
      ttlMs: 30_000,
      unknownTtlMs: 5_000,
      now: () => clock,
    });
    assert.equal(await getStatus(), storeStatusEnum.UNKNOWN);
    clock = 4_000;
    assert.equal(await getStatus(), storeStatusEnum.UNKNOWN);
    clock = 6_000;
    assert.equal(await getStatus(), storeStatusEnum.SUSPENDED);
    clock = 30_000;
    assert.equal(await getStatus(), storeStatusEnum.SUSPENDED);
    assert.equal(probes, 2);
  });
});

// ─── Browser reload guard ─────────────────────────────────────────────────

describe("store-status: reload guard", () => {
  it("allows one reload a minute per tab, and none without storage", () => {
    const storage = memoryStorage();
    const start = Date.UTC(2026, 9, 26);
    assert.equal(claimSuspendedReload(storage, start), true);
    assert.equal(claimSuspendedReload(storage, start + 30_000), false);
    assert.equal(claimSuspendedReload(storage, start + 61_000), true);
    assert.equal(claimSuspendedReload(undefined, start), false);
  });
});

// ─── Page ─────────────────────────────────────────────────────────────────

describe("store-status: unavailable page", () => {
  it("is a 503 with Retry-After, noindex and no-store", async () => {
    const response = storeUnavailableResponse({ brandName: "Brand" });
    assert.equal(response.status, 503);
    assert.equal(
      response.headers.get("retry-after"),
      String(STORE_UNAVAILABLE_RETRY_AFTER_S),
    );
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.match(response.headers.get("content-type"), /^text\/html/);
    assert.doesNotMatch(await response.text(), /<script/i);
  });

  it("escapes the brand and shows only a valid contact email", () => {
    const html = buildStoreUnavailableHtml({
      brandName: "<b>&Co</b>",
      contactEmail: "care@brand.example",
    });
    assert.match(html, /&lt;b&gt;&amp;Co&lt;\/b&gt;/);
    assert.match(html, /mailto:care@brand\.example/);
    const noEmail = buildStoreUnavailableHtml({
      brandName: "Brand",
      contactEmail: "\"><script>",
    });
    assert.doesNotMatch(noEmail, /mailto:/);
  });
});
