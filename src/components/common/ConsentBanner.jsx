"use client";

/**
 * Cookie consent banner (PRD-014 FR-1.9, UX-05, D10)
 *
 * In-house banner on Google Consent Mode v2 (`utils/consent.js`). It shows
 * until the shopper answers; nothing but essential storage is used before
 * that. "Cookie preferences" in the footer reopens it with the categories.
 * Escape closes it only when a choice already exists.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CONSENT_DENIED_ALL,
  CONSENT_GRANTED_ALL,
  CONSENT_OPEN_EVENT,
  applyConsent,
  readConsent,
  saveConsent,
} from "@/utils/consent";
import { TAG_IDS } from "@/utils/env";

const ConsentBanner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [choice, setChoice] = useState(CONSENT_DENIED_ALL);
  const [hasChoice, setHasChoice] = useState(false);
  const bannerRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      applyConsent(stored, TAG_IDS);
      setChoice(stored);
      setHasChoice(true);
    } else {
      setIsOpen(true);
    }

    const handleOpen = () => {
      openerRef.current = document.activeElement;
      setChoice(readConsent() || CONSENT_DENIED_ALL);
      setShowChoices(true);
      setIsOpen(true);
      requestAnimationFrame(() => {
        bannerRef.current?.querySelector("input, button")?.focus();
      });
    };
    window.addEventListener(CONSENT_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, handleOpen);
  }, []);

  const close = () => {
    setIsOpen(false);
    setShowChoices(false);
    openerRef.current?.focus?.();
    openerRef.current = null;
  };

  const save = (nextChoice) => {
    setChoice(saveConsent(nextChoice, TAG_IDS));
    setHasChoice(true);
    close();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && hasChoice) close();
  };

  const toggle = (category) => (event) =>
    setChoice((prev) => ({ ...prev, [category]: event.target.checked }));

  if (!isOpen) return null;

  return (
    <section
      ref={bannerRef}
      className="consent_banner"
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent_banner_title"
      aria-describedby="consent_banner_text"
      onKeyDown={handleKeyDown}
      data-lenis-prevent
    >
      <p id="consent_banner_title" className="text-base uppercase bold">
        Cookies on Nahara
      </p>
      <p id="consent_banner_text" className="text-sm">
        We use essential cookies to run the store. With your permission we
        also use analytics cookies (Google Analytics) to understand how the
        site is used, and marketing cookies (Google, Meta) to measure our ads.
        You can change this at any time from &ldquo;Cookie preferences&rdquo;
        in the footer. Read our{" "}
        <Link href="/privacy-policy" className="underline">
          privacy policy
        </Link>
        .
      </p>

      {showChoices && (
        <fieldset className="consent_banner_choices">
          <legend className="text-sm bold">Choose cookies</legend>
          <label className="text-sm">
            <input type="checkbox" checked disabled />
            Essential (always on)
          </label>
          <label className="text-sm">
            <input
              type="checkbox"
              checked={choice.analytics}
              onChange={toggle("analytics")}
            />
            Analytics
          </label>
          <label className="text-sm">
            <input
              type="checkbox"
              checked={choice.marketing}
              onChange={toggle("marketing")}
            />
            Marketing
          </label>
        </fieldset>
      )}

      <div className="consent_banner_actions">
        <button
          type="button"
          className="consent_banner_btn text-sm uppercase"
          onClick={() => save(CONSENT_DENIED_ALL)}
        >
          Reject all
        </button>
        {showChoices ? (
          <button
            type="button"
            className="consent_banner_btn text-sm uppercase"
            onClick={() => save(choice)}
          >
            Save choices
          </button>
        ) : (
          <button
            type="button"
            className="consent_banner_btn text-sm uppercase"
            onClick={() => setShowChoices(true)}
          >
            Manage
          </button>
        )}
        <button
          type="button"
          className="consent_banner_btn consent_banner_btn_primary text-sm uppercase"
          onClick={() => save(CONSENT_GRANTED_ALL)}
        >
          Accept all
        </button>
      </div>
    </section>
  );
};

export default ConsentBanner;
