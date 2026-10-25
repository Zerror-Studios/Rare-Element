/**
 * Safe post-login redirect (PRD-002 RSEC-6)
 *
 * `?next=` is attacker-controlled, so a prefix check isn't enough: browsers
 * treat `/\evil.com` like `//evil.com`, and strip tabs and newlines inside
 * URLs. The value is resolved with `new URL(next, origin)` and kept only
 * when it stays on the same origin; anything else falls back to `/`.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/redirect.util.js`.
 */

// ─── Constants ────────────────────────────────────────────────────────────

const DEFAULT_PATH = "/";
const LOGIN_PATH = "/login";
const FALLBACK_ORIGIN = "http://localhost";
// Backslashes and control characters (browsers drop or rewrite them).
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARS_PATTERN = /[\\\u0000-\u001f\u007f-\u009f]/;

// ─── Helpers ──────────────────────────────────────────────────────────────

const currentOrigin = () =>
  typeof window !== "undefined" ? window.location.origin : FALLBACK_ORIGIN;

/**
 * Same-origin path (`/path?query#hash`) for `next`, or `fallback`.
 * `origin` defaults to the page origin in the browser.
 */
export const getSafeNextPath = (
  next,
  fallback = DEFAULT_PATH,
  origin = currentOrigin(),
) => {
  const value = Array.isArray(next) ? next[0] : next;
  if (typeof value !== "string" || !value) return fallback;
  if (UNSAFE_CHARS_PATTERN.test(value)) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;

  let url;
  let base;
  try {
    base = new URL(origin);
    url = new URL(value, base);
  } catch {
    return fallback;
  }
  if (url.origin !== base.origin) return fallback;
  if (url.pathname === LOGIN_PATH || url.pathname.startsWith(`${LOGIN_PATH}/`)) {
    return fallback;
  }
  return `${url.pathname}${url.search}${url.hash}`;
};

/** Safe `?next=` of the current page (set by the route middleware). */
export const getNextPath = (fallback = DEFAULT_PATH) => {
  if (typeof window === "undefined") return fallback;
  const next = new URLSearchParams(window.location.search).get("next");
  return getSafeNextPath(next, fallback);
};
