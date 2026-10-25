/**
 * Visit attribution for orders (PRD-012)
 * Keep in sync with deveshe-dreams `utils/ga-attribution.util.js`.
 *
 * What the storefront already knows about the visit, sent with
 * `createCheckoutSessionFromCart` so the backend can attribute the order:
 * the GA client and session ids from Google's own cookies (so the
 * server-side purchase event lands in the shopper's GA4 session), and the
 * UTM parameters, referrer and landing page captured on the first page of
 * the visit (kept in `sessionStorage` for the session). Nothing here is
 * trusted for money; the server only stores it.
 *
 * Consent (W1V-C-03, PRD-014 FR-1.9): nothing is captured, stored or sent
 * unless the shopper granted "analytics". Without it (or after it is
 * withdrawn) the stored visit is dropped and checkout sends no attribution,
 * so old `_ga` cookies from before the banner never reach GA4 server-side.
 */

import { CONSENT_CHANGE_EVENT, readConsent } from "./consent";

const STORAGE_KEY = "zc_visit_attribution";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const MAX_LENGTH = 200;

const clip = (value) => (typeof value === "string" ? value.trim().slice(0, MAX_LENGTH) : "");

/** `GA1.1.123456789.1700000000` → `123456789.1700000000`. */
export function parseGaClientId(cookieValue) {
  const parts = String(cookieValue || "").split(".");
  return parts.length >= 4 ? `${parts[2]}.${parts[3]}` : "";
}

/** `GS1.1.1700000000.3.1.1700000100.0.0.0` → `1700000000` (the session id). */
export function parseGaSessionId(cookieValue) {
  const parts = String(cookieValue || "").split(".");
  return parts.length >= 3 && /^\d+$/.test(parts[2]) ? parts[2] : "";
}

function readCookies() {
  if (typeof document === "undefined") return {};
  const cookies = {};
  for (const pair of document.cookie.split(";")) {
    const index = pair.indexOf("=");
    if (index === -1) continue;
    cookies[pair.slice(0, index).trim()] = pair.slice(index + 1).trim();
  }
  return cookies;
}

const hasAnalyticsConsent = () => readConsent()?.analytics === true;

/** Drops the stored visit (consent withdrawn or never given). */
export function clearVisitAttribution() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: nothing was stored.
  }
}

/** Remembers the UTM/referrer/landing of the visit (analytics consent only). */
export function captureLandingAttribution() {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) {
    clearVisitAttribution();
    return;
  }
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    for (const key of UTM_KEYS) {
      const value = clip(params.get(key));
      if (value) utm[key] = value;
    }
    const referrer = clip(document.referrer);
    const sameSite = referrer && referrer.startsWith(window.location.origin);
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        utmSource: utm.utm_source,
        utmMedium: utm.utm_medium,
        utmCampaign: utm.utm_campaign,
        utmContent: utm.utm_content,
        utmTerm: utm.utm_term,
        referrer: sameSite ? undefined : referrer || undefined,
        landingPage: clip(window.location.pathname),
      }),
    );
  } catch {
    // Storage unavailable: the order simply carries no visit attribution.
  }
}

/**
 * Call once on app mount: captures now and again when the shopper answers
 * the banner (granting on the landing page keeps its UTMs). Returns the
 * cleanup for the listener.
 */
export function startVisitAttribution() {
  if (typeof window === "undefined") return () => {};
  captureLandingAttribution();
  window.addEventListener(CONSENT_CHANGE_EVENT, captureLandingAttribution);
  return () =>
    window.removeEventListener(CONSENT_CHANGE_EVENT, captureLandingAttribution);
}

/**
 * The attribution to send with checkout, or null when nothing is known or
 * the shopper hasn't granted analytics consent.
 */
export function getOrderAttribution() {
  if (typeof window === "undefined") return null;
  if (!hasAnalyticsConsent()) {
    clearVisitAttribution();
    return null;
  }
  let stored = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    stored = {};
  }
  const cookies = readCookies();
  const gaClientId = parseGaClientId(cookies._ga);
  const sessionCookie = Object.keys(cookies).find((name) => name.startsWith("_ga_"));
  const gaSessionId = sessionCookie ? parseGaSessionId(cookies[sessionCookie]) : "";
  const attribution = {
    ...(gaClientId ? { gaClientId } : {}),
    ...(gaSessionId ? { gaSessionId } : {}),
  };
  for (const [key, value] of Object.entries(stored)) {
    if (typeof value === "string" && value) attribution[key] = value;
  }
  return Object.keys(attribution).length > 0 ? attribution : null;
}
