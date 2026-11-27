/**
 * Email consent copy (backend PRD-050 FR-3.8): the confirmation page, the
 * preference page, the account box and the sign-up form map every kit
 * state to Nahara's words; the box wording names the store and has a
 * version; robots keeps the token pages out of the crawl; the checkout box
 * starts unticked.
 *
 * Keep in sync with `storefronts/deveshe-dreams/test/email-consent.test.mjs`.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const consent = await import("@/utils/email-consent");
const { CheckoutSchema } = await import("@/validations/CheckoutValidation");

// ─── Paths and wording ────────────────────────────────────────────────────

describe("email consent wording", () => {
  it("uses the backend's paths", () => {
    assert.equal(consent.EMAIL_CONFIRM_PATH, "/email/confirm");
    assert.equal(consent.EMAIL_PREFERENCES_PATH, "/email/preferences");
  });

  it("names the store, says a confirmation follows and has a version", () => {
    assert.match(consent.EMAIL_CONSENT_LABEL, /Nahara/);
    assert.match(consent.EMAIL_CONFIRMATION_HINT, /confirm/);
    assert.match(consent.EMAIL_NOTICE_VERSION, /^[\w.-]{1,64}$/);
  });
});

// ─── Pages ────────────────────────────────────────────────────────────────

describe("confirmation page copy", () => {
  const states = [
    "working",
    "confirmed",
    "already_confirmed",
    "expired",
    "invalid",
    "rate_limited",
    "network_error",
  ];

  it("has a distinct heading for every state", () => {
    const titles = states.map((state) => consent.getConfirmPageCopy(state).title);
    assert.equal(new Set(titles).size, states.length);
    for (const state of states) {
      assert.ok(consent.getConfirmPageCopy(state).body.length > 0, state);
    }
  });

  it("offers a retry only for temporary failures", () => {
    const retry = states.filter((state) => consent.getConfirmPageCopy(state).canRetry);
    assert.deepEqual(retry, ["rate_limited", "network_error"]);
  });

  it("tells an expired link to sign up again", () => {
    assert.match(consent.getConfirmPageCopy("expired").body, /7 days/);
  });
});

describe("preference page copy", () => {
  it("covers loading, invalid and temporary failures", () => {
    assert.match(consent.getPreferencesPageCopy("loading").title, /Loading/);
    assert.equal(consent.getPreferencesPageCopy("invalid").canRetry, false);
    assert.equal(consent.getPreferencesPageCopy("rate_limited").canRetry, true);
    assert.equal(consent.getPreferencesPageCopy("network_error").canRetry, true);
    assert.equal(consent.getPreferencesPageCopy("error").canRetry, true);
  });

  it("describes each subscription and the saved result", () => {
    assert.equal(consent.getSubscriptionCopy("subscribed").label, "Subscribed");
    assert.match(consent.getSubscriptionCopy("pending").label, /confirmation/);
    assert.match(consent.getSubscriptionCopy("unsubscribed").description, /Order emails/);
    assert.match(consent.getSavedMessage("pending"), /inbox/);
    assert.match(consent.getSavedMessage("subscribed"), /subscribed/);
    assert.match(consent.getSavedMessage("unsubscribed"), /won't/);
  });
});

// ─── Sign-up and errors ───────────────────────────────────────────────────

describe("sign-up messages", () => {
  it("says check your inbox after a sign-up", () => {
    const message = consent.getSignupMessage("pending");
    assert.equal(message.isError, false);
    assert.match(message.text, /inbox/);
  });

  it("maps errors and waits", () => {
    assert.equal(consent.getSignupMessage("idle").text, "");
    assert.equal(consent.getSignupMessage("invalid_email").isError, true);
    assert.match(consent.getSignupMessage("rate_limited", 90_000).text, /in 2 minutes/);
    assert.match(consent.getSignupMessage("rate_limited").text, /later/);
    assert.equal(consent.getSignupMessage("error").isError, true);
  });

  it("formats retry times", () => {
    assert.equal(consent.formatRetryAfter(1), "in a minute");
    assert.equal(consent.formatRetryAfter(60_000), "in a minute");
    assert.equal(consent.formatRetryAfter(61_000), "in 2 minutes");
    assert.equal(consent.formatRetryAfter(null), "later");
    assert.equal(consent.formatRetryAfter(-5), "later");
  });

  it("has a message for every consent error kind", () => {
    for (const kind of ["rate_limited", "no_email", "signed_out", "invalid", "network_error", "error"]) {
      assert.ok(consent.getConsentErrorMessage(kind).length > 0, kind);
    }
    assert.match(consent.getConsentErrorMessage("rate_limited", 120_000), /in 2 minutes/);
  });
});

describe("store sign-up form messages", () => {
  it("shows the form's own success message, else the default", () => {
    assert.deepEqual(consent.getSignupFormMessage("pending", null, "Check your inbox to confirm."), {
      text: "Check your inbox to confirm.",
      isError: false,
    });
    assert.match(consent.getSignupFormMessage("pending").text, /inbox/);
  });

  it("maps the form's own states and falls back to the newsletter's", () => {
    for (const state of ["invalid_name", "name_required", "unavailable", "invalid_email", "error"]) {
      const message = consent.getSignupFormMessage(state);
      assert.equal(message.isError, true, state);
      assert.ok(message.text.length > 0, state);
    }
    assert.match(consent.getSignupFormMessage("rate_limited", 90_000).text, /in 2 minutes/);
    assert.equal(consent.getSignupFormMessage("idle").text, "");
  });
});

// ─── Crawl and checkout ───────────────────────────────────────────────────

describe("token pages and the checkout box", () => {
  it("keeps /email/ out of the crawl", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://nahara.example";
    const { default: robots } = await import("../src/app/robots.js?case=email-consent");
    const [rule] = robots().rules;
    assert.ok(rule.disallow.includes("/email/"));
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("starts the checkout news box unticked", () => {
    const field = CheckoutSchema.shape.emailSubscribedStatus;
    assert.equal(field.parse(undefined), "UNSUBSCRIBED");
  });
});
