/**
 * Payment request page state (PRD-028 FR-5, FR-10): answers and errors to
 * one view, amounts, and the return from a redirect payment app.
 *
 * Keep in sync with the other storefront's `test/payment-request.test.mjs`.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const pay = await import("@/utils/payment-request");
const { PayViewEnum } = pay;

const TOKEN = "A".repeat(40) + "b_-";

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

// ─── Mapping ──────────────────────────────────────────────────────────────

describe("payment request view", () => {
  it("accepts only the backend's token shape", () => {
    assert.equal(pay.isPaymentRequestToken(TOKEN), true);
    assert.equal(pay.isPaymentRequestToken("short"), false);
    assert.equal(pay.isPaymentRequestToken(`${TOKEN}x`), false);
    assert.equal(pay.isPaymentRequestToken(`${"A".repeat(42)}/`), false);
    assert.equal(pay.isPaymentRequestToken(null), false);
  });

  it("maps each status, and null to not found", () => {
    assert.equal(pay.viewFromRequest(null), PayViewEnum.NOT_FOUND);
    assert.equal(pay.viewFromRequest({ status: "ACTIVE" }), PayViewEnum.READY);
    assert.equal(pay.viewFromRequest({ status: "PAID" }), PayViewEnum.PAID);
    assert.equal(pay.viewFromRequest({ status: "EXPIRED" }), PayViewEnum.EXPIRED);
    assert.equal(pay.viewFromRequest({ status: "CANCELLED" }), PayViewEnum.INVALID);
    assert.equal(pay.viewFromRequest({ status: "SUPERSEDED" }), PayViewEnum.INVALID);
    assert.equal(pay.viewFromRequest({ status: "SOMETHING" }), PayViewEnum.ERROR);
  });

  it("maps error reasons and codes, never message text", () => {
    const cases = [
      [{ code: "CONFLICT", reason: "PAYMENT_REQUEST_PAID" }, PayViewEnum.PAID],
      [{ code: "CONFLICT", reason: "ALREADY_PAID" }, PayViewEnum.PAID],
      [{ code: "CONFLICT", reason: "PAYMENT_REQUEST_EXPIRED" }, PayViewEnum.EXPIRED],
      [{ code: "CONFLICT", reason: "PAYMENT_REQUEST_CANCELLED" }, PayViewEnum.INVALID],
      [{ code: "CONFLICT", reason: "PAYMENT_REQUEST_SUPERSEDED" }, PayViewEnum.INVALID],
      [{ code: "CONFLICT", reason: "PAYMENT_REQUEST_OUTDATED" }, PayViewEnum.OUTDATED],
      [{ code: "CONFLICT", reason: "CAPTURE_UNDER_REVIEW" }, PayViewEnum.UNDER_REVIEW],
      [{ code: "BAD_USER_INPUT", reason: "RATE_LIMITED" }, PayViewEnum.RATE_LIMITED],
      [{ code: "RATE_LIMITED" }, PayViewEnum.RATE_LIMITED],
      [{ code: "NOT_FOUND" }, PayViewEnum.NOT_FOUND],
      [{ code: "INTERNAL_SERVER_ERROR" }, PayViewEnum.ERROR],
      [{}, PayViewEnum.ERROR],
    ];
    for (const [info, view] of cases) {
      assert.equal(pay.viewFromError({ ...info, message: "PAID" }), view, JSON.stringify(info));
    }
  });

  it("has copy for every view, and only READY is payable", () => {
    for (const view of Object.values(PayViewEnum)) {
      assert.ok(pay.PAY_VIEW_COPY[view]?.title, view);
    }
    assert.deepEqual(pay.PAYABLE_VIEWS, [PayViewEnum.READY]);
  });

  it("maps a verification answer", () => {
    assert.equal(pay.viewFromVerification({ success: true, status: "PAID" }), PayViewEnum.PAID);
    assert.equal(pay.viewFromVerification({ success: false, status: "PAID" }), PayViewEnum.PAID);
    assert.equal(pay.viewFromVerification({ success: false, status: "FAILED" }), PayViewEnum.FAILED);
    assert.equal(pay.viewFromVerification({ success: false, status: "PENDING" }), PayViewEnum.CONFIRMING);
    assert.equal(pay.viewFromVerification(null), PayViewEnum.CONFIRMING);
    assert.ok(pay.RETRYABLE_VIEWS.includes(PayViewEnum.FAILED));
  });

  it("builds the return verify payload from the provider order id", () => {
    assert.deepEqual(pay.returnVerifyPayload("order_123"), { providerOrderId: "order_123" });
    assert.equal(pay.returnVerifyPayload(""), null);
    assert.equal(pay.returnVerifyPayload(undefined), null);
  });

  it("formats amounts in the request's currency", () => {
    assert.equal(pay.formatAmount(7000, "INR"), "₹7,000.00");
    assert.equal(pay.formatAmount(12.5, "usd"), "$12.50");
    assert.equal(pay.formatAmount("x", "INR"), "");
    assert.equal(pay.formatAmount(5, "NOTACURRENCY"), "NOTACURRENCY 5.00");
    assert.equal(pay.formatExpiry(null), "");
    assert.ok(pay.formatExpiry("2026-11-09T12:00:00Z").length > 0);
  });
});

// ─── Return from a redirect payment app ───────────────────────────────────

describe("payment request return", () => {
  it("remembers the link once and forgets it after", () => {
    const storage = memoryStorage();
    pay.savePayReturn(storage, TOKEN, 1000);
    assert.equal(pay.takePayReturn(storage, 2000), TOKEN);
    assert.equal(pay.takePayReturn(storage, 2000), null);
  });

  it("ignores a stale, malformed or missing entry", () => {
    const storage = memoryStorage();
    pay.savePayReturn(storage, TOKEN, 0);
    assert.equal(pay.takePayReturn(storage, pay.PAY_RETURN_MAX_AGE_MS + 1), null);
    pay.savePayReturn(storage, "not-a-token", 0);
    assert.equal(pay.takePayReturn(storage, 1), null);
    storage.setItem(pay.PAY_RETURN_STORAGE_KEY, "{broken");
    assert.equal(pay.takePayReturn(storage, 1), null);
    assert.equal(pay.takePayReturn(null, 1), null);
  });

  it("clears without throwing", () => {
    const storage = memoryStorage();
    pay.savePayReturn(storage, TOKEN, 0);
    pay.clearPayReturn(storage);
    assert.equal(pay.takePayReturn(storage, 1), null);
    pay.clearPayReturn(null);
  });
});
