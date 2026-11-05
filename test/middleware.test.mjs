/**
 * `/v1/graphql` proxy security in `src/middleware.js` (PRD-014 FR-1.7, QA-12)
 *
 * Runs the real middleware with Next's real `NextRequest` / `NextResponse`
 * (see `register-hooks.mjs`). A rewrite is read the way Next applies it:
 * `x-middleware-rewrite` is the target and `x-middleware-request-<name>`
 * the headers the gateway receives (`x-middleware-override-headers` lists
 * every header that survives, so anything missing there was stripped).
 *
 * Covered (audit F SF-6, VSEC-3/4, PRD-007 FR-8.2): client tenant and
 * `x-zcom-*` headers stripped, Origin/Referer dropped, `x-tenant-domain`
 * and the edge secret added, fail closed without a tenant domain or a
 * gateway, the client IP only from the host's trusted source, and the
 * account route guard.
 */

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, describe, it } from "node:test";

import { NextRequest } from "./next-server.shim.mjs";

// ─── Helpers ──────────────────────────────────────────────────────────────

const ENV_NAMES = [
  "NODE_ENV",
  "API_GATEWAY_URL",
  "NEXT_PUBLIC_TENANT_DOMAIN",
  "EDGE_SHARED_SECRET",
  "VERCEL",
  "ZCOM_STORE_SLUG",
];
const savedEnv = Object.fromEntries(ENV_NAMES.map((name) => [name, process.env[name]]));
const savedFetch = globalThis.fetch;
let caseNumber = 0;

/** Fresh modules for this env (env.js reads the domain at load). */
async function loadMiddleware(env) {
  for (const name of ENV_NAMES) delete process.env[name];
  Object.assign(process.env, env);
  caseNumber += 1;
  return await import(`../src/middleware.js?case=${caseNumber}`);
}

function graphqlRequest(headers = {}, url = "https://shop.example/v1/graphql") {
  return new NextRequest(url, { method: "POST", headers, body: "{}" });
}

/** What the gateway would receive from a rewrite. */
function forwarded(response) {
  const kept = (response.headers.get("x-middleware-override-headers") || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const headers = {};
  for (const name of kept) {
    headers[name] = response.headers.get(`x-middleware-request-${name}`);
  }
  return { target: response.headers.get("x-middleware-rewrite"), headers };
}

const PRODUCTION = {
  NODE_ENV: "production",
  API_GATEWAY_URL: "https://api.example.test/",
  NEXT_PUBLIC_TENANT_DOMAIN: "brand.example",
  EDGE_SHARED_SECRET: "edge-secret-for-tests-0123456789abcdef",
};

/** Stubs the gateway probe (PRD-018): `body` is its GraphQL answer. */
function stubGateway(body) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(body), {
      headers: { "content-type": "application/json" },
    });
  };
  return calls;
}

const ACTIVE_ANSWER = { data: { getClientSideCategories: { totalCount: 3 } } };
const SUSPENDED_ANSWER = {
  data: null,
  errors: [
    {
      message: "This store is not available",
      extensions: { code: "TENANT_NOT_FOUND", reason: "TENANT_SUSPENDED" },
    },
  ],
};

afterEach(() => {
  globalThis.fetch = savedFetch;
  for (const name of ENV_NAMES) {
    if (savedEnv[name] === undefined) delete process.env[name];
    else process.env[name] = savedEnv[name];
  }
});

// ─── Proxy ────────────────────────────────────────────────────────────────

