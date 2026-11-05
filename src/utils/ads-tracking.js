/**
 * Ads events: Meta Pixel and Google Ads (PRD-034 FR-1.3, FR-1.6, D8)
 *
 * Called by the one e-commerce dispatcher (`trackEcomEvent` in
 * `utils/analytics.js`), never from components. Every helper:
 * - does nothing without the shopper's "marketing" consent (read at call
 *   time, so a withdrawal stops the next event) or before the tag has
 *   loaded (`isTagLoaded` from `utils/consent.js`);
 * - sends the **variant id** as the item id (the product feed's `id`);
 * - never throws (ads never break the UI).
 *
 * Purchase: the Pixel `Purchase` carries `eventID` = the order `_id`, the
 * id the server-side Conversions API event uses, so Meta deduplicates; the
 * Google Ads conversion carries `transaction_id` = the same id. Enhanced
 * conversions (FR-1.6) set `user_data` with the SHA-256 of the normalised
 * email and phone, hashed here in the browser; plain values never reach a
 * tag.
 */

import { isTagLoaded, readConsent } from "./consent";
import { getTagIds } from "./tracking-config";

// ─── Constants ────────────────────────────────────────────────────────────

const DEFAULT_CURRENCY = "INR";
const INDIA_DIAL_CODE = "91";
const INDIAN_MOBILE_DIGITS = 10;
const E164_MAX_DIGITS = 15;
const E164_MIN_DIGITS = 8;

// ─── Normalisation and hashing (FR-1.6) ───────────────────────────────────

/** Trimmed, lower-case email, or "" when it isn't one. */
export function normalizeEmail(email) {
  const value = typeof email === "string" ? email.trim().toLowerCase() : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : "";
}

/**
 * E.164 (`+91XXXXXXXXXX` for a 10-digit Indian number), or "" when the
 * number can't be read. `countryCode` (e.g. "+91") is used when the phone
 * itself has none.
 */
export function normalizePhoneE164(phone, countryCode = "") {
  if (phone === null || phone === undefined) return "";
  const raw = String(phone).trim();
  if (!raw) return "";
  const hasPlus = raw.startsWith("+");
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (!hasPlus) {
    const dial = String(countryCode || "").replace(/\D/g, "");
    if (digits.length === INDIAN_MOBILE_DIGITS + 1 && digits[0] === "0") {
      digits = digits.slice(1);
    }
    if (digits.length === INDIAN_MOBILE_DIGITS) {
      digits = `${dial || INDIA_DIAL_CODE}${digits}`;
    } else if (
      !(
        digits.length === INDIAN_MOBILE_DIGITS + INDIA_DIAL_CODE.length &&
        digits.startsWith(INDIA_DIAL_CODE)
      )
    ) {
      return "";
    }
  }
  if (digits.length < E164_MIN_DIGITS || digits.length > E164_MAX_DIGITS) {
    return "";
  }
  return `+${digits}`;
}

