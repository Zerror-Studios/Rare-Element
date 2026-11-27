"use client";

/**
 * Email preference (backend PRD-050 FR-3.6, FR-3.8; was PRD-014 FR-2.8)
 *
 * Reads the shopper's marketing-email consent with the kit's
 * `useMyEmailPreferences` (`myEmailPreferences`: subscribed, waiting for
 * the confirmation click, or not) and changes it with
 * `updateMyEmailPreferences`, sending the version of the wording shown
 * here. Subscribing starts double opt-in: the status reads "Waiting for
 * your confirmation" until the shopper clicks the emailed link.
 * Unsubscribing stops news and offers only.
 *
 * Keep in sync with
 * `storefronts/deveshe-dreams/src/components/profileNew/myProfile/EmailPreferences.jsx`.
 */

import React from "react";
import { toast } from "react-toastify";
import { useMyEmailPreferences } from "@zcom/storefront-kit/client";

import {
  EMAIL_CONFIRMATION_HINT,
  EMAIL_CONSENT_LABEL,
  EMAIL_NOTICE_VERSION,
  getConsentErrorMessage,
  getSavedMessage,
  getSubscriptionCopy,
} from "@/utils/email-consent";

// ─── Component ────────────────────────────────────────────────────────────

const EmailPreference = () => {
  const {
    preferences,
    loading,
    error,
    save,
    saving,
    saveError,
    retryAfterMs,
    reload,
  } = useMyEmailPreferences({ noticeVersion: EMAIL_NOTICE_VERSION });
  const subscription = preferences?.subscription ?? null;
  const isSubscribed = subscription === "subscribed";
  const isPending = subscription === "pending";
  const status = subscription ? getSubscriptionCopy(subscription) : null;

  const handleToggle = async () => {
    if (saving || !preferences) return;
    const wantsEmail = !(isSubscribed || isPending);
    const next = await save(wantsEmail);
    // A failed save shows `saveError` under the status
    if (next) toast.success(getSavedMessage(next.subscription));
  };

  return (
    <>
      <div className="checkout_thin_line"></div>
      <div className="settings__block">
        <div>
          <p>
            {EMAIL_CONSENT_LABEL} -{" "}
            {status ? status.label : loading ? "…" : "Not available"}
          </p>
          {status && <p className="text-sm mt-1">{status.description}</p>}
          {preferences && !isSubscribed && !isPending && (
            <p className="text-sm mt-1">{EMAIL_CONFIRMATION_HINT}</p>
          )}
          {saveError && (
            <p className="text-sm mt-1" role="alert">
              {getConsentErrorMessage(saveError, retryAfterMs)}
            </p>
          )}
          {error && (
            <p className="text-sm mt-1" role="alert">
              {getConsentErrorMessage(error)}{" "}
              {error !== "no_email" && (
                <button type="button" className="underline" onClick={reload}>
                  Try again
                </button>
              )}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={saving || !preferences}
          aria-label={
            isSubscribed || isPending
              ? "Unsubscribe from news and offers by email"
              : "Subscribe to news and offers by email"
          }
          className="settings__link email_preference_btn"
        >
          <p>
            {saving
              ? "Saving…"
              : isSubscribed || isPending
                ? "Unsubscribe"
                : "Subscribe"}
          </p>
        </button>
      </div>
    </>
  );
};

export default EmailPreference;
