/**
 * Customer access-token manager (PRD-001 phase 2 / PRD-002 SF-9, SF-11)
 *
 * - The access token lives in memory only: never in localStorage or a
 *   JS-readable cookie, so an XSS can't lift a long-lived credential.
 * - The refresh token lives only in the server-set HttpOnly customer cookie
 *   (`__Host-zc_cust_rt`, `zc_cust_rt` in dev). The browser sends it because
 *   the API is same-origin (`/v1/graphql`, proxied to the gateway by
 *   `middleware.js`, PRD-002 R2-C1) and every request uses
 *   `credentials: "include"`.
 * - `refresh()` is single-flight; a timer refreshes shortly before expiry.
 *   It posts to the same `/v1/graphql` proxy; the tenant header it sends is
 *   informational only, since the proxy strips client tenant headers and
 *   sets the configured brand domain (VSEC-4).
 * - When the server says the session is gone (UNAUTHENTICATED/FORBIDDEN on
 *   refresh) subscribers get `"SESSION_ENDED"`; a network failure is not a
 *   logout.
 */

import { print } from "graphql";
import { CUSTOMER_REFRESH_TOKEN } from "@/graphql/mutations/auth.mutation";
import {
  API_VERSION,
  BROWSER_GRAPHQL_URL,
  getBrowserTenantDomain,
} from "@/utils/env";

// ─── Constants ────────────────────────────────────────────────────────────

const REFRESH_LEAD_MS = 60 * 1000;
const MIN_REFRESH_DELAY_MS = 5 * 1000;
const DEFAULT_TOKEN_TTL_MS = 15 * 60 * 1000;
// Only auth answers end the session (R2-C5 adds the tenant codes); network,
// rate-limit and internal errors keep it.
const SESSION_ENDING_CODES = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "INVALID_AUTH_TOKEN",
  "TENANT_MISMATCH",
];

// Legacy access-token storage written by the pre-phase-2 client. The old
// JS `refresh_token` cookie is left alone: the server reads it once during
// its migration window (PRD-001 FR-2.4) and expires it on that refresh.
const LEGACY_LOCAL_KEYS = ["access_token", "token_expiry"];

// ─── State ────────────────────────────────────────────────────────────────

let accessToken = null;
let expiresAt = 0;
let refreshTimer = null;
let inFlight = null;
const listeners = new Set();

const isBrowser = () => typeof window !== "undefined";

/** `exp` (ms) from a JWT payload, or 0 when it can't be read. */
function readJwtExpiry(token) {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return json?.exp ? json.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

function notify(event) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.error("TokenManager listener failed:", error);
    }
  });
}

function scheduleRefresh() {
  if (!isBrowser()) return;
  clearTimeout(refreshTimer);
  if (!accessToken) return;
  const delay = Math.max(
    expiresAt - Date.now() - REFRESH_LEAD_MS,
    MIN_REFRESH_DELAY_MS,
  );
  refreshTimer = setTimeout(() => {
    TokenManager.refresh();
  }, delay);
}

async function requestRefresh() {
  let body = null;
  try {
    const tenant = getBrowserTenantDomain();
    const response = await fetch(BROWSER_GRAPHQL_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "x-api-version": API_VERSION,
        ...(tenant ? { "x-forwarded-host": tenant } : {}),
      },
      body: JSON.stringify({
        operationName: "CustomerRefreshToken",
        query: print(CUSTOMER_REFRESH_TOKEN),
      }),
    });
    body = await response.json().catch(() => null);
  } catch {
    return { token: null, ended: false };
  }

  const token = body?.data?.customerRefreshToken?.accessToken;
  if (token) return { token, ended: false };

  const code = body?.errors?.[0]?.extensions?.code;
  return { token: null, ended: SESSION_ENDING_CODES.includes(code) };
}

// ─── Public API ───────────────────────────────────────────────────────────

export const TokenManager = {
  /** Store a new access token (`expiresIn` in seconds, if known). */
  setAccessToken(token, expiresIn) {
    accessToken = token || null;
    const fromJwt = token ? readJwtExpiry(token) : 0;
    const fromResponse =
      Number(expiresIn) > 0 ? Date.now() + Number(expiresIn) * 1000 : 0;
    expiresAt = token
      ? fromJwt || fromResponse || Date.now() + DEFAULT_TOKEN_TTL_MS
      : 0;
    scheduleRefresh();
  },

  getAccessToken() {
    return accessToken;
  },

  /** True while the in-memory token is present and not past `exp`. */
  hasValidToken() {
    return !!accessToken && Date.now() < expiresAt;
  },

  /**
   * Exchange the HttpOnly refresh cookie for a new access token.
   * Resolves to the token, or null (session ended or network failure).
   */
  refresh() {
    if (!isBrowser()) return Promise.resolve(null);
    if (inFlight) return inFlight;

    inFlight = requestRefresh()
      .then(({ token, ended }) => {
        if (token) {
          TokenManager.setAccessToken(token);
          return token;
        }
        if (ended) {
          TokenManager.clear();
          notify("SESSION_ENDED");
        }
        return null;
      })
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  },

  /** Forget the in-memory token (the cookie is cleared by customerLogout). */
  clear() {
    accessToken = null;
    expiresAt = 0;
    clearTimeout(refreshTimer);
  },

  /** The server rejected the session outright (e.g. INVALID_AUTH_TOKEN). */
  endSession() {
    TokenManager.clear();
    notify("SESSION_ENDED");
  },

  /** Subscribe to `"SESSION_ENDED"`; returns an unsubscribe function. */
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Remove the access token the pre-phase-2 client kept in storage. */
  purgeLegacyStorage() {
    if (!isBrowser()) return;
    try {
      LEGACY_LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Storage can be unavailable (private mode); nothing to purge then.
    }
  },
};
