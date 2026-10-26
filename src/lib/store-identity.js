/**
 * Store identity endpoint (PRD-018 FR-4.3, Q13/D13) — SERVER ONLY
 *
 * `GET /.well-known/zcom-store` answers `{ slug, signature }`, where
 * `signature` is the hex HMAC-SHA256 of the slug keyed with
 * `EDGE_SHARED_SECRET`. The console's go-live checklist compares both with
 * the store it is checking, which proves the storefront at a verified
 * domain is this store's and shares the platform's edge secret. Served by
 * `middleware.js` (Web Crypto, so it runs on the Edge runtime as well as
 * in `node:test`).
 *
 * The slug comes from the server-only `ZCOM_STORE_SLUG` (the store's
 * `db_configs.slug`, shown in the console): the storefront has no other
 * way to know it, since the API never exposes the slug to shoppers.
 * Without the slug or the secret it answers 503, so the check fails
 * visibly instead of passing on a guess.
 *
 * Keep in sync with
 * `storefronts/deveshe-dreams/src/lib/store-identity.server.js`.
 */

// ─── Constants ────────────────────────────────────────────────────────────

export const STORE_IDENTITY_PATH = "/.well-known/zcom-store";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
};

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Hex HMAC-SHA256 of `slug` keyed with `secret` (the backend's check). */
export async function signStoreSlug(slug, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(slug));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** The endpoint's answer for the given env (a plain `Response`). */
export async function storeIdentityResponse(env = process.env) {
  const slug = (env.ZCOM_STORE_SLUG || "").trim();
  const secret = env.EDGE_SHARED_SECRET || "";
  if (!slug || !secret) {
    return new Response(
      JSON.stringify({ error: "STORE_IDENTITY_NOT_CONFIGURED" }),
      { status: 503, headers: JSON_HEADERS },
    );
  }
  const signature = await signStoreSlug(slug, secret);
  return new Response(JSON.stringify({ slug, signature }), {
    status: 200,
    headers: JSON_HEADERS,
  });
}
