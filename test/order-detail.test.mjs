/**
 * Order detail helpers: status, tracking, cancel and return form state
 * (PRD-015 FR-20), and the error reasons both storefronts map (PRD-015,
 * PRD-016 FR-25).
 *
 * Keep in sync with the other storefront's `test/order-detail.test.mjs`.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CombinedGraphQLErrors } from "@apollo/client";

const order = await import("@/utils/order-detail");
const { getErrorMessage } = await import("@/utils/errors");

const gqlError = (code, reason) =>
  new CombinedGraphQLErrors({
    data: null,
    errors: [{ message: "server text", extensions: { code, reason } }],
  });

const ITEMS = [
  { orderItemId: "line-1", name: "Ring", qty: 2, returnRequestedQty: 0, returnableQty: 2 },
  { orderItemId: "line-2", name: "Chain", qty: 1, returnRequestedQty: 1, returnableQty: 0 },
];

// ─── Status and tracking ──────────────────────────────────────────────────

describe("status", () => {
  it("labels every display status and falls back for unknown ones", () => {
    for (const value of Object.keys(order.ORDER_STATUS_LABELS)) {
      assert.ok(order.getOrderStatusLabel(value));
    }
    assert.equal(order.getOrderStatusLabel("NEW_VALUE", "Paid"), "Paid");
    assert.equal(order.getOrderStatusLabel(null, "Paid"), "Paid");
  });

  it("labels return statuses", () => {
    assert.equal(order.getReturnStatusLabel("CANCELLED"), "Withdrawn");
    assert.equal(order.getReturnStatusLabel("REQUESTED"), "Requested");
  });
});

describe("tracking", () => {
  it("keeps only https tracking links", () => {
    assert.equal(
      order.getSafeTrackingUrl("https://track.example/AWB1"),
      "https://track.example/AWB1",
    );
    assert.equal(order.getSafeTrackingUrl("http://track.example/AWB1"), null);
    assert.equal(order.getSafeTrackingUrl("javascript:alert(1)"), null);
    assert.equal(order.getSafeTrackingUrl(null), null);
  });

  it("lists the latest scans first and drops empty ones", () => {
    const scans = order.toTrackingScans([
      { date: "2026-10-20 10:00:00", activity: "Picked up", location: "Delhi" },
      { date: "2026-10-22 09:00:00", "sr-status-label": "Delivered" },
      { date: "2026-10-21 09:00:00" },
    ]);
    assert.deepEqual(
      scans.map((scan) => scan.label),
      ["Delivered", "Picked up"],
    );
    assert.equal(order.toTrackingScans(null).length, 0);
  });
});

// ─── Cancel ───────────────────────────────────────────────────────────────

describe("cancel", () => {
  it("trims the reason, drops an empty one and caps its length", () => {
    assert.equal(order.toCancelReason("  Ordered twice "), "Ordered twice");
    assert.equal(order.toCancelReason("   "), undefined);
    assert.equal(
      order.toCancelReason("x".repeat(600)).length,
      order.CANCEL_REASON_MAX_LENGTH,
    );
  });
});

// ─── Return form ──────────────────────────────────────────────────────────

describe("return form", () => {
  it("starts empty and clamps quantities to what can be returned", () => {
    let form = order.createReturnForm(ITEMS);
    assert.deepEqual(form.quantities, { "line-1": 0, "line-2": 0 });
    form = order.setReturnQuantity(form, ITEMS[0], 5);
    assert.equal(form.quantities["line-1"], 2);
    form = order.setReturnQuantity(form, ITEMS[0], -1);
    assert.equal(form.quantities["line-1"], 0);
    form = order.setReturnQuantity(form, ITEMS[1], 1);
    assert.equal(form.quantities["line-2"], 0);
  });

  it("asks for an item, a reason and a condition", () => {
    let form = order.createReturnForm(ITEMS);
    assert.ok(order.toCreateReturnInput("o1", form, ITEMS).error);
    form = order.setReturnQuantity(form, ITEMS[0], 1);
    assert.match(order.toCreateReturnInput("o1", form, ITEMS).error, /reason/);
    form = { ...form, reason: "SIZE_OR_FIT" };
    assert.match(order.toCreateReturnInput("o1", form, ITEMS).error, /condition/);
  });

  it("sends line ids with the chosen quantity, reason and condition", () => {
    let form = order.createReturnForm(ITEMS);
    form = order.setReturnQuantity(form, ITEMS[0], 2);
    form = { ...form, reason: "SIZE_OR_FIT", condition: "UNUSED_WITH_TAGS" };
    assert.deepEqual(order.toCreateReturnInput("o1", form, ITEMS), {
      input: {
        orderId: "o1",
        items: [
          {
            orderItemId: "line-1",
            quantity: 2,
            reason: "SIZE_OR_FIT",
            condition: "UNUSED_WITH_TAGS",
          },
        ],
      },
    });
  });

  it("lets only a REQUESTED return be withdrawn", () => {
    assert.equal(order.canWithdrawReturn({ status: "REQUESTED" }), true);
    assert.equal(order.canWithdrawReturn({ status: "APPROVED" }), false);
  });
});

// ─── Error reasons ────────────────────────────────────────────────────────

describe("error reasons", () => {
  it("maps the cancel and return reasons, never the server text", () => {
    const cases = {
      ORDER_NOT_CANCELLABLE:
        "This order can no longer be cancelled; contact the store.",
      PAYMENT_IN_PROGRESS:
        "A payment is in progress; try again in a few minutes.",
    };
    for (const [reason, copy] of Object.entries(cases)) {
      assert.equal(getErrorMessage(gqlError("BAD_USER_INPUT", reason)), copy);
    }
    for (const reason of [
      "ORDER_NOT_DELIVERED",
      "RETURN_WINDOW_CLOSED",
      "RETURNS_DISABLED",
      "ORDER_NOT_RETURNABLE",
      "INVALID_ORDER_ITEM",
      "INVALID_QUANTITY",
      "RETURN_QUANTITY_EXCEEDED",
      "INVALID_TRANSITION",
      "RETURN_CHANGED",
    ]) {
      const message = getErrorMessage(gqlError("BAD_USER_INPUT", reason), "x");
      assert.notEqual(message, "x", reason);
      assert.notEqual(message, "server text", reason);
    }
  });

  it("names the date when the return window closed", () => {
    const message = getErrorMessage(
      gqlError("BAD_USER_INPUT", "RETURN_WINDOW_CLOSED"),
      "x",
      order.getReturnErrorOverrides("2026-10-20T00:00:00.000Z"),
    );
    assert.match(message, /^The return window for this order closed on .*2026\.$/);
  });

  it("maps STORE_ORDERS_PAUSED at checkout (PRD-016 FR-25)", () => {
    assert.equal(
      getErrorMessage(gqlError("FORBIDDEN", "STORE_ORDERS_PAUSED")),
      "This store isn't taking orders right now.",
    );
  });
});
