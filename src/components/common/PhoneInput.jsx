"use client";

/**
 * Phone field: a native country selector and the national number
 *
 * Replaces `react-international-phone` and `react-phone-input-2`
 * (2026-11-12, libphonenumber-js `min`). The form keeps the same two
 * values as before, `countryCode` ("+91") and `phone` (national digits),
 * and gets both back through `onChange({ countryCode, phone })`.
 * - The selector is a native `<select>` ("🇮🇳 India (+91)", India first)
 *   for keyboards, screen readers and phone pickers. Closed, it shows only
 *   the flag and the code ("🇮🇳 +91"): the select sits transparent over a
 *   compact label, so the field never truncates in a narrow column, and
 *   the open list keeps the full country names.
 * - The number is `type="tel"`; a pasted "+91 98765 43210" moves the
 *   country and keeps only the national digits (`splitPhoneInput`).
 * - `error` is shown under the field (`errorClassName`, the form's own
 *   error style) and linked with `aria-describedby`.
 *
 * Styling comes from the form's container (its `input` / `select` rules)
 * plus `.phone_field` in `styles/components/common/phoneInput.css`.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/components/common/PhoneInput.jsx`.
 */

import React, { useEffect, useId, useMemo, useState } from "react";
import {
  DEFAULT_DIAL_CODE,
  getCountryForPhone,
  getDialCode,
  getFlagEmoji,
  getPhoneCountries,
  splitPhoneInput,
  toDigits,
} from "@/utils/phone";

const PhoneInput = ({
  countryCode = DEFAULT_DIAL_CODE,
  phone = "",
  onChange,
  onBlur,
  disabled = false,
  label = "Phone",
  placeholder = "Phone",
  error = "",
  className = "",
  selectClassName = "",
  inputClassName = "",
  errorClassName = "input_error_msg text-xs",
}) => {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const countries = useMemo(() => getPhoneCountries("en"), []);
  const [iso, setIso] = useState(() => getCountryForPhone(countryCode, phone));

  // A value set from outside (a saved address, a reset) may name another
  // country; a shared code (+1) keeps the shopper's own choice
  useEffect(() => {
    if (toDigits(getDialCode(iso)) === toDigits(countryCode)) return;
    setIso(getCountryForPhone(countryCode, phone));
  }, [countryCode]);

  const emit = (next) => onChange?.(next);

  const handleCountry = (event) => {
    const nextIso = event.target.value;
    setIso(nextIso);
    emit({ countryCode: getDialCode(nextIso), phone: toDigits(phone) });
  };

  const handleNumber = (event) => {
    const next = splitPhoneInput(event.target.value, countryCode);
    if (next.iso) setIso(next.iso);
    emit({ countryCode: next.countryCode, phone: next.phone });
  };

  return (
    <>
      <div className={`phone_field ${className}`.trim()}>
        <span className="phone_field_country_wrap">
          <span className="phone_field_country_display" aria-hidden="true">
            {getFlagEmoji(iso)} {getDialCode(iso)}
          </span>
          <select
            id={`${fieldId}-country`}
            className={`phone_field_country ${selectClassName}`.trim()}
            aria-label={`${label}: country code`}
            autoComplete="tel-country-code"
            value={iso}
            disabled={disabled}
            onChange={handleCountry}
          >
            {countries.map((country) => (
              <option
                key={country.iso}
                value={country.iso}
                suppressHydrationWarning
              >
                {country.label}
              </option>
            ))}
          </select>
        </span>
        <input
          id={fieldId}
          className={`phone_field_number ${inputClassName}`.trim()}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          aria-label={label}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          placeholder={placeholder}
          value={phone || ""}
          disabled={disabled}
          onChange={handleNumber}
          onBlur={onBlur}
        />
      </div>
      {error && (
        <p id={errorId} className={errorClassName}>
          {error}
        </p>
      )}
    </>
  );
};

export default PhoneInput;
