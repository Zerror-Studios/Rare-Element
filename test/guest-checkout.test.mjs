/**
 * Guest checkout and the order status page (backend PRD-041 FR-17)
 *
 * The store's address form must reach the kit's `startGuest` as the
 * backend's `OrderAddressInput` and `GuestContact` (Contact is the email
 * only; the name and phone come from the delivery address, owner
 * 2026-11-12), the guest form must validate like the backend (email, and
 * a real delivery phone), and the status
 * page must read the public order status into the heading and timeline
 * the UX asks for. The kit's own messages are used for its error keys
 * unless the store has its own.
 *
 * Keep in sync with `storefronts/deveshe-dreams/test/guest-checkout.test.mjs`.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const guest = await import("@/utils/guest-checkout");
const { GuestCheckoutSchema } = await import("@/validations/CheckoutValidation");
const { getKitKeyMessage, REASON_MESSAGES } = await import("@/utils/errors");

// ─── Fixtures ─────────────────────────────────────────────────────────────

const formAddress = (overrides = {}) => ({
  firstname: "Priya",
  lastname: "Sharma",
  addressType: "HOME",
  flat: "",
  addressline1: "12 MG Road",
  addressline2: "",
  landmark: "",
  country: "India",
  states: "Karnataka",
  city: "Bengaluru",
  pincode: "560001",
  countryCode: "+91",
  phone: "9800000000",
  primary: true,
  company: "Ignored Ltd",
  ...overrides,
});

const contact = (overrides = {}) => ({
  email: " Priya.Sharma@Gmail.com ",
  ...overrides,
});

const CART = {
  _id: "6650a1b2c3d4e5f6a7b8c9d0",
  cart: [
    { productId: "p1", variantId: "v1", qty: 2, name: "Dress", price: 100 },
    { productId: "p2", variantId: null, qty: 1, name: "Scarf", price: 50 },
  ],
  promotion: { promotionCode: "DIWALI" },
};

const status = (overrides = {}) => ({
  orderNo: "NH1042",
  placedAt: "2026-11-12T10:00:00.000Z",
  currency: "INR",
  paymentStatus: "PAID",
  fulfillmentStatus: "UNFULFILLED",
  isCancelled: false,
  shipment: null,
  shippingAddress: { name: "Priya Sharma", line: "12 •••", city: "Bengaluru" },
  ...overrides,
});

// ─── Checkout input ───────────────────────────────────────────────────────

describe("toOrderAddressInput", () => {
  it("keeps only OrderAddressInput fields, as strings, empty ones dropped", () => {
    const input = guest.toOrderAddressInput(formAddress(), "priya@gmail.com");
    assert.deepEqual(input, {
      email: "priya@gmail.com",
      firstname: "Priya",
      lastname: "Sharma",
      addressType: "HOME",
      addressline1: "12 MG Road",
      phone: "9800000000",
      countryCode: "+91",
      city: "Bengaluru",
      country: "India",
      states: "Karnataka",
      pincode: "560001",
    });
  });

  it("sends no email key without an email", () => {
    assert.equal("email" in guest.toOrderAddressInput(formAddress()), false);
  });
});

describe("toGuestContact", () => {
  it("takes the email and the delivery address's names and phone", () => {
    assert.deepEqual(
      guest.toGuestContact(" Priya.Sharma@Gmail.com ", formAddress({ phone: "98000 00000" })),
      {
        email: "priya.sharma@gmail.com",
        phone: "+919800000000",
        firstName: "Priya",
        lastName: "Sharma",
      },
    );
  });

  it("joins another country's code with the national number", () => {
    const result = guest.toGuestContact(
      "a@b.co",
      formAddress({ countryCode: "+1", phone: "(212) 555-0123", lastname: "" }),
    );
    assert.equal(result.phone, "+12125550123");
    assert.equal("lastName" in result, false);
  });

  it("keeps a phone without a country code as digits", () => {
    assert.equal(
      guest.toGuestContact("a@b.co", formAddress({ countryCode: "" })).phone,
      "9800000000",
    );
  });
});

describe("toGuestCheckoutInput", () => {
  it("builds startGuest's input from the bag and the form", () => {
    const input = guest.toGuestCheckoutInput(CART, {
      contact: contact(),
      shippingAddress: formAddress(),
      useShippingAsBilling: true,
    });
    assert.equal(input.cartId, CART._id);
    assert.deepEqual(input.lines, [
      { productId: "p1", variantId: "v1", qty: 2 },
      { productId: "p2", variantId: null, qty: 1 },
    ]);
    assert.equal(input.contact.email, "priya.sharma@gmail.com");
    // Name and phone come from the delivery address
    assert.equal(input.contact.firstName, "Priya");
    assert.equal(input.contact.lastName, "Sharma");
    assert.equal(input.contact.phone, "+919800000000");
    assert.equal(input.shippingAddress.email, "priya.sharma@gmail.com");
    assert.equal(input.billingAddress, null);
    // The bag's own coupon applies on the server; none is sent
    assert.equal("promotionCode" in input, false);
    // The news box is off unless ticked
    assert.equal(input.contact.acceptsMarketing, false);
  });

  it("sends the news box as the guest's email consent (PRD-041 FR-7)", () => {
    const input = guest.toGuestCheckoutInput(CART, {
      contact: contact(),
      shippingAddress: formAddress(),
      useShippingAsBilling: true,
      acceptsMarketing: true,
    });
    assert.equal(input.contact.acceptsMarketing, true);
  });

  it("sends a separate billing address only when it differs", () => {
    const input = guest.toGuestCheckoutInput(CART, {
      contact: contact(),
      shippingAddress: formAddress(),
      billingAddress: formAddress({ city: "Mysuru" }),
      useShippingAsBilling: false,
    });
    assert.equal(input.billingAddress.city, "Mysuru");
  });
});

describe("GuestCheckoutSchema", () => {
  const values = (overrides = {}) => ({
    contact: contact(),
    shippingAddress: formAddress(),
    useShippingAsBilling: true,
    ...overrides,
  });

  it("accepts a complete guest form", () => {
    assert.equal(GuestCheckoutSchema.safeParse(values()).success, true);
  });

  it("asks Contact for the email only", () => {
    const badEmail = GuestCheckoutSchema.safeParse(
      values({ contact: contact({ email: "not-an-email" }) }),
    );
    assert.equal(badEmail.success, false);
    assert.deepEqual(badEmail.error.issues[0].path, ["contact", "email"]);
    // No phone or name in Contact any more
    assert.equal(GuestCheckoutSchema.safeParse(values({ contact: { email: "a@b.co" } })).success, true);
  });

  it("requires the delivery names and a valid delivery phone", () => {
    const noName = GuestCheckoutSchema.safeParse(
      values({ shippingAddress: formAddress({ firstname: "" }) }),
    );
    assert.equal(noName.success, false);
    assert.deepEqual(noName.error.issues[0].path, ["shippingAddress", "firstname"]);
    const landline = GuestCheckoutSchema.safeParse(
      values({ shippingAddress: formAddress({ phone: "5800000000" }) }),
    );
    assert.equal(landline.success, false);
    assert.deepEqual(landline.error.issues[0].path, ["shippingAddress", "phone"]);
    assert.equal(landline.error.issues[0].message, "Enter a valid phone number");
    const shortPhone = GuestCheckoutSchema.safeParse(
      values({ shippingAddress: formAddress({ phone: "12345" }) }),
    );
    assert.equal(shortPhone.success, false);
  });

  it("checks the billing address only when it is separate", () => {
    const result = GuestCheckoutSchema.safeParse(
      values({ useShippingAsBilling: false, billingAddress: { firstname: "" } }),
    );
    assert.equal(result.success, false);
    assert.equal(result.error.issues[0].path[0], "billingAddress");
  });
});

// ─── Order status page ────────────────────────────────────────────────────

describe("getStatusHeading", () => {
  it("thanks the shopper by first name once paid", () => {
    assert.equal(
      guest.getStatusHeading(status()),
      "Thank you, Priya! Order #NH1042 is confirmed",
    );
  });

  it("never doubles the # and works without a name", () => {
    assert.equal(
      guest.getStatusHeading(status({ orderNo: "#NH7", shippingAddress: null })),
      "Thank you! Order #NH7 is confirmed",
    );
  });

  it("says when the order is unpaid or cancelled", () => {
    assert.equal(
      guest.getStatusHeading(status({ paymentStatus: "UN_PAID" })),
      "Order #NH1042 is waiting for payment",
    );
    assert.equal(
      guest.getStatusHeading(status({ isCancelled: true })),
      "Order #NH1042 was cancelled",
    );
  });
});

describe("getOrderTimeline", () => {
  const doneKeys = (s) =>
    guest.getOrderTimeline(s).filter((step) => step.done).map((step) => step.key);
  const currentKey = (s) =>
    guest.getOrderTimeline(s).find((step) => step.current)?.key ?? null;

  it("is Confirmed only for a paid, unshipped order", () => {
    assert.deepEqual(doneKeys(status()), ["CONFIRMED"]);
    assert.equal(currentKey(status()), "CONFIRMED");
  });

  it("marks Shipped from the fulfilment or the courier status", () => {
    assert.deepEqual(doneKeys(status({ fulfillmentStatus: "FULFILLED" })), [
      "CONFIRMED",
      "SHIPPED",
    ]);
    const inTransit = status({
      shipment: { status: "In Transit", awbCode: "AWB1", courierName: "Delhivery" },
    });
    assert.equal(currentKey(inTransit), "SHIPPED");
  });

  it("reads our shipment status first (backend PRD-044)", () => {
    const pickupScheduled = status({
      shipment: { trackingStatus: "PICKUP_SCHEDULED", status: "In Transit" },
    });
    assert.equal(currentKey(pickupScheduled), "CONFIRMED");
    const outForDelivery = status({
      shipment: { trackingStatus: "OUT_FOR_DELIVERY", status: null },
    });
    assert.equal(currentKey(outForDelivery), "SHIPPED");
    const delivered = status({
      shipment: { trackingStatus: "DELIVERED", status: null },
    });
    assert.equal(currentKey(delivered), "DELIVERED");
  });

  it("marks Delivered from the delivery date", () => {
    const delivered = status({
      fulfillmentStatus: "FULFILLED",
      shipment: { status: "Delivered", deliveredAt: "2026-11-14T10:00:00.000Z" },
    });
    assert.deepEqual(doneKeys(delivered), ["CONFIRMED", "SHIPPED", "DELIVERED"]);
    assert.equal(currentKey(delivered), "DELIVERED");
  });

  it("has nothing done for an unpaid order", () => {
    assert.deepEqual(doneKeys(status({ paymentStatus: "UN_PAID" })), []);
    assert.equal(currentKey(status({ paymentStatus: "UN_PAID" })), null);
  });

  it("ends in Cancelled for a cancelled order", () => {
    const steps = guest.getOrderTimeline(status({ isCancelled: true }));
    assert.deepEqual(
      steps.map((step) => step.key),
      ["CONFIRMED", "CANCELLED"],
    );
    assert.equal(steps[1].current, true);
  });
});

describe("getPaymentStatusLabel", () => {
  it("labels known statuses and passes others through", () => {
    assert.equal(guest.getPaymentStatusLabel("PAID"), "Paid");
    assert.equal(guest.getPaymentStatusLabel("UN_PAID"), "Awaiting payment");
    assert.equal(guest.getPaymentStatusLabel("ON_HOLD"), "ON_HOLD");
  });
});

// ─── Kit messages ─────────────────────────────────────────────────────────

describe("getKitKeyMessage", () => {
  it("uses the kit's copy for the PRD-041 refusals", () => {
    assert.match(getKitKeyMessage("INVALID_GUEST_TOKEN"), /timed out; your bag is saved/);
    assert.equal(getKitKeyMessage("SIGN_IN_REQUIRED"), "Sign in to check out.");
    assert.equal(getKitKeyMessage("INVALID_PHONE"), "Enter a valid phone number.");
  });

  it("prefers the store's own copy for a key it has", () => {
    assert.equal(getKitKeyMessage("SHIPPING_UNAVAILABLE"), REASON_MESSAGES.SHIPPING_UNAVAILABLE);
  });

  it("takes overrides and has a fallback", () => {
    assert.equal(getKitKeyMessage("INVALID_LOGIN_CODE", { INVALID_LOGIN_CODE: "x" }), "x");
    assert.equal(getKitKeyMessage("SOMETHING_NEW"), getKitKeyMessage("UNKNOWN"));
    assert.equal(getKitKeyMessage(null), "");
  });
});
