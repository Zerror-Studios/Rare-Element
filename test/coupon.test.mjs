/**
 * Coupon codes at checkout
 *
 * The code field keeps upper case letters, digits, `-` and `_` (legacy
 * codes), at most 64 characters; a bag code the session left out is
 * reported once as dropped; every promotion answer has its own message,
 * at the summary and at "Continue to payment".
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const coupon = await import("@/utils/coupon");
const errors = await import("@/utils/errors");

const gqlError = (reason) => ({
  graphQLErrors: [{ message: "server text", extensions: { code: "BAD_USER_INPUT", reason } }],
  errors: [{ message: "server text", extensions: { code: "BAD_USER_INPUT", reason } }],
});

describe("normaliseCouponCode", () => {
  it("upper-cases and keeps -, _ and digits", () => {
    assert.equal(coupon.normaliseCouponCode("save-10_new"), "SAVE-10_NEW");
  });
  it("drops spaces and other characters", () => {
    assert.equal(coupon.normaliseCouponCode(" sa ve!10% "), "SAVE10");
  });
  it("caps at 64 characters", () => {
    assert.equal(coupon.normaliseCouponCode("a".repeat(80)).length, 64);
  });
  it("handles empty values", () => {
    assert.equal(coupon.normaliseCouponCode(undefined), "");
  });
});

describe("getDroppedPromotionCode", () => {
  const bag = { promotion: { promotionCode: "SAVE10" } };
  it("reports the bag code when the session has none", () => {
    assert.equal(coupon.getDroppedPromotionCode(bag, { promotionCode: null }), "SAVE10");
  });
  it("is null when the session kept it (any case)", () => {
    assert.equal(coupon.getDroppedPromotionCode(bag, { promotionCode: "save10" }), null);
  });
  it("is null without a bag code or a session", () => {
    assert.equal(coupon.getDroppedPromotionCode({ promotion: null }, {}), null);
    assert.equal(coupon.getDroppedPromotionCode(bag, null), null);
  });
  it("names the code in the notice", () => {
    assert.equal(
      coupon.getDroppedCodeMessage("SAVE10"),
      "Your code SAVE10 no longer applies to this order.",
    );
  });
  it("withoutPromotion leaves the lines", () => {
    const cart = { cart: [{ productId: "p" }], promotion: { promotionCode: "X" } };
    assert.deepEqual(coupon.withoutPromotion(cart), { cart: cart.cart, promotion: null });
  });
});

describe("promotion messages", () => {
  const reasons = [
    "PROMOTION_INVALID",
    "PROMOTION_EXPIRED",
    "PROMOTION_INACTIVE",
    "PROMOTION_EXHAUSTED",
    "PROMOTION_CUSTOMER_LIMIT",
    "PROMOTION_MINIMUM",
    "PROMOTION_NOT_APPLICABLE",
    "PROMOTION_SIGN_IN_REQUIRED",
    "PROMOTION_NEW_CUSTOMERS_ONLY",
    "PROMOTION_NOT_ELIGIBLE",
  ];
  it("gives every reason its own message", () => {
    const messages = reasons.map((reason) => errors.getPromotionMessage(reason));
    assert.equal(new Set(messages).size, reasons.length);
  });
  it("maps an Apollo error by reason, not the generic one", () => {
    for (const reason of reasons) {
      assert.equal(
        errors.getErrorMessage(gqlError(reason), "fallback"),
        errors.getPromotionMessage(reason),
      );
    }
  });
  it("uses the same copy for the kit's checkout keys", () => {
    for (const reason of reasons) {
      assert.equal(errors.getKitKeyMessage(reason), errors.getPromotionMessage(reason));
    }
  });
  it("flags the sign-in answer", () => {
    assert.equal(coupon.isSignInRequiredReason("PROMOTION_SIGN_IN_REQUIRED"), true);
    assert.equal(coupon.isSignInRequiredReason("PROMOTION_INVALID"), false);
  });
});

describe("sign-in path", () => {
  it("returns to the checkout", () => {
    assert.equal(coupon.CHECKOUT_SIGN_IN_PATH, "/login?next=%2Fcheckout");
  });
});
