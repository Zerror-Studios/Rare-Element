/**
 * Payment request page state (PRD-028 FR-5, FR-10)
 *
 * `/pay/<token>` is the link a store sends for an order taken offline.
 * The page reads `getPaymentRequest(token)` (null: unknown link; a link
 * that can't be paid has only its status) and pays with
 * `payPaymentRequest(token)`. These helpers turn an answer or an error
 * into one view state, so the page never reads message text. The token
 * is the credential: it is kept only in `sessionStorage` while the
 * shopper is at a redirect or form-post payment app, so the return page
 * can send them back here. The provider's answer is checked with
 * `verifyPaymentRequestPayment(token, payload)` (a guest can't call
 * `verifyPayment`); polling `getPaymentRequest` stays as the fallback
 * while the backend waits for the provider's webhook.
 *
 * View mapping and copy are Nahara's; the link's return storage is the
 * kit's (`PaymentLinkTokenStore`, PRD-002 FR-4.1).
 */

import { PaymentLinkTokenStore } from "@zcom/storefront-kit/core";

// ─── Constants ────────────────────────────────────────────────────────────

export const PayViewEnum = {
  READY: "READY",
  CONFIRMING: "CONFIRMING",
  FAILED: "FAILED",
  PAID: "PAID",
  EXPIRED: "EXPIRED",
  INVALID: "INVALID",
  NOT_FOUND: "NOT_FOUND",
  OUTDATED: "OUTDATED",
  UNDER_REVIEW: "UNDER_REVIEW",
  RATE_LIMITED: "RATE_LIMITED",
  ERROR: "ERROR",
};

/** Title and message for each state (none carries order data). */
export const PAY_VIEW_COPY = {
  [PayViewEnum.READY]: { title: "Complete your payment", message: "" },
  [PayViewEnum.CONFIRMING]: {
    title: "Confirming your payment",
    message:
      "We're checking with the payment provider. This can take a minute; you can keep this page open.",
  },
  [PayViewEnum.FAILED]: {
    title: "The payment didn't go through",
    message: "No money was taken for this attempt. You can try again.",
  },
  [PayViewEnum.PAID]: {
    title: "Already paid, thank you",
    message: "This order is paid. The store will be in touch about delivery.",
  },
  [PayViewEnum.EXPIRED]: {
    title: "This link has expired",
    message: "Please ask the store for a new payment link.",
  },
  [PayViewEnum.INVALID]: {
    title: "This link is no longer valid",
    message: "The store replaced or cancelled it. Please use the latest link they sent you.",
  },
  [PayViewEnum.NOT_FOUND]: {
    title: "We couldn't find this payment link",
    message: "Check that the link is complete, or ask the store for a new one.",
  },
  [PayViewEnum.OUTDATED]: {
    title: "This link is out of date",
    message: "The order changed after the link was sent. Please ask the store for a new one.",
  },
  [PayViewEnum.UNDER_REVIEW]: {
    title: "A payment is being checked",
    message: "An earlier payment on this order is being reviewed by the store. Please try again later.",
  },
  [PayViewEnum.RATE_LIMITED]: {
    title: "Too many attempts",
    message: "Please wait a minute and try again.",
  },
  [PayViewEnum.ERROR]: {
    title: "Something went wrong",
    message: "We couldn't reach the store. Please check your connection and try again.",
  },
};

/** States from which the shopper can (still) press Pay. */
export const PAYABLE_VIEWS = [PayViewEnum.READY];

/** States worth a "Try again" button (nothing about the link is wrong). */
export const RETRYABLE_VIEWS = [
  PayViewEnum.FAILED,
  PayViewEnum.RATE_LIMITED,
  PayViewEnum.ERROR,
];

/** sessionStorage key for the token while the shopper is at the provider. */

/** A stored return older than this is ignored (a payment session's life). */