describe("rare-element middleware: /v1/graphql proxy", () => {
  it("rewrites to the gateway with the query string kept", async () => {
    const { middleware, config } = await loadMiddleware(PRODUCTION);
    assert.ok(config.matcher.includes("/v1/graphql"));
    const response = middleware(graphqlRequest({}, "https://shop.example/v1/graphql?op=GetCart"));
    assert.equal(forwarded(response).target, "https://api.example.test/v1/graphql?op=GetCart");
  });

  it("strips every client tenant, x-zcom-* and browser-only header", async () => {
    const { middleware } = await loadMiddleware(PRODUCTION);
    const response = middleware(
      graphqlRequest({
        "x-tenant-domain": "victim.example",
        "x-forwarded-host": "victim.example",
        "x-zcom-store": "victim",
        "x-zcom-edge-secret": "forged",
        "x-zcom-client-ip": "6.6.6.6",
        "x-zcom-anything": "x",
        origin: "https://evil.example",
        referer: "https://evil.example/page",
        "content-type": "application/json",
        cookie: "__Host-zc_cust_rt=abc",
      }),
    );
    const { headers } = forwarded(response);
    assert.equal(headers["x-tenant-domain"], "brand.example");
    assert.equal(headers["x-zcom-edge-secret"], PRODUCTION.EDGE_SHARED_SECRET);
    for (const name of ["x-forwarded-host", "x-zcom-store", "x-zcom-anything", "origin", "referer"]) {
      assert.equal(name in headers, false, `${name} must not reach the gateway`);
    }
    assert.notEqual(headers["x-zcom-client-ip"], "6.6.6.6");
    // The shopper's own headers still pass
    assert.equal(headers["content-type"], "application/json");
    assert.equal(headers.cookie, "__Host-zc_cust_rt=abc");
  });

  it("forwards the browser's real user agent (PRD-034 FR-1.4)", async () => {
    const { middleware } = await loadMiddleware(PRODUCTION);
    const userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)";
    const { headers } = forwarded(
      middleware(graphqlRequest({ "user-agent": userAgent })),
    );
    assert.equal(headers["user-agent"], userAgent);
  });

  it("adds no edge secret when none is configured", async () => {
    const { middleware } = await loadMiddleware({ ...PRODUCTION, EDGE_SHARED_SECRET: "" });
    const { headers } = forwarded(middleware(graphqlRequest({ "x-zcom-edge-secret": "forged" })));
    assert.equal("x-zcom-edge-secret" in headers, false);
    assert.equal(headers["x-tenant-domain"], "brand.example");
  });

  it("fails closed in production without NEXT_PUBLIC_TENANT_DOMAIN", async () => {
    const { middleware } = await loadMiddleware({ ...PRODUCTION, NEXT_PUBLIC_TENANT_DOMAIN: "" });
    const response = middleware(graphqlRequest({ "x-tenant-domain": "victim.example" }));
    assert.equal(response.status, 500);
    assert.equal(response.headers.get("x-middleware-rewrite"), null);
    const body = await response.json();
    assert.equal(body.errors[0].message, "The store is not available right now.");
  });

  it("answers 503 without a gateway URL and never forwards", async () => {
    const { middleware } = await loadMiddleware({ ...PRODUCTION, API_GATEWAY_URL: "" });
    const response = middleware(graphqlRequest());
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("x-middleware-rewrite"), null);
  });

  it("uses the dev fallback domain only outside production", async () => {
    const { middleware } = await loadMiddleware({
      NODE_ENV: "development",
      API_GATEWAY_URL: "http://localhost:4000",
    });
    const { headers } = forwarded(middleware(graphqlRequest({ "x-tenant-domain": "victim.example" })));
    assert.equal(headers["x-tenant-domain"], "localhost:3000");
  });
});

// ─── Client IP ────────────────────────────────────────────────────────────

