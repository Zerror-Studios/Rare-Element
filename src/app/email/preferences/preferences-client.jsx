"use client";

/**
 * Email preferences client (backend PRD-050 FR-3.8)
 *
 * The kit's `useEmailPreferencesPage` reads `token` once (kept in memory,
 * removed from the address bar) and loads the masked address and its
 * marketing status. Unsubscribing asks once more before it saves, and
 * withdraws news and offers only: order emails keep coming.
 *
 * Keep in sync with
 * `storefronts/deveshe-dreams/src/app/email/preferences/preferences-client.jsx`.
 */

import React, { useState } from "react";
import { useEmailPreferencesPage } from "@zcom/storefront-kit/client";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import {
  getConsentErrorMessage,
  getPreferencesPageCopy,
  getSavedMessage,
  getSubscriptionCopy,
} from "@/utils/email-consent";

// ─── Component ────────────────────────────────────────────────────────────

const PreferencesClient = () => {
  const { state, preferences, save, saving, saved, saveError, retry } =
    useEmailPreferencesPage();
  const [confirming, setConfirming] = useState(false);

  if (state !== "ready" || !preferences) {
    const copy = getPreferencesPageCopy(state);
    const isLoading = state === "loading";
    return (
      <div className="status_section center">
        <div className="status_section_inner" aria-live="polite" aria-busy={isLoading}>
          <h1 className="text-3xl font-bold">{copy.title}</h1>
          <p className="uppercase mt-2">{copy.body}</p>
          {copy.canRetry && (
            <div className="w-full mt-6">
              <GreenBoxBtn title="Try Again" type="button" onClick={retry} />
            </div>
          )}
          {!isLoading && (
            <div className="w-full mt-8">
              <GreenBoxBtn title="Continue Shopping" type="button" href="/" />
            </div>
          )}
        </div>
      </div>
    );
  }

  const status = getSubscriptionCopy(preferences.subscription);
  const isSubscribed = preferences.subscription === "subscribed";

  const handleSave = async (marketing) => {
    const next = await save(marketing);
    if (next) setConfirming(false);
  };

  return (
    <div className="status_section center">
      <div className="status_section_inner" aria-live="polite" aria-busy={saving}>
        <h1 className="text-3xl font-bold">Email preferences</h1>
        <p className="mt-2">
          For <span className="font-bold">{preferences.email}</span>
        </p>
        <div className="w-full">
          <p className="uppercase">News and offers: {status.label}</p>
          <p className="mt-2">{status.description}</p>
          {saved && (
            <p className="mt-2" role="status">
              {getSavedMessage(preferences.subscription)}
            </p>
          )}
          {saveError && (
            <p className="mt-2 newsletter_message is_error" role="alert">
              {getConsentErrorMessage(saveError)}
            </p>
          )}
        </div>
        {isSubscribed && !confirming && (
          <div className="w-full">
            <GreenBoxBtn
              title="Unsubscribe"
              type="button"
              onClick={() => setConfirming(true)}
            />
          </div>
        )}
        {isSubscribed && confirming && (
          <div className="w-full">
            <p className="mb-4">
              Stop news and offers from Nahara? Emails about your orders will
              still reach you.
            </p>
            <GreenBoxBtn
              title="Yes, Unsubscribe"
              type="button"
              loading={saving}
              onClick={() => handleSave(false)}
            />
            <div className="mt-4">
              <GreenBoxBtn
                title="Keep Me Subscribed"
                type="button"
                disabled={saving}
                onClick={() => setConfirming(false)}
              />
            </div>
          </div>
        )}
        {!isSubscribed && preferences.subscription !== "pending" && (
          <div className="w-full">
            <GreenBoxBtn
              title="Subscribe Again"
              type="button"
              loading={saving}
              onClick={() => handleSave(true)}
            />
          </div>
        )}
        <div className="w-full">
          <GreenBoxBtn title="Continue Shopping" type="button" href="/" />
        </div>
      </div>
    </div>
  );
};

export default PreferencesClient;
