"use client";

/**
 * Email preference (PRD-014 FR-2.8, UX-29)
 *
 * Shows the customer's real marketing-email consent
 * (`emailSubscribedStatus`, 1 = opted in) and changes it with
 * `updateMyProfile`. Replaces a static "Not Subscribed" block.
 */

import React from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";

import { UPDATE_USER_PROFILE } from "@/graphql";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/utils/errors";

// ─── Constants ────────────────────────────────────────────────────────────

const EMAIL_STATUS_SUBSCRIBED_CODE = 1;
const EMAIL_STATUS_UNSUBSCRIBED_CODE = 0;

// ─── Component ────────────────────────────────────────────────────────────

const EmailPreference = () => {
  const { user, setUser } = useAuthStore((state) => state);
  const [updateUser, { loading }] = useMutation(UPDATE_USER_PROFILE);
  const isKnown = user?.emailSubscribedStatus !== undefined;
  const isSubscribed =
    user?.emailSubscribedStatus === EMAIL_STATUS_SUBSCRIBED_CODE;

  const handleToggle = async () => {
    if (loading || !isKnown) return;
    try {
      const { data } = await updateUser({
        variables: {
          input: {
            emailSubscribedStatus: isSubscribed
              ? EMAIL_STATUS_UNSUBSCRIBED_CODE
              : EMAIL_STATUS_SUBSCRIBED_CODE,
          },
        },
      });
      if (data?.updateMyProfile) {
        setUser({ ...user, ...data.updateMyProfile });
        toast.success(
          isSubscribed
            ? "You won't receive marketing emails."
            : "You're subscribed to our emails.",
        );
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't update your preference."));
    }
  };

  return (
    <>
      <div className="checkout_thin_line"></div>
      <div className="settings__block">
        <div>
          <p>
            News and offers by email -{" "}
            {isKnown ? (isSubscribed ? "Subscribed" : "Not subscribed") : "…"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading || !isKnown}
          className="settings__link email_preference_btn"
        >
          <p>{loading ? "Saving…" : isSubscribed ? "Unsubscribe" : "Subscribe"}</p>
        </button>
      </div>
    </>
  );
};

export default EmailPreference;
