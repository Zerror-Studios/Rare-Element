/**
 * Order detail: status, tracking, cancel and return form state (PRD-015 FR-20)
 *
 * Everything shown here comes from server-computed order fields:
 * `displayStatus`, `shipment { awb courier trackingUrl tracking }`,
 * `canCancel`, `returnableItems`, `returnableUntil` and `returnRequests`.
 * The page never derives a status from `paymentStatus`/`fulfillmentStatus`
 * and never decides on its own whether a cancel or return is allowed; the
 * server re-checks both. Reasons for refusals are mapped in
 * `utils/errors.js` by `extensions.reason`.
 *
 * Pure functions, no imports, so `node:test` loads them directly.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/order-detail.util.js`.
 */

// ─── Constants ────────────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS = {
  AWAITING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_IN_PROGRESS: "Return in progress",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
  RETURNED_TO_ORIGIN: "Returned to sender",
  DELIVERY_ISSUE: "Delivery issue",
};

export const RETURN_STATUS_LABELS = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RECEIVED: "Received",
  REFUNDED: "Refunded",
  CANCELLED: "Withdrawn",
  CLOSED: "Closed",
};

/** Values sent as `reason`; labels are shown in the select. */
export const RETURN_REASONS = [
  { value: "SIZE_OR_FIT", label: "Size or fit" },
  { value: "DAMAGED_OR_DEFECTIVE", label: "Damaged or defective" },
  { value: "NOT_AS_DESCRIBED", label: "Not as described" },
  { value: "WRONG_ITEM", label: "Wrong item received" },
  { value: "CHANGED_MIND", label: "Changed my mind" },
  { value: "OTHER", label: "Other" },
];

/** Values sent as `condition`. */
export const RETURN_CONDITIONS = [
  { value: "UNUSED_WITH_TAGS", label: "Unused, with tags" },
  { value: "UNUSED_NO_TAGS", label: "Unused, without tags" },
  { value: "USED", label: "Used" },
  { value: "DAMAGED", label: "Damaged" },
];

export const CANCEL_REASON_MAX_LENGTH = 500;
export const TRACKING_SCAN_LIMIT = 5;
export const CANCEL_CONFIRM_MESSAGE =
  "Cancel this order? If you have paid, the refund goes back to your " +
  "original payment method within the store's refund timeline.";

const WITHDRAWABLE_RETURN_STATUS = "REQUESTED";
const SAFE_URL_PROTOCOL = "https:";

// ─── Status ───────────────────────────────────────────────────────────────

/** Words for `Order.displayStatus`; unknown values fall back. */
export const getOrderStatusLabel = (displayStatus, fallback = "") =>
  ORDER_STATUS_LABELS[displayStatus] || fallback;

export const getReturnStatusLabel = (status) =>
  RETURN_STATUS_LABELS[status] || status || "";

/** "26 Oct 2026" (Indian English), or "" for a missing or bad date. */
export const formatOrderDate = (value) => {
  if (!value) return "";
  const date = new Date(
    /^\d+$/.test(String(value)) ? Number(value) : value,
  );
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ─── Tracking ─────────────────────────────────────────────────────────────

/** The tracking link only when the server gave an https URL. */
export const getSafeTrackingUrl = (url) => {
  if (!url) return null;
  try {
    return new URL(url).protocol === SAFE_URL_PROTOCOL ? url : null;
  } catch {
    return null;
  }
};

/**
 * The latest scans, newest first, as `{ key, date, label, location }`.
 * Scans are the provider's JSON (Shiprocket: `date`, `activity`, `status`,
 * `location`, `sr-status-label`); anything without a label is dropped.
 */
export const toTrackingScans = (tracking, limit = TRACKING_SCAN_LIMIT) =>
  (Array.isArray(tracking) ? tracking : [])
    .map((scan) => ({
      date: scan?.date || null,
      label:
        scan?.activity || scan?.["sr-status-label"] || scan?.status || "",
      location: scan?.location || "",
    }))
    .filter((scan) => scan.label)
    .sort((a, b) => {
      const left = new Date(a.date || 0).getTime() || 0;
      const right = new Date(b.date || 0).getTime() || 0;
      return right - left;
    })
    .slice(0, limit)
    .map((scan, index) => ({ key: `${scan.date || "scan"}-${index}`, ...scan }));

// ─── Cancel ───────────────────────────────────────────────────────────────

/** The `reason` sent with `cancelMyOrder` (trimmed, ≤ 500 characters). */
export const toCancelReason = (text) => {
  const reason = String(text || "").trim();
  return reason ? reason.slice(0, CANCEL_REASON_MAX_LENGTH) : undefined;
};

// ─── Returns ──────────────────────────────────────────────────────────────

/** Empty form: every line at 0, no reason or condition chosen. */
export const createReturnForm = (returnableItems) => ({
  quantities: Object.fromEntries(
    (returnableItems || []).map((item) => [item.orderItemId, 0]),
  ),
  reason: "",
  condition: "",
});

/** Sets one line's quantity, clamped to 0..`returnableQty`. */
export const setReturnQuantity = (form, item, quantity) => {
  const max = Math.max(0, Number(item?.returnableQty) || 0);
  const wanted = Math.floor(Number(quantity) || 0);
  return {
    ...form,
    quantities: {
      ...form.quantities,
      [item.orderItemId]: Math.min(max, Math.max(0, wanted)),
    },
  };
};

/**
 * Checks the form before sending. Returns `{ error }` (shopper copy) or
 * `{ input }` for `createReturnRequest` (line ids, never variant ids).
 */
export const toCreateReturnInput = (orderId, form, returnableItems) => {
  const items = (returnableItems || [])
    .map((item) => ({
      item,
      quantity: Number(form?.quantities?.[item.orderItemId]) || 0,
    }))
    .filter(({ quantity }) => quantity > 0);
  if (!items.length) {
    return { error: "Choose at least one item to return." };
  }
  if (items.some(({ item, quantity }) => quantity > item.returnableQty)) {
    return { error: "You can't return more than you can still return." };
  }
  if (!form?.reason) return { error: "Choose a reason for the return." };
  if (!form?.condition) return { error: "Choose the items' condition." };
  return {
    input: {
      orderId,
      items: items.map(({ item, quantity }) => ({
        orderItemId: item.orderItemId,
        quantity,
        reason: form.reason,
        condition: form.condition,
      })),
    },
  };
};

export const canWithdrawReturn = (returnRequest) =>
  returnRequest?.status === WITHDRAWABLE_RETURN_STATUS;

/**
 * Screen copy that needs the order's own data: the closed window names its
 * date (PRD-015 §6).
 */
export const getReturnErrorOverrides = (returnableUntil) => {
  const date = formatOrderDate(returnableUntil);
  return date
    ? {
        RETURN_WINDOW_CLOSED: `The return window for this order closed on ${date}.`,
      }
    : {};
};