/** Confirming polls this often, this long (then "check again"). */
export const PAY_CONFIRM_POLL_MS = 3 * 1000;
export const PAY_CONFIRM_TIMEOUT_MS = 60 * 1000;

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const STATUS_VIEWS = {
  ACTIVE: PayViewEnum.READY,
  PAID: PayViewEnum.PAID,
  EXPIRED: PayViewEnum.EXPIRED,
  CANCELLED: PayViewEnum.INVALID,
  SUPERSEDED: PayViewEnum.INVALID,
};

const REASON_VIEWS = {
  PAYMENT_REQUEST_PAID: PayViewEnum.PAID,
  ALREADY_PAID: PayViewEnum.PAID,
  PAYMENT_REQUEST_EXPIRED: PayViewEnum.EXPIRED,
  PAYMENT_REQUEST_CANCELLED: PayViewEnum.INVALID,
  PAYMENT_REQUEST_SUPERSEDED: PayViewEnum.INVALID,
  PAYMENT_REQUEST_OUTDATED: PayViewEnum.OUTDATED,
  CAPTURE_UNDER_REVIEW: PayViewEnum.UNDER_REVIEW,
  RATE_LIMITED: PayViewEnum.RATE_LIMITED,
};

// ─── Mapping ──────────────────────────────────────────────────────────────

/** True when `token` has the shape the backend makes (else: not found). */
export function isPaymentRequestToken(token) {
  return typeof token === "string" && TOKEN_PATTERN.test(token);
}

/** The view for a `getPaymentRequest` answer (null: unknown link). */
export function viewFromRequest(request) {
  if (!request) return PayViewEnum.NOT_FOUND;
  return STATUS_VIEWS[request.status] || PayViewEnum.ERROR;
}

/** The view for a GraphQL error's `{ code, reason }` (never its message). */
export function viewFromError({ code, reason } = {}) {
  if (reason && REASON_VIEWS[reason]) return REASON_VIEWS[reason];
  if (code === "NOT_FOUND") return PayViewEnum.NOT_FOUND;
  if (code === "RATE_LIMITED") return PayViewEnum.RATE_LIMITED;
  return PayViewEnum.ERROR;
}

/**
 * The view for a `verifyPaymentRequestPayment` answer: PAID when paid,
 * FAILED when the provider failed it, else CONFIRMING (still pending:
 * keep polling).
 */
export function viewFromVerification(result) {
  if (result?.success || result?.status === "PAID") return PayViewEnum.PAID;
  if (result?.status === "FAILED") return PayViewEnum.FAILED;
  return PayViewEnum.CONFIRMING;
}

/**
 * The verify payload for a return from a redirect payment app: the
 * provider order id the return route read (`ref`), or null without one.
 */
export function returnVerifyPayload(ref) {
  return typeof ref === "string" && ref ? { providerOrderId: ref } : null;
}

/** "₹7,000.00"; a currency Intl doesn't know falls back to "XYZ 7000.00". */
export function formatAmount(amount, currency) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "";
  const code = String(currency || "INR").toUpperCase();
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: code }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}

/** "7 Nov 2026, 5:30 pm" in the shopper's locale, or "". */
export function formatExpiry(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

// ─── Return from a redirect payment app ───────────────────────────────────

/*
 * The link is remembered in the kit's `PaymentLinkTokenStore` (sessionStorage,
 * 2 hours, token-shape checked), which the kit's `usePaymentReturn` reads on
 * `/checkout/payment-return`. `storage` is kept in the signatures for the
 * existing callers; the kit picks the session storage itself.
 */

/** Remembers the link while the shopper is at the payment app. */
export function savePayReturn(_storage, token, now = Date.now()) {
  if (!isPaymentRequestToken(token)) return;
  PaymentLinkTokenStore.save(token, now);
}

/** The remembered link (once: it is removed), or null when stale or none. */
export function takePayReturn(_storage, now = Date.now()) {
  const token = PaymentLinkTokenStore.get(now);
  PaymentLinkTokenStore.clear();
  return token;
}

/** Forgets the remembered link (paid, or the shopper left). */
export function clearPayReturn() {
  PaymentLinkTokenStore.clear();
}
