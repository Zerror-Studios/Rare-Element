/**
 * Guest checkout and the order status page (backend PRD-041 FR-17)
 *
 * Pure helpers the guest checkout and `/orders/status/[token]` use:
 * - `toOrderAddressInput` maps the checkout's address form to the
 *   backend's `OrderAddressInput` (flat strings, empty fields dropped);
 * - `toGuestContact`, `toCheckoutLines` and `toGuestCheckoutInput` build
 *   what the kit's `useCheckout().startGuest` takes from the form and the
 *   bag (`getCart`); the Contact step is the email only, the name and
 *   phone come from the delivery address (owner, 2026-11-12);
 * - `getOrderTimeline`, `getStatusHeading` and `getPaymentStatusLabel`
 *   read the public order status (`orderStatus(token)`).
 *
 * Only `utils/phone` is imported, so `node:test` loads them directly.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/guest-checkout.util.js`.
 */

import { formatPhoneE164 } from "./phone";

// ─── Constants ────────────────────────────────────────────────────────────

/** The address form fields `OrderAddressInput` takes. */
export const ORDER_ADDRESS_FIELDS = [
  "firstname",
  "lastname",
  "addressType",
  "flat",
  "addressline1",
  "addressline2",
  "landmark",
  "phone",
  "countryCode",
  "city",
  "country",
  "states",
  "pincode",
];

