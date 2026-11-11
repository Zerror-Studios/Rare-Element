"use client";

/**
 * Cookie consent banner (PRD-014 FR-1.9, UX-05, D10)
 *
 * The store's banner on the kit's consent (PRD-002 FR-4.1, FR-1.13): it
 * shows until the shopper answers; nothing but essential storage is used
 * before that. "Cookie preferences" in the footer reopens it with the
 * categories (`openConsentPreferences`). Escape closes it only when a
 * choice already exists. Saving calls the kit's `updateConsent`, which
 * updates Consent Mode, keeps or drops attribution and click ids, and makes
 * `ZcomTags` load what the choice allows. "marketing" here is the kit's
 * "ads" consent.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CONSENT_OPEN_EVENT,
  getStoredConsent,
  updateConsent,
} from "@zcom/storefront-kit/core";

const CONSENT_DENIED_ALL = Object.freeze({ analytics: false, marketing: false });
const CONSENT_GRANTED_ALL = Object.freeze({ analytics: true, marketing: true });

/** The kit's stored choice as the banner's two switches, or null. */
const readConsent = () => {
  const stored = getStoredConsent();
  return stored
    ? { analytics: stored.analytics === "granted", marketing: stored.ads === "granted" }
    : null;
};

const saveConsent = (choice) => {
  updateConsent({
    analytics: choice.analytics ? "granted" : "denied",
    ads: choice.marketing ? "granted" : "denied",
  });
  return { analytics: !!choice.analytics, marketing: !!choice.marketing };
};

const ConsentBanner = () => {
  // Open in the server HTML so a first visit paints it at once (it is
  // often the largest element on a phone); for a returning shopper the
  // kit's head script marks <html> and CSS hides this first copy
  // (`html[data-zcom-consent] .consent_banner[data-initial]`) until the
  // effect closes it.
  const [isOpen, setIsOpen] = useState(true);
  const [isInitial, setIsInitial] = useState(true);
  const [showChoices, setShowChoices] = useState(false);
  const [choice, setChoice] = useState(CONSENT_DENIED_ALL);
  const [hasChoice, setHasChoice] = useState(false);
  const bannerRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      setChoice(stored);
      setHasChoice(true);
      setIsOpen(false);
    }
    setIsInitial(false);

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
    setChoice(saveConsent(nextChoice));
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
      data-initial={isInitial ? "" : undefined}
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
