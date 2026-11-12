/**
 * The signed-in checkout on the kit (backend PRD-041 FR-17, kit 1.1.0)
 *
 * The signed-in form (email, a saved or typed delivery address, the
 * billing address) and the bag must reach the kit's `useCheckout().start`
 * as the backend's `OrderAddressInput`, with the same values every time
 * (the kit fingerprints them to find the kept unpaid order); a kept order
 * of another bag or coupon must be dropped; a changed bag or coupon must
 * change the bag fingerprint.
 *
 * Keep in sync with `storefronts/deveshe-dreams/test/checkout-kit.test.mjs`.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const kit = await import("@/utils/checkout-kit");

// ─── Fixtures ─────────────────────────────────────────────────────────────

const savedAddress = (overrides = {}) => ({
  firstname: "Priya",
  lastname: "Sharma",
  addressType: "HOME",
  flat: "Flat 4B",
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
  ...overrides,
});

const CART = {
  _id: "6650a1b2c3d4e5f6a7b8c9d0",
  cart: [
    { productId: "p1", variantId: "v1", qty: 2 },
    { productId: "p2", variantId: null, qty: 1 },
  ],
  promotion: { promotionCode: "DIWALI" },
};

// ─── toCustomerCheckoutInput ──────────────────────────────────────────────

describe("toCustomerCheckoutInput", () => {
  it("sends the delivery address as billing too when it's used as billing", () => {
    const input = kit.toCustomerCheckoutInput(CART, {
      email: " priya@gmail.com ",
      shippingAddress: savedAddress(),
      billingAddress: savedAddress({ city: "Mumbai" }),
      useShippingAsBilling: true,
    });
    assert.equal(input.cartId, CART._id);
    assert.equal(input.email, "priya@gmail.com");
    assert.deepEqual(input.lines, [
      { productId: "p1", variantId: "v1", qty: 2 },
      { productId: "p2", variantId: null, qty: 1 },
    ]);
    assert.deepEqual(input.billingAddress, input.shippingAddress);
    assert.equal(input.shippingAddress.email, "priya@gmail.com");
    // A saved address keeps its flat (the parsed form values drop it)
    assert.equal(input.shippingAddress.flat, "Flat 4B");
    // Empty fields and non-OrderAddressInput fields are dropped
    assert.equal("landmark" in input.shippingAddress, false);
    assert.equal("primary" in input.shippingAddress, false);
    // The bag's own coupon applies on the server: no code is sent
    assert.equal("promotionCode" in input, false);
  });

  it("sends a separate billing address when one was entered", () => {
    const input = kit.toCustomerCheckoutInput(CART, {
      email: "priya@gmail.com",
      shippingAddress: savedAddress(),
      billingAddress: savedAddress({ city: "Mumbai" }),
      useShippingAsBilling: false,
    });
    assert.equal(input.billingAddress.city, "Mumbai");
    assert.equal(input.shippingAddress.city, "Bengaluru");
  });

  it("gives the same input for the same details (stable fingerprint)", () => {
    const values = {
      email: "priya@gmail.com",
      shippingAddress: savedAddress(),
      useShippingAsBilling: true,
    };
    assert.equal(
      JSON.stringify(kit.toCustomerCheckoutInput(CART, values)),
      JSON.stringify(kit.toCustomerCheckoutInput(CART, { ...values })),
    );
  });

  it("copes with an empty form and no bag", () => {
    const input = kit.toCustomerCheckoutInput(undefined, {});
    assert.deepEqual(input, {
      cartId: "",
      lines: [],
      email: "",
      shippingAddress: {},
      billingAddress: {},
    });
  });
});

// ─── isKeptOrderStale ─────────────────────────────────────────────────────

describe("isKeptOrderStale", () => {
  const kept = (overrides = {}) => ({
    orderId: "o1",
    checkoutId: "c1",
    cartId: CART._id,
    fingerprint: "abc",
    session: { promotionCode: "diwali" },
    ...overrides,
  });

  it("keeps the order of this bag and coupon (any case)", () => {
    assert.equal(kit.isKeptOrderStale(kept(), CART), false);
  });

  it("drops the order of another bag", () => {
    assert.equal(kit.isKeptOrderStale(kept({ cartId: "other" }), CART), true);
  });

  it("drops the order when the bag's coupon changed or was removed", () => {
    assert.equal(
      kit.isKeptOrderStale(kept(), { ...CART, promotion: { promotionCode: "NEW" } }),
      true,
    );
    assert.equal(kit.isKeptOrderStale(kept(), { ...CART, promotion: null }), true);
    assert.equal(
      kit.isKeptOrderStale(kept({ session: { promotionCode: null } }), {
        ...CART,
        promotion: null,
      }),
      false,
    );
  });

  it("is never stale without a kept order", () => {
    assert.equal(kit.isKeptOrderStale(null, CART), false);
  });
});

// ─── getCartFingerprint ───────────────────────────────────────────────────

describe("getCartFingerprint", () => {
  it("ignores the line order and changes with a quantity or the coupon", () => {
    const base = kit.getCartFingerprint(CART);
    assert.equal(
      kit.getCartFingerprint({ ...CART, cart: [...CART.cart].reverse() }),
      base,
    );
    assert.notEqual(
      kit.getCartFingerprint({
        ...CART,
        cart: [{ ...CART.cart[0], qty: 3 }, CART.cart[1]],
      }),
      base,
    );
    assert.notEqual(
      kit.getCartFingerprint({ ...CART, promotion: { promotionCode: "NEW" } }),
      base,
    );
  });
});

// ─── Continue to payment → Pay now ────────────────────────────────────────

describe("getDetailsKey / isReservedFor", () => {
  const bag = kit.getCartFingerprint(CART);
  const details = { email: "priya@gmail.com", acceptsMarketing: false };
  const key = kit.getDetailsKey(bag, details);
  const reserved = (overrides = {}) =>
    kit.isReservedFor({
      hasSession: true,
      step: "reserved",
      reservedKey: key,
      detailsKey: key,
      ...overrides,
    });

  it("has no key until the bag has loaded", () => {
    assert.equal(kit.getDetailsKey(null, details), null);
  });

  it("enables Pay now for exactly the reserved bag and details", () => {
    assert.equal(reserved(), true);
    assert.equal(reserved({ step: "dismissed" }), true);
  });

  it("disables Pay now after any change to the details or the news box", () => {
    const changed = kit.getDetailsKey(bag, { ...details, acceptsMarketing: true });
    assert.notEqual(changed, key);
    assert.equal(reserved({ detailsKey: changed }), false);
  });

  it("disables Pay now after a change to the bag or the coupon", () => {
    const otherCoupon = kit.getCartFingerprint({
      ...CART,
      promotion: { promotionCode: "NEW10" },
    });
    assert.equal(
      reserved({ detailsKey: kit.getDetailsKey(otherCoupon, details) }),
      false,
    );
  });

  it("disables Pay now before Continue, while reserving and after a failure", () => {
    assert.equal(reserved({ reservedKey: null }), false);
    assert.equal(reserved({ hasSession: false }), false);
    assert.equal(reserved({ step: "reserving" }), false);
    assert.equal(reserved({ step: "failed" }), false);
    assert.equal(reserved({ step: "idle" }), false);
  });
});