export const OrderTimelineStepEnum = {
  CONFIRMED: "CONFIRMED",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

const TIMELINE_LABELS = {
  [OrderTimelineStepEnum.CONFIRMED]: "Confirmed",
  [OrderTimelineStepEnum.SHIPPED]: "Shipped",
  [OrderTimelineStepEnum.DELIVERED]: "Delivered",
  [OrderTimelineStepEnum.CANCELLED]: "Cancelled",
};

/** Fulfilment and courier words that mean the parcel has left. */
const SHIPPED_STATUSES = new Set([
  "SHIPPED",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "PICKED_UP",
  "DELIVERY_FAILED",
  "RTO_INITIATED",
  "RTO_IN_TRANSIT",
  "RTO_DELIVERED",
]);

export const PAYMENT_STATUS_LABELS = {
  PAID: "Paid",
  UN_PAID: "Awaiting payment",
  PARTIALLY_PAID: "Partly paid",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partly refunded",
};

// ─── Checkout ─────────────────────────────────────────────────────────────

const text = (value) =>
  value === undefined || value === null ? "" : String(value).trim();

/** Form address → `OrderAddressInput` (flat strings only). */
export const toOrderAddressInput = (address = {}, email) => {
  const input = email ? { email } : {};
  ORDER_ADDRESS_FIELDS.forEach((field) => {
    if (address?.[field]) input[field] = String(address[field]);
  });
  return input;
};

/**
 * The email and the delivery address → the kit's `GuestContact`: the
 * email lower-cased, the first and last name and the phone of the
 * delivery address, the phone in international form (`+919800000000`,
 * the backend wants 7 to 15 digits). Names only when typed.
 */
export const toGuestContact = (email, address = {}) => {
  const result = {
    email: text(email).toLowerCase(),
    phone: formatPhoneE164(address?.countryCode, address?.phone),
  };
  const firstName = text(address?.firstname);
  const lastName = text(address?.lastname);
  if (firstName) result.firstName = firstName;
  if (lastName) result.lastName = lastName;
  return result;
};

/** `getCart` lines → the kit's checkout lines (its fingerprint input). */
export const toCheckoutLines = (cart) =>
  (cart?.cart || []).map((line) => ({
    productId: line.productId,
    variantId: line.variantId || null,
    qty: line.qty,
  }));

/**
 * The guest form and the bag → `startGuest`'s input. The billing address
 * is sent only when it differs from the delivery address. The bag's own
 * discount code applies on the server, so no code is sent. The "Email me
 * with news and offers" box is the guest's email consent (backend PRD-041
 * FR-7): `acceptsMarketing`, never the cookie banner's choice.
 */
export const toGuestCheckoutInput = (cart, values = {}) => {
  const contact = toGuestContact(values.contact?.email, values.shippingAddress);
  return {
    cartId: cart?._id || "",
    lines: toCheckoutLines(cart),
    contact: { ...contact, acceptsMarketing: values.acceptsMarketing === true },
    shippingAddress: toOrderAddressInput(values.shippingAddress, contact.email),
    billingAddress: values.useShippingAsBilling
      ? null
      : toOrderAddressInput(values.billingAddress, contact.email),
  };
};

// ─── Order status page ────────────────────────────────────────────────────

/**
 * The timeline for an order status: Confirmed → Shipped → Delivered (each
 * `done` or not, one `current`), or Confirmed → Cancelled.
 */
export const getOrderTimeline = (status) => {
  const fulfilment = text(status?.fulfillmentStatus).toUpperCase();
  // Ours (`trackingStatus`, backend PRD-044) first; the provider's wording
  // only for an order whose shipment has no status of ours yet (Q6).
  const shipment = text(
    status?.shipment?.trackingStatus || status?.shipment?.status,
  )
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  const isPaid = text(status?.paymentStatus).toUpperCase() === "PAID";
  if (status?.isCancelled) {
    return [
      {
        key: OrderTimelineStepEnum.CONFIRMED,
        label: TIMELINE_LABELS.CONFIRMED,
        done: isPaid,
        current: false,
      },
      {
        key: OrderTimelineStepEnum.CANCELLED,
        label: TIMELINE_LABELS.CANCELLED,
        done: true,
        current: true,
      },
    ];
  }
  const isDelivered =
    Boolean(status?.shipment?.deliveredAt) ||
    fulfilment === "DELIVERED" ||
    shipment === "DELIVERED";
  const isShipped =
    isDelivered ||
    SHIPPED_STATUSES.has(fulfilment) ||
    SHIPPED_STATUSES.has(shipment);
  const done = {
    [OrderTimelineStepEnum.CONFIRMED]: isPaid || isShipped,
    [OrderTimelineStepEnum.SHIPPED]: isShipped,
    [OrderTimelineStepEnum.DELIVERED]: isDelivered,
  };
  const keys = [
    OrderTimelineStepEnum.CONFIRMED,
    OrderTimelineStepEnum.SHIPPED,
    OrderTimelineStepEnum.DELIVERED,
  ];
  const lastDone = keys.filter((key) => done[key]).pop() || null;
  return keys.map((key) => ({
    key,
    label: TIMELINE_LABELS[key],
    done: done[key],
    current: key === lastDone,
  }));
};

/** "Priya Sharma" → "Priya"; "" when there is no name. */
export const getGreetingName = (status) =>
  text(status?.shippingAddress?.name).split(/\s+/)[0] || "";

/** "Order #NH1042" (never a double "#"). */
export const formatOrderNumber = (orderNo) => {
  const value = text(orderNo).replace(/^#/, "");
  return value ? `Order #${value}` : "Your order";
};

/**
 * The page heading (PRD-041 §7): "Thank you, Priya! Order #NH1042 is
 * confirmed" once paid; otherwise the order and where it stands.
 */
export const getStatusHeading = (status) => {
  const order = formatOrderNumber(status?.orderNo);
  if (status?.isCancelled) return `${order} was cancelled`;
  if (text(status?.paymentStatus).toUpperCase() !== "PAID") {
    return `${order} is waiting for payment`;
  }
  const name = getGreetingName(status);
  return `Thank you${name ? `, ${name}` : ""}! ${order} is confirmed`;
};

/** Words for the payment status; unknown values as sent. */
export const getPaymentStatusLabel = (paymentStatus) =>
  PAYMENT_STATUS_LABELS[text(paymentStatus).toUpperCase()] ||
  text(paymentStatus);
