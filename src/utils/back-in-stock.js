/**
 * Back-in-stock ("Notify me") confirmation helpers (PRD-020, child-PRD
 * review CP-22)
 *
 * A guest's `requestBackInStock` is stored unconfirmed, and the backend
 * mails a link to `/back-in-stock/confirm?token=…` (commerce
 * `BACK_IN_STOCK_CONFIRM_PATH`, template `back_in_stock_confirm`). No
 * restock email goes out until that page calls `confirmBackInStock`, so the
 * form can't be used to mail third parties. A signed-in shopper's request
 * goes to the account email and needs no confirmation. The backend mails
 * one address at most once a day, and that one link confirms all of the
 * address's pending alerts (CP2-03). Too many requests
 * answer `extensions.reason` `RATE_LIMITED`, shown with neutral copy.
 *
 * Pure helpers, so `node:test` covers them without a browser.
 *
 * Keep in sync with
 * `storefronts/deveshe-dreams/src/utils/back-in-stock.util.js`.
 */

import { CombinedGraphQLErrors } from "@apollo/client";

// ─── Constants ────────────────────────────────────────────────────────────

/** The storefront page the confirmation email links to. */
export const BACK_IN_STOCK_CONFIRM_PATH = "/back-in-stock/confirm";

/**
 * The backend's token is 32 random bytes in base64url (43 characters);
 * anything else can't be a token, so it is not sent.
 */
const CONFIRM_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,256}$/;

const HTTP_TOO_MANY_REQUESTS = 429;

export const backInStockConfirmStatusEnum = {
  LOADING: "LOADING",
  CONFIRMED: "CONFIRMED",
  INVALID_LINK: "INVALID_LINK",
  RATE_LIMITED: "RATE_LIMITED",
  NETWORK_ERROR: "NETWORK_ERROR",
};

export const NOTIFY_ME_MESSAGES = {
  SIGNED_IN: "You’ll be notified when this item is back in stock!",
  GUEST:
    "Check your email to confirm your back-in-stock alerts. One link confirms every alert you ask for here, so you only confirm once. If you’ve confirmed this address before, you’re all set.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────

/** The success copy after "Notify me": guests still have to confirm. */
export function getNotifyMeSuccessMessage(isLoggedIn) {
  return isLoggedIn ? NOTIFY_ME_MESSAGES.SIGNED_IN : NOTIFY_ME_MESSAGES.GUEST;
}

/** The token from a query value (string or array), or "" when unusable. */
export function readConfirmToken(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const token = typeof raw === "string" ? raw.trim() : "";
  return CONFIRM_TOKEN_PATTERN.test(token) ? token : "";
}

/**
 * `confirmBackInStock` answered: true confirms every pending alert of the
 * address; false is an unknown, used, replaced or expired token.
 */
export function getConfirmStatusFromAnswer(isConfirmed) {
  return isConfirmed === true
    ? backInStockConfirmStatusEnum.CONFIRMED
    : backInStockConfirmStatusEnum.INVALID_LINK;
}

/**
 * `confirmBackInStock` failed. Branches on `extensions.reason` (and the
 * HTTP 429 of a gateway limit), never on message text: a rate limit can be
 * retried later, any other server answer means the link can't be used,
 * and no answer at all is a network problem worth a retry.
 */
export function getConfirmStatusFromError(error) {
  if (CombinedGraphQLErrors.is(error)) {
    const reason = error.errors?.[0]?.extensions?.reason;
    return reason === "RATE_LIMITED"
      ? backInStockConfirmStatusEnum.RATE_LIMITED
      : backInStockConfirmStatusEnum.INVALID_LINK;
  }
  if (error?.statusCode === HTTP_TOO_MANY_REQUESTS) {
    return backInStockConfirmStatusEnum.RATE_LIMITED;
  }
  return backInStockConfirmStatusEnum.NETWORK_ERROR;
}
