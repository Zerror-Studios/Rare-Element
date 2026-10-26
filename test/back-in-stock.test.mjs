/**
 * Back-in-stock confirmation helpers (PRD-020, child-PRD review CP-22):
 * the guest vs signed-in copy after "Notify me", the token read from the
 * confirmation link, the `confirmBackInStock` answer and error mapping
 * (by `extensions.reason`, never message text), and the neutral
 * `RATE_LIMITED` message.
 *
 * Keep in sync with `storefronts/deveshe-dreams/test/back-in-stock.test.mjs`.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CombinedGraphQLErrors, ServerError } from "@apollo/client";

const bis = await import("@/utils/back-in-stock");
const { getErrorMessage } = await import("@/utils/errors");

const StatusEnum = bis.backInStockConfirmStatusEnum;

const gqlError = (code, reason, message = "server text") =>
  new CombinedGraphQLErrors({
    data: null,
    errors: [{ message, extensions: { code, reason } }],
  });

/** A token as the backend makes it: 32 random bytes in base64url. */
const TOKEN = "q0F2xY7-_b9KdZ3mN8pR4sT6uV1wX5yA2cE0gH3jL6o";

// ─── Notify me copy ───────────────────────────────────────────────────────

describe("notify-me success copy", () => {
  it("asks a guest to confirm by email", () => {
    assert.match(bis.getNotifyMeSuccessMessage(false), /check your email/i);
  });

  it("tells a guest one link confirms all their alerts (CP2-03)", () => {
    assert.match(bis.getNotifyMeSuccessMessage(false), /only confirm once/i);
  });

  it("keeps the signed-in copy unchanged", () => {
    assert.equal(
      bis.getNotifyMeSuccessMessage(true),
      "You’ll be notified when this item is back in stock!",
    );
  });

  it("shows neutral copy on RATE_LIMITED, never the server text", () => {
    const message = getErrorMessage(
      gqlError("BAD_USER_INPUT", "RATE_LIMITED", "Too many requests; internal"),
      "Failed to notify",
    );
    assert.equal(message, "We’ve had a lot of requests. Please try again later.");
  });
});

// ─── Confirmation link ────────────────────────────────────────────────────

describe("confirmation token", () => {
  it("reads a base64url token from a string or an array", () => {
    assert.equal(bis.readConfirmToken(TOKEN), TOKEN);
    assert.equal(bis.readConfirmToken([` ${TOKEN} `, "other"]), TOKEN);
  });

  it("drops anything that can't be a token", () => {
    for (const value of [undefined, null, "", "short", `${TOKEN}=`, "a b".repeat(10), "x".repeat(257), 42]) {
      assert.equal(bis.readConfirmToken(value), "", String(value));
    }
  });

  it("is served at the path the backend links to", () => {
    assert.equal(bis.BACK_IN_STOCK_CONFIRM_PATH, "/back-in-stock/confirm");
  });
});

// ─── confirmBackInStock ───────────────────────────────────────────────────

describe("confirm answer", () => {
  it("true confirms; false is an unknown, used or expired link", () => {
    assert.equal(bis.getConfirmStatusFromAnswer(true), StatusEnum.CONFIRMED);
    assert.equal(bis.getConfirmStatusFromAnswer(false), StatusEnum.INVALID_LINK);
    assert.equal(bis.getConfirmStatusFromAnswer(undefined), StatusEnum.INVALID_LINK);
  });

  it("branches on extensions.reason for a rate limit", () => {
    assert.equal(
      bis.getConfirmStatusFromError(gqlError("BAD_USER_INPUT", "RATE_LIMITED")),
      StatusEnum.RATE_LIMITED,
    );
    // The message alone never decides
    assert.equal(
      bis.getConfirmStatusFromError(gqlError("BAD_USER_INPUT", undefined, "RATE_LIMITED")),
      StatusEnum.INVALID_LINK,
    );
  });

  it("treats a gateway 429 as a rate limit and no answer as a network error", () => {
    const tooMany = new ServerError("Too Many Requests", {
      response: new Response("", { status: 429 }),
      bodyText: "",
    });
    assert.equal(bis.getConfirmStatusFromError(tooMany), StatusEnum.RATE_LIMITED);
    assert.equal(
      bis.getConfirmStatusFromError(new TypeError("Failed to fetch")),
      StatusEnum.NETWORK_ERROR,
    );
  });
});
