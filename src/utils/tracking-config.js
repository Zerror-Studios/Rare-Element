/**
 * Per-store tag ids (PRD-034 FR-1.2)
 *
 * The store's public tag ids come from the backend
 * (`storefrontTrackingConfig`, loaded once on the server in
 * `app/layout.jsx` through `lib/tracking-config.js`). Transition rule: a
 * backend value wins; when it's null (the app isn't installed, or the read
 * failed), the build's `NEXT_PUBLIC_GA_MEASUREMENT_ID` /
 * `NEXT_PUBLIC_FB_PIXEL_ID` env is used, so a store that hasn't installed
 * the apps keeps today's tracking. GTM stays env-only. Google Ads has no
 * env fallback.
 *
 * The resolved ids are kept here for the browser (`setTagIds` runs while
 * `ConsentBanner` renders, before any effect fires), and every tag helper
 * reads them through `getTagIds()` at call time. Nothing here loads a tag:
 * that is `utils/consent.js`, only after consent.
 */

import { TAG_IDS as ENV_TAG_IDS } from "./env";

// ─── Constants ────────────────────────────────────────────────────────────

const GA_ID_PATTERN = /^G-[A-Z0-9]{4,20}$/i;
const PIXEL_ID_PATTERN = /^\d{5,20}$/;
const CONVERSION_ID_PATTERN = /^AW-\d{5,15}$/;
const LABEL_PATTERN = /^[\w-]{1,64}$/;

// ─── Helpers ──────────────────────────────────────────────────────────────

const matchOrEmpty = (value, pattern) =>
  typeof value === "string" && pattern.test(value.trim()) ? value.trim() : "";

const labelOrNull = (value) => matchOrEmpty(value, LABEL_PATTERN) || null;

/** The Google Ads block, or null when it isn't usable (id or label bad). */
function normalizeGoogleAds(googleAds) {
  if (!googleAds) return null;
  const conversionId = matchOrEmpty(
    googleAds.conversionId,
    CONVERSION_ID_PATTERN,
  );
  const purchaseLabel = labelOrNull(googleAds.purchaseLabel);
  if (!conversionId || !purchaseLabel) return null;
  return {
    conversionId,
    purchaseLabel,
    addToCartLabel: labelOrNull(googleAds.addToCartLabel),
    beginCheckoutLabel: labelOrNull(googleAds.beginCheckoutLabel),
    enhancedConversions: googleAds.enhancedConversions === true,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * `{ gaId, gtmId, pixelId, googleAds }` from the backend config (or null)
 * and the env fallback. A malformed backend id counts as null.
 */
export function resolveTagIds(config, envIds = ENV_TAG_IDS) {
  const gaId = matchOrEmpty(config?.ga4MeasurementId, GA_ID_PATTERN);
  const pixelId = matchOrEmpty(config?.metaPixelId, PIXEL_ID_PATTERN);
  return {
    gaId: gaId || envIds?.gaId || "",
    gtmId: envIds?.gtmId || "",
    pixelId: pixelId || envIds?.pixelId || "",
    googleAds: normalizeGoogleAds(config?.googleAds),
  };
}

let currentTagIds = resolveTagIds(null);

/** Stores the ids resolved on the server (plain, serialisable object). */
export function setTagIds(tagIds) {
  if (!tagIds || typeof tagIds !== "object") return;
  currentTagIds = {
    gaId: tagIds.gaId || "",
    gtmId: tagIds.gtmId || "",
    pixelId: tagIds.pixelId || "",
    googleAds: normalizeGoogleAds(tagIds.googleAds),
  };
}

/** The ids in use (the env fallback until `setTagIds` runs). */
export function getTagIds() {
  return currentTagIds;
}

/** The GA4 measurement id for `send_to`, or "" when there is none. */
export function getGaTrackingId() {
  return currentTagIds.gaId;
}
