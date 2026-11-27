"use client";

/**
 * Email confirmation client (backend PRD-050 FR-3.8)
 *
 * The kit's `useEmailConfirmPage` reads `token` once, removes it from the
 * address bar (it carries the address, so it must not linger in history or
 * analytics page URLs), checks its shape and calls `confirmEmailConsent`
 * once. Rate-limited and network failures offer a retry with the token
 * kept in memory.
 *
 * Keep in sync with
 * `storefronts/deveshe-dreams/src/app/email/confirm/confirm-client.jsx`.
 */

import React from "react";
import { useEmailConfirmPage } from "@zcom/storefront-kit/client";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { getConfirmPageCopy } from "@/utils/email-consent";

// ─── Component ────────────────────────────────────────────────────────────

const ConfirmClient = () => {
  const { state, retry } = useEmailConfirmPage();
  const copy = getConfirmPageCopy(state);
  const isLoading = state === "working";

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
};

export default ConfirmClient;
