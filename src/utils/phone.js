/**
 * Phone numbers: the country list, validation, paste splitting and the
 * international format (libphonenumber-js, `min` metadata)
 *
 * Forms keep a phone as two values, as they always did: `countryCode`
 * ("+91") and the national number as digits ("9876543210"). These pure
 * helpers back `components/common/PhoneInput.jsx` and the zod schemas:
 * - `getPhoneCountries`: the country selector's options (India first);
 * - `getCountryForPhone`: which country a stored `countryCode` + number
 *   is (a shared code such as +1 picks the number's own country, else the
 *   code's main one);
 * - `splitPhoneInput`: typed or pasted text → country code + national
 *   digits ("+91 98765 43210" moves the country to India);
 * - `isValidPhone`: a real number for its country; for India a mobile
 *   (10 digits starting 6–9), since Shiprocket needs one;
 * - `formatPhoneE164`: "+919876543210", what the backend's guest contact
 *   takes.
 *
 * No React imports, so `node:test` loads it directly.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/phone.util.js`.
 */

import {
  Metadata,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js/min";

// ─── Constants ────────────────────────────────────────────────────────────

export const DEFAULT_PHONE_COUNTRY = "IN";
export const DEFAULT_DIAL_CODE = "+91";
export const PHONE_INVALID_MESSAGE = "Enter a valid phone number";
/** E.164 allows at most 15 digits. */
export const PHONE_DIGITS_MAX = 15;

const INDIA_CALLING_CODE = "91";
const INDIA_MOBILE_PATTERN = /^[6-9]\d{9}$/;

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Only the digits of a value ("" for none). */
export const toDigits = (value) =>
  String(value ?? "").replace(/\D/g, "");

/** "+91", "91" or 91 → "91" (digits only). */
const toCallingCode = (countryCode) => toDigits(countryCode);

/** "IN" → "🇮🇳" (regional indicator letters). */
export const getFlagEmoji = (iso) =>
  String(iso || "")
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) =>
      String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65),
    );

/** "IN" → "+91"; "" for an unknown country. */
export const getDialCode = (iso) => {
  try {
    return `+${getCountryCallingCode(iso)}`;
  } catch {
    return "";
  }
};

// ─── Countries ────────────────────────────────────────────────────────────

const countriesByLocale = new Map();

const getRegionNames = (locale) => {
  try {
    return new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    return null;
  }
};

/**
 * Every country libphonenumber-js knows, as selector options
 * `{ iso, dialCode, name, label }` ("🇮🇳 India (+91)"): India first, the
 * rest by name. Cached per locale.
 */
export const getPhoneCountries = (locale = "en") => {
  if (countriesByLocale.has(locale)) return countriesByLocale.get(locale);
  const names = getRegionNames(locale);
  const countries = getCountries()
    .map((iso) => {
      const dialCode = getDialCode(iso);
      let name = iso;
      try {
        name = names?.of(iso) || iso;
      } catch {
        name = iso;
      }
      return {
        iso,
        dialCode,
        name,
        label: `${getFlagEmoji(iso)} ${name} (${dialCode})`,
      };
    })
    .sort((a, b) => {
      if (a.iso === DEFAULT_PHONE_COUNTRY) return -1;
      if (b.iso === DEFAULT_PHONE_COUNTRY) return 1;
      return a.name.localeCompare(b.name, locale);
    });
  countriesByLocale.set(locale, countries);
  return countries;
};

/** The main country of a calling code ("1" → "US", "44" → "GB"). */
const getMainCountry = (callingCode) => {
  if (!callingCode) return null;
  if (callingCode === INDIA_CALLING_CODE) return DEFAULT_PHONE_COUNTRY;
  try {
    return new Metadata().countryCallingCodes()[callingCode]?.[0] || null;
  } catch {
    return null;
  }
};

/**
 * The selector's country for a stored `countryCode` and national number:
 * the number's own country when it parses (+1 415… → US, +1 416… → CA),
 * else the code's main country, else India.
 */
export const getCountryForPhone = (countryCode, national) => {
  const callingCode = toCallingCode(countryCode);
  const digits = toDigits(national);
  if (callingCode && digits) {
    const parsed = parsePhoneNumberFromString(`+${callingCode}${digits}`);
    if (parsed?.country && parsed.countryCallingCode === callingCode) {
      return parsed.country;
    }
  }
  return getMainCountry(callingCode) || DEFAULT_PHONE_COUNTRY;
};

// ─── Validation and format ────────────────────────────────────────────────

/**
 * True for a real number of that country: libphonenumber-js
 * `isValidPhoneNumber`, and for India a mobile (10 digits starting 6–9;
 * Shiprocket needs one).
 */
export const isValidPhone = (countryCode, national) => {
  const callingCode = toCallingCode(countryCode);
  const digits = toDigits(national);
  if (!callingCode || !digits) return false;
  if (callingCode === INDIA_CALLING_CODE && !INDIA_MOBILE_PATTERN.test(digits)) {
    return false;
  }
  return isValidPhoneNumber(`+${callingCode}${digits}`);
};

/**
 * "+91" + "98765 43210" → "+919876543210"; the digits alone without a
 * country code, "" without a number.
 */
export const formatPhoneE164 = (countryCode, national) => {
  const callingCode = toCallingCode(countryCode);
  const digits = toDigits(national);
  if (!digits) return "";
  return callingCode ? `+${callingCode}${digits}` : digits;
};

// ─── Typing and paste ─────────────────────────────────────────────────────

/**
 * Typed or pasted text → `{ countryCode, phone, iso }` for the form.
 * - "+91 98765 43210" (or "0091…") parses into its country and national
 *   number;
 * - digits that start with the current country's code and only make a
 *   valid number without it ("919876543210" with +91) lose the code;
 * - anything else keeps the current country and only its digits (at most
 *   15). `iso` is null when the country did not change.
 */
export const splitPhoneInput = (text, countryCode) => {
  const raw = String(text ?? "").trim();
  const currentCode = toCallingCode(countryCode) || INDIA_CALLING_CODE;
  const keep = (digits) => ({
    countryCode: `+${currentCode}`,
    phone: digits.slice(0, PHONE_DIGITS_MAX),
    iso: null,
  });
  const international = raw.startsWith("+")
    ? raw
    : raw.startsWith("00")
      ? `+${raw.slice(2)}`
      : null;
  if (international) {
    const parsed = parsePhoneNumberFromString(international);
    if (parsed?.countryCallingCode && parsed.nationalNumber) {
      return {
        countryCode: `+${parsed.countryCallingCode}`,
        phone: String(parsed.nationalNumber),
        iso: parsed.country || getMainCountry(parsed.countryCallingCode),
      };
    }
    // An unparsable "+…": keep the digits after the code we already have
    const digits = toDigits(international);
    return keep(
      digits.startsWith(currentCode) ? digits.slice(currentCode.length) : digits,
    );
  }
  const digits = toDigits(raw);
  if (
    digits.startsWith(currentCode) &&
    !isValidPhone(currentCode, digits) &&
    isValidPhone(currentCode, digits.slice(currentCode.length))
  ) {
    return keep(digits.slice(currentCode.length));
  }
  return keep(digits);
};