describe("rare-element middleware: client IP source (VSEC-3)", () => {
  it("elsewhere: the right-most x-forwarded-for hop, never x-real-ip or a Vercel header", async () => {
    const { middleware } = await loadMiddleware(PRODUCTION);
    const { headers } = forwarded(
      middleware(
        graphqlRequest({
          "x-forwarded-for": "6.6.6.6, 198.51.100.20",
          "x-real-ip": "7.7.7.7",
          "x-vercel-forwarded-for": "8.8.8.8",
        }),
      ),
    );
    assert.equal(headers["x-zcom-client-ip"], "198.51.100.20");
  });

  it("on Vercel: x-vercel-forwarded-for, which Vercel overwrites", async () => {
    const { middleware } = await loadMiddleware({ ...PRODUCTION, VERCEL: "1" });
    const { headers } = forwarded(
      middleware(
        graphqlRequest({
          "x-vercel-forwarded-for": "198.51.100.21",
          "x-forwarded-for": "6.6.6.6, 198.51.100.99",
        }),
      ),
    );
    assert.equal(headers["x-zcom-client-ip"], "198.51.100.21");
  });

  it("sends no client IP rather than a guessed one", async () => {
    const { middleware } = await loadMiddleware(PRODUCTION);
    const { headers } = forwarded(middleware(graphqlRequest({ "x-real-ip": "7.7.7.7" })));
    assert.equal("x-zcom-client-ip" in headers, false);
  });
});

// ─── Route guard ──────────────────────────────────────────────────────────

describe("rare-element middleware: account and checkout guard", () => {
  it("sends a visitor without the session cookie to /login with next", async () => {
    const { middleware } = await loadMiddleware(PRODUCTION);
    stubGateway(ACTIVE_ANSWER);
    const response = await middleware(new NextRequest("https://shop.example/account/orders?page=2"));
    assert.equal(response.status, 307);
    const location = new URL(response.headers.get("location"));
    assert.equal(location.pathname, "/login");
    assert.equal(location.searchParams.get("next"), "/account/orders?page=2");
  });

  it("lets a session cookie and the public checkout result pages through", async () => {
    const { middleware } = await loadMiddleware(PRODUCTION);
    stubGateway(ACTIVE_ANSWER);
    const withCookie = await middleware(
      new NextRequest("https://shop.example/checkout", { headers: { cookie: "__Host-zc_cust_rt=abc" } }),
    );
    assert.equal(withCookie.headers.get("x-middleware-next"), "1");
    const thankYou = await middleware(new NextRequest("https://shop.example/checkout/thank-you"));
    assert.equal(thankYou.headers.get("x-middleware-next"), "1");
  });

  it("lets a guest open the checkout URL (PRD-034 FR-1.9)", async () => {
    const { middleware } = await loadMiddleware(PRODUCTION);
    stubGateway(ACTIVE_ANSWER);
    const start = await middleware(
      new NextRequest("https://shop.example/checkout/start?products=a:1"),
    );
    assert.equal(start.headers.get("x-middleware-next"), "1");
  });
});

// ─── Suspended store (PRD-018 FR-1.6) ─────────────────────────────────────

describe("rare-element middleware: suspended store page", () => {
  it("serves the branded 503 with Retry-After and noindex", async () => {
    const { middleware } = await loadMiddleware(PRODUCTION);
    const calls = stubGateway(SUSPENDED_ANSWER);
    const response = await middleware(new NextRequest("https://shop.example/products/ring"));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), "600");
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
    assert.equal(response.headers.get("cache-control"), "no-store");
    const html = await response.text();
    assert.match(html, /Nahara/);
    assert.match(html, /temporarily unavailable/);
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
    // The probe is edge-signed for the brand domain
    assert.equal(calls[0].url, "https://api.example.test/v1/graphql");
    assert.equal(calls[0].init.headers["x-tenant-domain"], "brand.example");
    assert.equal(calls[0].init.headers["x-zcom-edge-secret"], PRODUCTION.EDGE_SHARED_SECRET);
  });

  it("holds account pages too, but never the API proxy", async () => {
    const { middleware } = await loadMiddleware(PRODUCTION);
    stubGateway(SUSPENDED_ANSWER);
    const account = await middleware(new NextRequest("https://shop.example/account/orders"));
    assert.equal(account.status, 503);
    const proxied = middleware(graphqlRequest());
    assert.equal(forwarded(proxied).target, "https://api.example.test/v1/graphql");
  });

  it("probes once per TTL for a burst of pages", async () => {
    const { middleware } = await loadMiddleware(PRODUCTION);
    const calls = stubGateway(ACTIVE_ANSWER);
    const responses = await Promise.all([
      middleware(new NextRequest("https://shop.example/")),
      middleware(new NextRequest("https://shop.example/about")),
    ]);
    responses.forEach((response) => assert.equal(response.headers.get("x-middleware-next"), "1"));
    assert.equal(calls.length, 1);
  });

  it("fails open when the probe can't reach the gateway", async () => {
    const { middleware } = await loadMiddleware(PRODUCTION);
    globalThis.fetch = async () => {
      throw new Error("ECONNREFUSED");
    };
    const response = await middleware(new NextRequest("https://shop.example/"));
    assert.equal(response.headers.get("x-middleware-next"), "1");
  });

  it("runs on every page but not on assets, _next or api routes", async () => {
    const { config } = await loadMiddleware(PRODUCTION);
    const pattern = new RegExp(`^${config.matcher[2]}$`);
    assert.ok(pattern.test("/products/ring"));
    assert.ok(pattern.test("/"));
    for (const path of ["/_next/static/x.js", "/api/payments/return", "/robots.txt", "/images/a.webp"]) {
      assert.equal(pattern.test(path), false, path);
    }
  });
});