/** SHA-256 hex of a string (SubtleCrypto), or "" without it. */
export async function sha256Hex(value) {
  const subtle = globalThis.crypto?.subtle;
  if (!value || !subtle) return "";
  const bytes = new TextEncoder().encode(value);
  const digest = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Google's `user_data` with hashed values only, or null when empty. */
export async function buildEnhancedUserData({ email, phone, countryCode }) {
  const [emailHash, phoneHash] = await Promise.all([
    sha256Hex(normalizeEmail(email)),
    sha256Hex(normalizePhoneE164(phone, countryCode)),
  ]);
  const userData = {
    ...(emailHash ? { sha256_email_address: emailHash } : {}),
    ...(phoneHash ? { sha256_phone_number: phoneHash } : {}),
  };
  return Object.keys(userData).length > 0 ? userData : null;
}

// ─── Gates ────────────────────────────────────────────────────────────────

export const hasMarketingConsent = () => readConsent()?.marketing === true;

const canWindow = () => typeof window !== "undefined";

const metaReady = () =>
  canWindow() &&
  hasMarketingConsent() &&
  isTagLoaded("pixel") &&
  typeof window.fbq === "function";

const googleAdsReady = () =>
  canWindow() &&
  hasMarketingConsent() &&
  isTagLoaded("googleAds") &&
  typeof window.gtag === "function" &&
  !!getTagIds().googleAds;

// ─── Senders ──────────────────────────────────────────────────────────────

function trackMeta(name, params, eventId) {
  try {
    if (!metaReady()) return;
    if (eventId) {
      window.fbq("track", name, params, { eventID: String(eventId) });
    } else {
      window.fbq("track", name, params);
    }
  } catch {
    // Ads never break the UI.
  }
}

/** One Google Ads conversion; `labelKey` names the label in the config. */
function sendGoogleAdsConversion(labelKey, params) {
  try {
    if (!googleAdsReady()) return;
    const { conversionId, [labelKey]: label } = getTagIds().googleAds;
    if (!label) return;
    window.gtag("event", "conversion", {
      send_to: `${conversionId}/${label}`,
      ...params,
    });
  } catch {
    // Ads never break the UI.
  }
}

const toMetaContents = (items) =>
  items
    .filter((item) => item?.id)
    .map((item) => ({
      id: String(item.id),
      quantity: Number(item.quantity) || 1,
    }));

// ─── Events ───────────────────────────────────────────────────────────────

/** Product view: Meta `ViewContent`. */
export function trackAdsViewContent({ itemId, name, category, value, currency }) {
  if (!itemId) return;
  trackMeta("ViewContent", {
    content_name: name,
    content_category: category,
    content_ids: [String(itemId)],
    content_type: "product",
    value: Number(value) || 0,
    currency: currency || DEFAULT_CURRENCY,
  });
}

/** Add to cart: Meta `AddToCart` and the Google Ads add-to-cart label. */
export function trackAdsAddToCart({ items = [], name, category, value, currency }) {
  const contents = toMetaContents(items);
  if (!contents.length) return;
  const amount = Number(value) || 0;
  const unit = currency || DEFAULT_CURRENCY;
  trackMeta("AddToCart", {
    content_name: name,
    content_category: category,
    content_ids: contents.map((item) => item.id),
    contents,
    content_type: "product",
    value: amount,
    currency: unit,
  });
  sendGoogleAdsConversion("addToCartLabel", { value: amount, currency: unit });
}

/** Begin checkout: Meta `InitiateCheckout` and the begin-checkout label. */
export function trackAdsBeginCheckout({ items = [], value, currency }) {
  const contents = toMetaContents(items);
  if (!contents.length) return;
  const amount = Number(value) || 0;
  const unit = currency || DEFAULT_CURRENCY;
  trackMeta("InitiateCheckout", {
    content_ids: contents.map((item) => item.id),
    contents,
    content_type: "product",
    num_items: contents.reduce((sum, item) => sum + item.quantity, 0),
    value: amount,
    currency: unit,
  });
  sendGoogleAdsConversion("beginCheckoutLabel", {
    value: amount,
    currency: unit,
  });
}

/**
 * Paid order: Meta `Purchase` (eventID = order id) and the Google Ads
 * purchase conversion (transaction_id = order id), with enhanced
 * conversions first when the store turned them on.
 */
export async function trackAdsPurchase({
  orderId,
  value,
  currency,
  items = [],
  customer = null,
}) {
  if (!orderId) return;
  const amount = Number(value) || 0;
  const unit = currency || DEFAULT_CURRENCY;
  const contents = toMetaContents(items);
  trackMeta(
    "Purchase",
    {
      value: amount,
      currency: unit,
      content_ids: contents.map((item) => item.id),
      contents,
      content_type: "product",
    },
    orderId,
  );

  try {
    if (!googleAdsReady()) return;
    if (getTagIds().googleAds.enhancedConversions && customer) {
      const userData = await buildEnhancedUserData(customer);
      // Re-check: consent may have changed while hashing.
      if (userData && googleAdsReady()) {
        window.gtag("set", "user_data", userData);
      }
    }
  } catch {
    // Hashing failed: the conversion still goes, without user data.
  }
  sendGoogleAdsConversion("purchaseLabel", {
    value: amount,
    currency: unit,
    transaction_id: String(orderId),
  });
}
