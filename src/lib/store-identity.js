/**
 * Store identity endpoint (PRD-018 FR-4.3, Q13/D13) — SERVER ONLY
 *
 * `GET /.well-known/zcom-store?nonce=<hex>` answers
 * `{ slug, nonce, signature }`, where `signature` is the lowercase hex
 * HMAC-SHA256 of `<slug>:<nonce>` keyed with `EDGE_SHARED_SECRET`. The
 * console's go-live checklist sends a fresh random nonce on every probe
 * and compares all three with the store it is checking, which proves the
 * storefront at a verified domain is this store's and holds the
 * platform's edge secret. The nonce makes each answer single-use: a fixed
 * signature of the slug alone could be copied and replayed by any site
 * (child-PRD review CP-18, PRD-018). Served by `middleware.js` (Web
 * Crypto, so it runs on the Edge runtime as well as in `node:test`).
 *
 * The slug comes from the server-only `ZCOM_STORE_SLUG` (the store's
 * `db_configs.slug`, shown in the console): the storefront has no other
 * way to know it, since the API never exposes the slug to shoppers.
 * Without the slug or the secret it answers 503, so the check fails
 * visibly instead of passing on a guess. A missing or malformed nonce
 * answers 400: the storefront never signs text it didn't check.
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

/**
 * The backend sends 16 random bytes as 32 lowercase hex characters; up to
 * 64 leaves room for a longer challenge without a storefront change.
 */
export const STORE_IDENTITY_NONCE_PATTERN = /^[a-f0-9]{32,64}$/;

// ─── Helpers ──────────────────────────────────────────────────────────────

/** True for a nonce this endpoint will sign (CP-18). */
export function isValidStoreIdentityNonce(nonce) {
  return typeof nonce === "string" && STORE_IDENTITY_NONCE_PATTERN.test(nonce);
}

/**
 * Hex HMAC-SHA256 of `<slug>:<nonce>` keyed with `secret`, the text the
 * backend's `storeIdentitySignature(slug, secret, nonce)` signs (CP-18).
 */
export async function signStoreSlug(slug, nonce, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${slug}:${nonce}`),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/**
 * The endpoint's answer to `request` for the given env (a plain
 * `Response`): 503 when not configured, 400 for a missing or malformed
 * `?nonce=`, else 200 with the signed challenge.
 */
export async function storeIdentityResponse(request, env = process.env) {
  const slug = (env.ZCOM_STORE_SLUG || "").trim();
  const secret = env.EDGE_SHARED_SECRET || "";
  if (!slug || !secret) {
    return jsonResponse({ error: "STORE_IDENTITY_NOT_CONFIGURED" }, 503);
  }
  const nonce = new URL(request.url).searchParams.get("nonce");
  if (!isValidStoreIdentityNonce(nonce)) {
    return jsonResponse({ error: "INVALID_NONCE" }, 400);
  }
  const signature = await signStoreSlug(slug, nonce, secret);
  return jsonResponse({ slug, nonce, signature }, 200);
}
