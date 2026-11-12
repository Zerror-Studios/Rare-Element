/**
 * The checkout's shipping line (2026-11-13): session pricing, else the
 * server's estimate for the address, else a prompt for the address.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { getEstimatedShipping, getShippingLabel } from "../src/utils/shipping-label.js";

describe("getShippingLabel", () => {
  it("shows the reserved session's shipping first", () => {
    assert.equal(getShippingLabel({ pricing: { shipping: 80 }, estimate: { shipping: 60, available: true } }), "₹ 80");
    assert.equal(getShippingLabel({ pricing: { shipping: 0, isFreeShipping: true } }), "Free");
  });

  it("shows the estimate before Continue to payment", () => {
    assert.equal(getShippingLabel({ estimate: { shipping: 60, isFreeShipping: false, available: true } }), "₹ 60");
    assert.equal(getShippingLabel({ estimate: { shipping: 0, isFreeShipping: true, available: true } }), "Free");
    assert.equal(
      getShippingLabel({ estimate: { shipping: 0, isFreeShipping: false, available: false } }),
      "We can't ship to this address yet",
    );
  });

  it("says calculating while it loads and asks for the address otherwise", () => {
    assert.equal(getShippingLabel({ estimating: true }), "Calculating…");
    assert.equal(getShippingLabel({ isPricing: true }), "Calculating…");
    assert.equal(getShippingLabel({}), "Enter your address to see shipping");
    assert.equal(getShippingLabel({ isFreeShippingEnabled: true }), "Free");
  });
});

describe("getEstimatedShipping", () => {
  it("adds the estimate to the bag total only before the session prices it", () => {
    assert.equal(getEstimatedShipping(null, { shipping: 60, available: true }), 60);
    assert.equal(getEstimatedShipping({ total: 1 }, { shipping: 60, available: true }), 0);
    assert.equal(getEstimatedShipping(null, { shipping: 60, available: false }), 0);
    assert.equal(getEstimatedShipping(null, { shipping: 0, isFreeShipping: true, available: true }), 0);
  });
});

describe("getShippingLabel with the store's formatter", () => {
  it("formats amounts with the given function", () => {
    const format = (n) => `INR ${n}.00`;
    assert.equal(getShippingLabel({ estimate: { shipping: 60, available: true }, format }), "INR 60.00");
  });
});