// ─── Store identity (PRD-018 FR-4.3) ──────────────────────────────────────

/** A challenge as the backend sends it: 16 random bytes in hex. */
const NONCE = "0123456789abcdef0123456789abcdef";

describe("rare-element middleware: /.well-known/zcom-store", () => {
  it("answers the slug and the nonce signed together (CP-18)", async () => {
    const { middleware, config } = await loadMiddleware({ ...PRODUCTION, ZCOM_STORE_SLUG: "nahara" });
    assert.ok(config.matcher.includes("/.well-known/zcom-store"));
    const response = await middleware(new NextRequest(`https://shop.example/.well-known/zcom-store?nonce=${NONCE}`));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    // The backend's storeIdentitySignature(slug, secret, nonce)
    const expected = createHmac("sha256", PRODUCTION.EDGE_SHARED_SECRET).update(`nahara:${NONCE}`).digest("hex");
    assert.deepEqual(body, { slug: "nahara", nonce: NONCE, signature: expected });
  });

  it("signs each nonce differently, so an answer can't be replayed", async () => {
    const { middleware } = await loadMiddleware({ ...PRODUCTION, ZCOM_STORE_SLUG: "nahara" });
    const other = "f".repeat(64);
    const first = await (await middleware(new NextRequest(`https://shop.example/.well-known/zcom-store?nonce=${NONCE}`))).json();
    const second = await (await middleware(new NextRequest(`https://shop.example/.well-known/zcom-store?nonce=${other}`))).json();
    assert.equal(second.nonce, other);
    assert.notEqual(first.signature, second.signature);
  });

  it("answers 400 for a missing or malformed nonce, and signs nothing", async () => {
    const { middleware } = await loadMiddleware({ ...PRODUCTION, ZCOM_STORE_SLUG: "nahara" });
    const bad = ["", "?nonce=", "?nonce=abc", `?nonce=${"A".repeat(32)}`, `?nonce=${"a".repeat(65)}`, `?nonce=${"g".repeat(32)}`, `?nonce=${NONCE}%0A`];
    for (const query of bad) {
      const response = await middleware(new NextRequest(`https://shop.example/.well-known/zcom-store${query}`));
      assert.equal(response.status, 400, query);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal("signature" in (await response.json()), false);
    }
  });

  it("answers 503 without a slug or a secret", async () => {
    for (const env of [{ ...PRODUCTION }, { ...PRODUCTION, ZCOM_STORE_SLUG: "nahara", EDGE_SHARED_SECRET: "" }]) {
      const { middleware } = await loadMiddleware(env);
      const response = await middleware(new NextRequest(`https://shop.example/.well-known/zcom-store?nonce=${NONCE}`));
      assert.equal(response.status, 503);
      assert.equal("signature" in (await response.json()), false);
    }
  });
});
