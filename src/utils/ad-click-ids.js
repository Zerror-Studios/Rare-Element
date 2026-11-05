/**
 * Ad click ids and the checkout consent snapshot (PRD-034 FR-1.4, D8)
 *
 * - On landing, `gclid`, `gbraid`, `wbraid`, `fbclid` and `ctwa_clid` are
 *   read from the URL and kept for the session (sessionStorage), whatever
 *   the consent, so a shopper who agrees later in the visit still counts.
 * - They are persisted (localStorage, 90 days) only once "marketing" is
 *   granted, and the persisted copy is dropped when it is withdrawn.
 * - Checkout sends them, with Meta's `_fbp` / `_fbc` cookies, in
 *   `attribution` **only with "marketing" consent**, and always sends
 *   `consent: { analytics, marketing }` with the current choice. The GA ids
 *   and UTMs stay in `utils/ga-attribution.js` (analytics consent).
 *
 * The server keeps the click ids, the shopper's IP and user agent only
 * when `consent.marketing` is true. Nothing here is trusted for money.
 */

import { CONSENT_CHANGE_EVENT, readConsent } from "./consent";
import { getOrderAttribution } from "./ga-attribution";

// ─── Constants ────────────────────────────────────────────────────────────

export const CLICK_IDS_STORAGE_KEY = "zc_ad_click_ids";
export const CLICK_IDS_PERSIST_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_LENGTH = 200;

/** URL parameter → `OrderAttributionInput` field. */
export const CLICK_ID_PARAMS = Object.freeze({
  gclid: "gclid",
  gbraid: "gbraid",
  wbraid: "wbraid",
  fbclid: "fbclid",
  ctwa_clid: "ctwaClid",
});
const CLICK_ID_FIELDS = Object.values(CLICK_ID_PARAMS);

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Trimmed, control characters stripped, at most 200 characters. */
const clip = (value) =>
  typeof value === "string"
    ? value
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, MAX_LENGTH)
    : "";

const hasMarketingConsent = () => readConsent()?.marketing === true;

const pickClickIds = (source) => {
  const ids = {};
  for (const field of CLICK_ID_FIELDS) {
    const value = clip(source?.[field]);
    if (value) ids[field] = value;
  }
  return ids;
};

const readJson = (storage) => {
  try {
    return JSON.parse(storage.getItem(CLICK_IDS_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

const writeJson = (storage, value) => {
  try {
    storage.setItem(CLICK_IDS_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage unavailable: the ids hold for this page view only.
  }
};

const removeFrom = (storage) => {
  try {
    storage.removeItem(CLICK_IDS_STORAGE_KEY);
  } catch {
    // Storage unavailable: nothing was stored.
  }
};

function readCookie(name) {
  if (typeof document === "undefined") return "";
  for (const pair of String(document.cookie || "").split(";")) {
    const index = pair.indexOf("=");
    if (index === -1) continue;
    if (pair.slice(0, index).trim() === name) {
      return clip(pair.slice(index + 1));
    }
  }
  return "";
}

/** The persisted ids still inside their 90 days (expired ones removed). */
function readPersisted(now) {
  const stored = readJson(localStorage);
  if (!stored) return {};
  if (!(Number(stored.expiresAt) > now)) {
    removeFrom(localStorage);
    return {};
  }
  return pickClickIds(stored.ids);
}

function persist(ids, now) {
  if (!Object.keys(ids).length) return;
  writeJson(localStorage, {
    ids,
    expiresAt: now + CLICK_IDS_PERSIST_DAYS * DAY_MS,
  });
}

// ─── Public API ───────────────────────────────────────────────────────────

/** The click ids in a query string (`?gclid=…`), as attribution fields. */
export function parseClickIds(search) {
  const params = new URLSearchParams(search || "");
  const ids = {};
  for (const [param, field] of Object.entries(CLICK_ID_PARAMS)) {
    const value = clip(params.get(param));
    if (value) ids[field] = value;
  }
  return ids;
}

/** Session ids over persisted ones (a newer click wins). */
export function readAdClickIds(now = Date.now()) {
  if (typeof window === "undefined") return {};
  const session = pickClickIds(readJson(sessionStorage)?.ids);
  const persisted = hasMarketingConsent() ? readPersisted(now) : {};
  return { ...persisted, ...session };
}

/**
 * Reads the URL once per page load: new ids go to the session, and to
 * localStorage with marketing consent; without it the persisted copy is
 * dropped.
 */
export function captureAdClickIds(now = Date.now()) {
  if (typeof window === "undefined") return;
  const fromUrl = parseClickIds(window.location?.search);
  if (Object.keys(fromUrl).length) {
    const session = pickClickIds(readJson(sessionStorage)?.ids);
    writeJson(sessionStorage, { ids: { ...session, ...fromUrl } });
  }
  if (hasMarketingConsent()) {
    // The 90 days run from the click: re-persist only for a new click or
    // the first grant (never slide the expiry on every page).
    const persisted = readPersisted(now);
    if (Object.keys(fromUrl).length || !Object.keys(persisted).length) {
      persist(readAdClickIds(now), now);
    }
  } else {
    removeFrom(localStorage);
  }
}

/** Call once on app mount; re-runs when the banner is answered. */
export function startAdClickIdCapture() {
  if (typeof window === "undefined") return () => {};
  const onConsentChange = () => captureAdClickIds();
  captureAdClickIds();
  window.addEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
  return () =>
    window.removeEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
}

/** Click ids + `_fbp` / `_fbc`, or null without marketing consent. */
export function getAdsAttribution(now = Date.now()) {
  if (typeof window === "undefined" || !hasMarketingConsent()) return null;
  const fbp = readCookie("_fbp");
  const fbc = readCookie("_fbc");
  const attribution = {
    ...readAdClickIds(now),
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
  };
  return Object.keys(attribution).length > 0 ? attribution : null;
}

/** The shopper's current cookie choice (both false before an answer). */
export function getCheckoutConsent() {
  const consent = readConsent();
  return {
    analytics: consent?.analytics === true,
    marketing: consent?.marketing === true,
  };
}

/**
 * `{ attribution, consent }` for `createCheckoutSessionFromCart`: GA ids
 * and UTMs under analytics consent, ad ids under marketing consent.
 */
export function getCheckoutTrackingVariables(now = Date.now()) {
  const attribution = {
    ...(getOrderAttribution() || {}),
    ...(getAdsAttribution(now) || {}),
  };
  return {
    attribution: Object.keys(attribution).length > 0 ? attribution : null,
    consent: getCheckoutConsent(),
  };
}
