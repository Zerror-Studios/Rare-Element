/**
 * Phone helpers (`utils/phone.js`, libphonenumber-js `min`)
 *
 * The phone field keeps `countryCode` + national digits; these checks pin
 * the validation (India: a mobile, 10 digits starting 6–9), the country
 * list, paste splitting and the international format the guest contact
 * sends.
 *
 * Keep in sync with `storefronts/deveshe-dreams/test/phone.test.mjs`.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const phone = await import("@/utils/phone");

// ─── Validation ───────────────────────────────────────────────────────────

describe("isValidPhone", () => {
  it("accepts an Indian mobile", () => {
    assert.equal(phone.isValidPhone("+91", "9876543210"), true);
    assert.equal(phone.isValidPhone("91", "98765 43210"), true);
    assert.equal(phone.isValidPhone("+91", "6000000001"), true);
  });

  it("refuses Indian numbers that aren't 10-digit mobiles", () => {
    // A landline-shaped number libphonenumber-js would accept
    assert.equal(phone.isValidPhone("+91", "5876543210"), false);
    assert.equal(phone.isValidPhone("+91", "987654321"), false);
    assert.equal(phone.isValidPhone("+91", "98765432101"), false);
    assert.equal(phone.isValidPhone("+91", "09876543210"), false);
    assert.equal(phone.isValidPhone("+91", ""), false);
    assert.equal(phone.isValidPhone("", "9876543210"), false);
  });

  it("checks other countries with libphonenumber-js", () => {
    assert.equal(phone.isValidPhone("+1", "2125550123"), true);
    assert.equal(phone.isValidPhone("+1", "(212) 555-0123"), true);
    assert.equal(phone.isValidPhone("+1", "1234"), false);
    assert.equal(phone.isValidPhone("+44", "7400123456"), true);
  });
});

// ─── Format ───────────────────────────────────────────────────────────────

describe("formatPhoneE164", () => {
  it("joins the code and the national digits", () => {
    assert.equal(phone.formatPhoneE164("+91", "98765 43210"), "+919876543210");
    assert.equal(phone.formatPhoneE164("1", "(212) 555-0123"), "+12125550123");
  });

  it("keeps the digits alone without a code, nothing without a number", () => {
    assert.equal(phone.formatPhoneE164("", "98765 43210"), "9876543210");
    assert.equal(phone.formatPhoneE164("+91", ""), "");
  });
});

// ─── Paste and typing ─────────────────────────────────────────────────────

describe("splitPhoneInput", () => {
  it("splits a pasted international number into country and number", () => {
    assert.deepEqual(phone.splitPhoneInput("+91 98765 43210", "+1"), {
      countryCode: "+91",
      phone: "9876543210",
      iso: "IN",
    });
    assert.deepEqual(phone.splitPhoneInput("+1 (415) 555-2671", "+91"), {
      countryCode: "+1",
      phone: "4155552671",
      iso: "US",
    });
    assert.equal(phone.splitPhoneInput("0044 7400 123456", "+91").iso, "GB");
  });

  it("drops the current country's code typed in front of the number", () => {
    assert.deepEqual(phone.splitPhoneInput("919876543210", "+91"), {
      countryCode: "+91",
      phone: "9876543210",
      iso: null,
    });
  });

  it("keeps typed digits and the current country", () => {
    assert.deepEqual(phone.splitPhoneInput("98765-432", "+91"), {
      countryCode: "+91",
      phone: "98765432",
      iso: null,
    });
    assert.equal(phone.splitPhoneInput("1".repeat(20), "+91").phone.length, 15);
  });
});

// ─── Countries ────────────────────────────────────────────────────────────

describe("getPhoneCountries", () => {
  it("lists India first with flag, name and code", () => {
    const countries = phone.getPhoneCountries("en");
    assert.equal(countries[0].iso, "IN");
    assert.equal(countries[0].dialCode, "+91");
    assert.equal(countries[0].label, "🇮🇳 India (+91)");
    assert.ok(countries.length > 200);
    assert.ok(countries.some((country) => country.iso === "US"));
  });
});

describe("getCountryForPhone", () => {
  it("picks the number's own country, else the code's main one", () => {
    assert.equal(phone.getCountryForPhone("+91", ""), "IN");
    assert.equal(phone.getCountryForPhone("+1", ""), "US");
    assert.equal(phone.getCountryForPhone("+1", "4165550123"), "CA");
    assert.equal(phone.getCountryForPhone("+44", ""), "GB");
    assert.equal(phone.getCountryForPhone("", ""), "IN");
  });
});
