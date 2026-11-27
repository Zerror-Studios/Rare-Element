/**
 * Email consent copy and helpers (backend PRD-050 FR-3.6, FR-3.8; kit
 * 2.1.0 `use-email-consent`)
 *
 * Double opt-in is on for every store by default: a sign-up, the account
 * box and the checkout box start a confirmation email, and nothing is sent
 * until the shopper clicks its link (`/email/confirm`). Every email links
 * to the preference page (`/email/preferences`). The kit's hooks return the
 * page states; this file turns them into Nahara's words. Pure, so
 * `node:test` covers it without a browser. The states are the kit's string
 * values, written out so the helpers don't depend on the kit version.
 *
 * Keep in sync with
 * `storefronts/deveshe-dreams/src/utils/email-consent.util.js`.
 */

// ─── Constants ────────────────────────────────────────────────────────────

/** The backend's links land here (core `CONSENT_CONFIRM_PATH`). */
export const EMAIL_CONFIRM_PATH = "/email/confirm";
/** core `EMAIL_PREFERENCES_PATH` */
export const EMAIL_PREFERENCES_PATH = "/email/preferences";

export const STORE_NAME = "Nahara";

/**
 * The version of the wording below, kept with the shopper's consent record.
 * Change it whenever `EMAIL_CONSENT_LABEL` or `EMAIL_CONFIRMATION_HINT`
 * changes.
 */
export const EMAIL_NOTICE_VERSION = "nahara-email-2026-11-27";

/** The box label: names the store, and the box is never ticked for them. */
export const EMAIL_CONSENT_LABEL = `Email me news and offers from ${STORE_NAME}`;

/** Under every box and form: double opt-in follows. */
export const EMAIL_CONFIRMATION_HINT =
  "We'll email you a link to confirm first. You can unsubscribe at any time.";

const MINUTE_MS = 60_000;

// ─── Helpers ──────────────────────────────────────────────────────────────

/** "in a minute" / "in 5 minutes" / "later" for a `retryAfterMs`. */
export const formatRetryAfter = (retryAfterMs) => {
  const ms = Number(retryAfterMs);
  if (!Number.isFinite(ms) || ms <= 0) return "later";
  const minutes = Math.ceil(ms / MINUTE_MS);
  return minutes <= 1 ? "in a minute" : `in ${minutes} minutes`;
};

/** Sign-up form (`useEmailSignup`) state → message under the field. */
export const getSignupMessage = (state, retryAfterMs = null) => {
  switch (state) {
    case "pending":
      return {
        text: "Check your inbox: we've sent you a link to confirm your subscription.",
        isError: false,
      };
    case "invalid_email":
      return { text: "Please enter a valid email address.", isError: true };
    case "rate_limited":
      return {
        text: `Too many tries. Please try again ${formatRetryAfter(retryAfterMs)}.`,
        isError: true,
      };
    case "error":
      return { text: "We couldn't sign you up. Please try again.", isError: true };
    default:
      return { text: "", isError: false };
  }
};

/**
 * The store's own sign-up form (`useSignupForm`, kit 2.1.0; the merchant's
 * form from Marketing › Forms) state → message under the field. A sign-up
 * shows the form's own success message (the same for every address).
 */
export const getSignupFormMessage = (state, retryAfterMs = null, successMessage = null) => {
  switch (state) {
    case "pending":
      return {
        text: successMessage || getSignupMessage("pending").text,
        isError: false,
      };
    case "invalid_name":
      return { text: "Please use a shorter first name.", isError: true };
    case "name_required":
      return { text: "Please enter your first name.", isError: true };
    case "unavailable":
      return { text: "This form isn't available any more. Please refresh the page.", isError: true };
    default:
      return getSignupMessage(state, retryAfterMs);
  }
};

/** `/email/confirm` page state → heading, text and whether to offer a retry. */
export const getConfirmPageCopy = (state) => {
  switch (state) {
    case "confirmed":
      return {
        title: "You're subscribed",
        body: `Thank you for confirming. ${STORE_NAME} news and offers will reach this inbox; every email has a link to change that.`,
        canRetry: false,
      };
    case "already_confirmed":
      return {
        title: "Already confirmed",
        body: "This address is already subscribed. There's nothing more to do.",
        canRetry: false,
      };
    case "expired":
      return {
        title: "This link has expired",
        body: "Confirmation links work for 7 days. Sign up again and we'll send you a new one.",
        canRetry: false,
      };
    case "rate_limited":
      return {
        title: "Please try again later",
        body: "We've had a lot of requests. Please try again in a little while.",
        canRetry: true,
      };
    case "network_error":
      return {
        title: "Something went wrong",
        body: "We couldn't reach the store. Please check your connection and try again.",
        canRetry: true,
      };
    case "invalid":
      return {
        title: "This link doesn't work",
        body: "It may be incomplete, or the subscription was cancelled since. Sign up again for a new link.",
        canRetry: false,
      };
    default:
      return {
        title: "Confirming your subscription…",
        body: "This will only take a moment.",
        canRetry: false,
      };
  }
};

/** `/email/preferences` page state (not ready) → heading and text. */
export const getPreferencesPageCopy = (state) => {
  switch (state) {
    case "invalid":
      return {
        title: "This link doesn't work",
        body: "Open the preferences link at the bottom of one of our emails again. For your privacy, the link is only read once.",
        canRetry: false,
      };
    case "rate_limited":
      return {
        title: "Please try again later",
        body: "We've had a lot of requests. Please try again in a little while.",
        canRetry: true,
      };
    case "network_error":
    case "error":
      return {
        title: "Something went wrong",
        body: "We couldn't load your preferences. Please try again.",
        canRetry: true,
      };
    default:
      return {
        title: "Loading your preferences…",
        body: "This will only take a moment.",
        canRetry: false,
      };
  }
};

/** A subscription (`subscribed`, `pending`, `unsubscribed`) → status line. */
export const getSubscriptionCopy = (subscription) => {
  switch (subscription) {
    case "subscribed":
      return {
        label: "Subscribed",
        description: `You get ${STORE_NAME} news and offers by email.`,
      };
    case "pending":
      return {
        label: "Waiting for your confirmation",
        description: "Check your inbox for our email and tap its link to confirm.",
      };
    default:
      return {
        label: "Not subscribed",
        description: "You don't get news and offers by email. Order emails always reach you.",
      };
  }
};

/** After a save: what the new subscription means for the shopper. */
export const getSavedMessage = (subscription) => {
  switch (subscription) {
    case "subscribed":
      return "Saved. You're subscribed to news and offers.";
    case "pending":
      return "Saved. Check your inbox: we've sent you a link to confirm.";
    default:
      return "Saved. You won't get news and offers by email any more.";
  }
};

/** A consent error kind (`emailConsentErrorOf`) → a toast message. */
export const getConsentErrorMessage = (kind, retryAfterMs = null) => {
  switch (kind) {
    case "rate_limited":
      return `Too many changes. Please try again ${formatRetryAfter(retryAfterMs)}.`;
    case "no_email":
      return "Your account has no email address yet.";
    case "signed_out":
      return "Please sign in again to change this.";
    case "invalid":
      return "This link doesn't work any more. Open the link in one of our emails again.";
    case "network_error":
      return "We couldn't reach the store. Please check your connection.";
    default:
      return "We couldn't save your preference. Please try again.";
  }
};
