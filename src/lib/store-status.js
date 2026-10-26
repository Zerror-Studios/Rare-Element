/**
 * Store status: the suspended-store page (PRD-018 FR-1.6, D6)
 *
 * When the platform suspends a store, the gateway answers every edge-signed
 * storefront request with `TENANT_NOT_FOUND` and
 * `extensions.reason: TENANT_SUSPENDED` (DELETED and unknown stores stay a
 * plain `TENANT_NOT_FOUND`). `middleware.js` probes the gateway once per
 * `STORE_STATUS_TTL_MS` (one small anonymous catalog read, single-flight)
 * and, while the store is suspended, answers page requests itself with a
 * branded "temporarily unavailable" page: HTTP 503, `Retry-After`,
 * `noindex`, no catalog data. A page can't set a 503 from React, so the
 * middleware is the one place that can.
 *
 * Fails open: a probe that times out or answers anything else serves the
 * page as before (its own error handling applies). A browser call that
 * meets the reason later reloads the page once (`claimSuspendedReload`).
 *
 * Pure helpers (no Next import) so `node:test` covers them.
 * Keep in sync with `storefronts/deveshe-dreams/src/lib/store-status.util.js`.
 */

// ─── Constants ────────────────────────────────────────────────────────────

export const TENANT_NOT_FOUND_CODE = "TENANT_NOT_FOUND";
export const TENANT_SUSPENDED_REASON = "TENANT_SUSPENDED";

/** Seconds a client should wait before retrying a suspended store. */
export const STORE_UNAVAILABLE_RETRY_AFTER_S = 600;

/** How long one probe answer is reused (per server instance). */
export const STORE_STATUS_TTL_MS = 30_000;

/** A failed probe is retried sooner, so an outage isn't remembered. */
export const STORE_STATUS_UNKNOWN_TTL_MS = 5_000;

/** A probe never holds a page longer than this. */
export const STORE_STATUS_PROBE_TIMEOUT_MS = 2_000;

export const storeStatusEnum = {
  OK: "OK",
  SUSPENDED: "SUSPENDED",
  UNKNOWN: "UNKNOWN",
};

/**
 * The cheapest tenant-scoped storefront read (validated against the
 * schema with the other documents; the gateway answers `{ __typename }`
 * itself, so it can't tell whether the store resolves).
 */
export const STORE_STATUS_PROBE_QUERY =
  "query StoreStatusProbe { getClientSideCategories(limit: 1) { totalCount } }";

// ─── Error mapping ────────────────────────────────────────────────────────

/** True for a GraphQL error list (or response body) of a suspended store. */
export function isStoreSuspendedError(errorsOrBody) {
  const errors = Array.isArray(errorsOrBody)
    ? errorsOrBody
    : errorsOrBody?.errors;
  if (!Array.isArray(errors)) return false;
  return errors.some(
    (error) =>
      error?.extensions?.code === TENANT_NOT_FOUND_CODE &&
      error?.extensions?.reason === TENANT_SUSPENDED_REASON,
  );
}

/** The store status a probe's GraphQL response body stands for. */
export function storeStatusFromBody(body) {
  if (isStoreSuspendedError(body)) return storeStatusEnum.SUSPENDED;
  return body && typeof body === "object"
    ? storeStatusEnum.OK
    : storeStatusEnum.UNKNOWN;
}

// ─── Probe ────────────────────────────────────────────────────────────────

/**
 * One probe of the gateway. Never throws: a network error, a timeout or a
 * body that isn't JSON is `UNKNOWN`.
 */
export async function probeStoreStatus({
  graphqlUrl,
  headers = {},
  fetchImpl = globalThis.fetch,
  timeoutMs = STORE_STATUS_PROBE_TIMEOUT_MS,
}) {
  if (!graphqlUrl || typeof fetchImpl !== "function") {
    return storeStatusEnum.UNKNOWN;
  }
  try {
    const response = await fetchImpl(graphqlUrl, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({
        operationName: "StoreStatusProbe",
        query: STORE_STATUS_PROBE_QUERY,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return storeStatusFromBody(await response.json());
  } catch {
    return storeStatusEnum.UNKNOWN;
  }
}

/**
 * A per-instance cache around a probe: one answer per TTL and at most one
 * probe in flight, so a burst of page requests costs one gateway call.
 */
export function createStoreStatusCache({
  probe,
  ttlMs = STORE_STATUS_TTL_MS,
  unknownTtlMs = STORE_STATUS_UNKNOWN_TTL_MS,
  now = () => Date.now(),
}) {
  let cached = null;
  let pending = null;

  return async function getStoreStatus() {
    if (cached && cached.expiresAt > now()) return cached.status;
    if (!pending) {
      pending = (async () => {
        let status = storeStatusEnum.UNKNOWN;
        try {
          status = await probe();
        } catch {
          status = storeStatusEnum.UNKNOWN;
        }
        const ttl = status === storeStatusEnum.UNKNOWN ? unknownTtlMs : ttlMs;
        cached = { status, expiresAt: now() + ttl };
        pending = null;
        return status;
      })();
    }
    return await pending;
  };
}

// ─── Browser ──────────────────────────────────────────────────────────────

const SUSPENDED_RELOAD_KEY = "zc_store_suspended_reload_at";

/** A tab reloads for a suspension at most this often. */
export const SUSPENDED_RELOAD_INTERVAL_MS = 60_000;

/**
 * A browser API call that answers `TENANT_SUSPENDED` (the store was
 * suspended while the page was open) reloads the page, so the middleware
 * serves the 503 page. True at most once a minute per tab, so a probe
 * answer that is still cached as OK can't loop the page.
 */
export function claimSuspendedReload(storage, now = Date.now()) {
  try {
    const last = Number(storage?.getItem(SUSPENDED_RELOAD_KEY) || 0);
    if (now - last < SUSPENDED_RELOAD_INTERVAL_MS) return false;
    storage.setItem(SUSPENDED_RELOAD_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

// ─── Unavailable page ─────────────────────────────────────────────────────

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

const EMAIL_PATTERN = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;

/** The branded page: no catalog data, no scripts, `noindex`. */
export function buildStoreUnavailableHtml({
  brandName,
  contactEmail = "",
  background = "#ffffff",
  foreground = "#111111",
}) {
  const name = escapeHtml(brandName);
  const email = EMAIL_PATTERN.test(contactEmail || "")
    ? escapeHtml(contactEmail)
    : "";
  const contact = email
    ? `<p>Questions about an order? Write to us at <a href="mailto:${email}">${email}</a>.</p>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${name} | Temporarily unavailable</title>
<style>
  html, body { margin: 0; height: 100%; }
  body {
    display: flex; align-items: center; justify-content: center;
    padding: 24px; box-sizing: border-box;
    background: ${background}; color: ${foreground};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;
    text-align: center;
  }
  main { max-width: 32rem; }
  .brand { font-size: 0.875rem; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 2rem; }
  h1 { font-size: 1.75rem; font-weight: 500; margin: 0 0 1rem; }
  p { line-height: 1.6; margin: 0 0 1rem; }
  a { color: inherit; }
</style>
</head>
<body>
<main>
  <p class="brand">${name}</p>
  <h1>We'll be back soon</h1>
  <p>Our store is temporarily unavailable. Please check back later.</p>
  ${contact}
</main>
</body>
</html>
`;
}

/** The 503 response for a suspended store (a plain `Response`). */
export function storeUnavailableResponse(options) {
  return new Response(buildStoreUnavailableHtml(options), {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "retry-after": String(STORE_UNAVAILABLE_RETRY_AFTER_S),
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
