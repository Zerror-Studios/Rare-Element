/**
 * Cookie consent with Google Consent Mode v2 (PRD-014 FR-1.9, UX-05, D10)
 *
 * - The inline head script from `getConsentDefaultScript()` runs before any
 *   tag and sets every Google consent type to "denied" (a stored choice is
 *   applied right after, so returning shoppers keep their answer).
 * - No tag script is requested before consent: GTM and gtag.js load only
 *   once "analytics" is granted, the Meta Pixel only once "marketing" is.
 * - The choice lives in localStorage (`zc_consent`, no PII) and can be
 *   changed from the footer ("Cookie preferences"), which dispatches
 *   `CONSENT_OPEN_EVENT` for the banner.
 * - A tag that already loaded can't be unloaded: withdrawing consent sends a
 *   Consent Mode update (Google) and `fbq("consent", "revoke")` (Meta), so
 *   they stop setting cookies and sending identifiers.
 * - GTM (W1V-C-05): the container loads on "analytics" consent, and every
 *   choice is also pushed to the dataLayer as `CONSENT_DATALAYER_EVENT` with
 *   `zcConsentAnalytics` / `zcConsentMarketing` (before GTM loads, so its
 *   first evaluation sees it). Consent Mode keeps the `ad_*` types denied
 *   until "marketing", which governs only Google tags: any non-Google tag
 *   in a merchant's container MUST fire on a trigger that requires
 *   `zcConsentMarketing` (or the matching built-in consent check).
 * - Ads (PRD-034 FR-1.3, D8): the Meta Pixel and the Google Ads tag load
 *   and fire only with "marketing"; ad signals stay denied everywhere until
 *   the shopper agrees. The tag ids come from `utils/tracking-config.js`
 *   (backend first, env fallback). `isTagLoaded` lets the event helpers in
 *   `utils/ads-tracking.js` check that a tag is really on.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/consent.util.js`.
 */

// ─── Constants ────────────────────────────────────────────────────────────

export const CONSENT_STORAGE_KEY = "zc_consent";
export const CONSENT_VERSION = 1;
/** Window event that opens the banner with the category choices. */
export const CONSENT_OPEN_EVENT = "zc:consent-open";
/** Window event fired after a choice is saved (`detail` = the choice). */
export const CONSENT_CHANGE_EVENT = "zc:consent-change";
/** dataLayer event carrying the choice, for GTM consent triggers. */
export const CONSENT_DATALAYER_EVENT = "zc_consent_update";

export const CONSENT_DENIED_ALL = Object.freeze({
  analytics: false,
  marketing: false,
});
export const CONSENT_GRANTED_ALL = Object.freeze({
  analytics: true,
  marketing: true,
});

const GTM_SCRIPT_URL = "https://www.googletagmanager.com/gtm.js";
const GTAG_SCRIPT_URL = "https://www.googletagmanager.com/gtag/js";
const PIXEL_SCRIPT_URL = "https://connect.facebook.net/en_US/fbevents.js";
const CONSENT_WAIT_FOR_UPDATE_MS = 500;

// ─── State ────────────────────────────────────────────────────────────────

const loadedTags = new Set();

// ─── Helpers ──────────────────────────────────────────────────────────────

const toConsentState = (granted) => (granted ? "granted" : "denied");

const normalizeConsent = (consent) => ({
  analytics: !!consent?.analytics,
  marketing: !!consent?.marketing,
});

/** Maps the shopper's choice to the Consent Mode v2 types. */
export function toGoogleConsent(consent) {
  const { analytics, marketing } = normalizeConsent(consent);
  return {
    analytics_storage: toConsentState(analytics),
    ad_storage: toConsentState(marketing),
    ad_user_data: toConsentState(marketing),
    ad_personalization: toConsentState(marketing),
  };
}

/**
 * The inline script for `<head>`: Consent Mode defaults ("denied") before
 * any tag, then the stored choice. Self-contained (no imports at runtime).
 */
export function getConsentDefaultScript() {
  const key = JSON.stringify(CONSENT_STORAGE_KEY);
  return [
    "window.dataLayer=window.dataLayer||[];",
    "window.gtag=window.gtag||function(){dataLayer.push(arguments);};",
    "gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',",
    "ad_personalization:'denied',analytics_storage:'denied',",
    "functionality_storage:'granted',security_storage:'granted',",
    `wait_for_update:${CONSENT_WAIT_FOR_UPDATE_MS}});`,
    `try{var c=JSON.parse(localStorage.getItem(${key})||'null');`,
    `if(c&&c.v===${CONSENT_VERSION}){`,
    "var a=c.analytics?'granted':'denied',m=c.marketing?'granted':'denied';",
    "gtag('consent','update',{analytics_storage:a,ad_storage:m,",
    "ad_user_data:m,ad_personalization:m});}}catch(e){}",
  ].join("");
}

function injectScript(src) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    // gtag.js reads `arguments` objects from the dataLayer, not arrays.
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
}

function loadTagManager(gtmId) {
  if (!gtmId || loadedTags.has("gtm")) return;
  loadedTags.add("gtm");
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  injectScript(`${GTM_SCRIPT_URL}?id=${encodeURIComponent(gtmId)}`);
}

// gtag.js is requested once; later `config` calls (GA4 or Google Ads)
// load their own destination through it.
function ensureGtagScript(tagId) {
  if (loadedTags.has("gtagjs")) return;
  loadedTags.add("gtagjs");
  window.gtag("js", new Date());
  injectScript(`${GTAG_SCRIPT_URL}?id=${encodeURIComponent(tagId)}`);
}

function loadGoogleTag(gaId) {
  if (!gaId || loadedTags.has("ga")) return;
  loadedTags.add("ga");
  ensureGtagScript(gaId);
  window.gtag("config", gaId);
}

/** PRD-034 FR-1.3: the Google Ads tag, "marketing" consent only. */
function loadGoogleAdsTag(googleAds) {
  const conversionId = googleAds?.conversionId;
  if (!conversionId || loadedTags.has("googleAds")) return;
  loadedTags.add("googleAds");
  ensureGtagScript(conversionId);
  window.gtag("config", conversionId, {
    allow_enhanced_conversions: googleAds.enhancedConversions === true,
  });
}

function loadMetaPixel(pixelId) {
  if (!pixelId || loadedTags.has("pixel")) return;
  loadedTags.add("pixel");
  if (typeof window.fbq !== "function") {
    // Meta's base-code queue, so calls before fbevents.js loads are kept.
    const fbq = function fbq() {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
      else fbq.queue.push(arguments);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
    injectScript(PIXEL_SCRIPT_URL);
  }
  window.fbq("consent", "grant");
  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}

// ─── Public API ───────────────────────────────────────────────────────────

/** True once this page view loaded the tag (`ga`, `gtm`, `pixel`, `googleAds`). */
export function isTagLoaded(name) {
  return loadedTags.has(name);
}

/** The stored choice, or null when the shopper hasn't answered yet. */
export function readConsent() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(CONSENT_STORAGE_KEY) || "null",
    );
    if (!stored || stored.v !== CONSENT_VERSION) return null;
    return normalizeConsent(stored);
  } catch {
    // Storage unavailable or corrupt: ask again.
    return null;
  }
}

/**
 * Applies a choice: Consent Mode update, then loads the tags it allows.
 * `tagIds` = `{ gaId, gtmId, pixelId, googleAds }` (`getTagIds()`); an
 * empty id loads nothing.
 */
export function applyConsent(consent, tagIds = {}) {
  if (typeof window === "undefined") return;
  const choice = normalizeConsent(consent);
  ensureGtag();
  window.gtag("consent", "update", toGoogleConsent(choice));
  window.dataLayer.push({
    event: CONSENT_DATALAYER_EVENT,
    zcConsentAnalytics: choice.analytics,
    zcConsentMarketing: choice.marketing,
  });
  if (typeof window.fbq === "function" && !choice.marketing) {
    window.fbq("consent", "revoke");
  }
  if (choice.analytics) {
    loadTagManager(tagIds.gtmId);
    loadGoogleTag(tagIds.gaId);
  }
  if (choice.marketing) {
    if (loadedTags.has("pixel")) window.fbq?.("consent", "grant");
    loadMetaPixel(tagIds.pixelId);
    loadGoogleAdsTag(tagIds.googleAds);
  }
}

/** Stores the choice, applies it and tells listeners. */
export function saveConsent(consent, tagIds = {}) {
  const choice = normalizeConsent(consent);
  try {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        v: CONSENT_VERSION,
        ...choice,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Storage unavailable: the choice holds for this page view only.
  }
  applyConsent(choice, tagIds);
  window.dispatchEvent(
    new CustomEvent(CONSENT_CHANGE_EVENT, { detail: choice }),
  );
  return choice;
}

/** Opens the banner with the category choices (footer link). */
export function openConsentPreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
