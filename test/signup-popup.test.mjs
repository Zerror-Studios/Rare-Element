/**
 * Sign-up pop-up helpers (backend PRD-050 D22)
 *
 * Nahara's routes → the kit's page types (PRODUCT and COLLECTION targeting,
 * no pop-up on checkout, account and order pages), the extra blocked
 * routes, the merchant's style tokens the pop-up takes, the button text,
 * and that the layout renders the pop-up and the footer reads every form
 * kind. Kit-version free: nothing here imports the kit.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const popup = await import("@/utils/signup-popup");

// ─── Page types ───────────────────────────────────────────────────────────

describe("page types", () => {
  it("maps Nahara's routes", () => {
    const cases = {
      "/": "HOME",
      "/?utm_source=x": "HOME",
      "/products/gold-ring": "PRODUCT",
      "/products/gold-ring/": "PRODUCT",
      "/products": "OTHER",
      "/rings": "COLLECTION",
      "/rings/solitaire": "COLLECTION",
      "/checkout": "CHECKOUT",
      "/checkout/payment-return": "CHECKOUT",
      "/account/settings": "ACCOUNT",
      "/orders/status/abc": "ORDER",
      "/pay/abc": "ORDER",
      "/search": "OTHER",
      "/lookbook/summer": "OTHER",
      "/contact": "OTHER",
      "": "HOME",
    };
    for (const [path, type] of Object.entries(cases)) {
      assert.equal(popup.getSignupPageType(path), type, path);
    }
  });

  it("keeps the pop-up off the sign-in and token pages", () => {
    for (const path of ["/login", "/forgot-password", "/reset-password", "/review", "/back-in-stock"]) {
      assert.ok(popup.SIGNUP_POPUP_BLOCKED_PATHS.includes(path), path);
    }
  });
});

// ─── Style and copy ───────────────────────────────────────────────────────

describe("style tokens and copy", () => {
  it("takes the merchant's colours, radius and alignment only", () => {
    assert.deepEqual(
      popup.getSignupPopupStyle({
        "--zc-signup-bg": "#FFFFFF",
        "--zc-signup-text": "#111111",
        "--zc-signup-button-bg": "#000000",
        "--zc-signup-button-text": "#FFFFFF",
        "--zc-signup-radius": "8px",
        "--zc-signup-align": "center",
        "--zc-signup-font": "Comic Sans",
        color: "red",
      }),
      {
        "--zc-signup-bg": "#FFFFFF",
        "--zc-signup-text": "#111111",
        "--zc-signup-button-bg": "#000000",
        "--zc-signup-button-text": "#FFFFFF",
        "--zc-signup-radius": "8px",
        "--zc-signup-align": "center",
      },
    );
    assert.deepEqual(popup.getSignupPopupStyle(null), {});
    assert.deepEqual(popup.getSignupPopupStyle({ "--zc-signup-bg": "" }), {});
  });

  it("says when it is sending", () => {
    assert.equal(popup.getSignupPopupButtonText("sending", "Join"), "Signing up…");
    assert.equal(popup.getSignupPopupButtonText("idle", "Join"), "Join");
    assert.equal(popup.getSignupPopupButtonText("idle", ""), "Sign up");
  });
});

// ─── Wiring ───────────────────────────────────────────────────────────────

describe("wiring", () => {
  it("renders the pop-up from the layout and reads every form kind in the footer", () => {
    const layout = readFileSync("src/components/layouts/Layout.jsx", "utf8");
    assert.match(layout, /<SignupPopup \/>/);
    const footer = readFileSync("src/components/common/NewsletterForm.jsx", "utf8");
    assert.match(footer, /useStorefrontSignupForms\(null\)/);
    assert.match(footer, /pickFooterSignupForm\(forms\)/);
    assert.match(footer, /useSignupFormView\(/);
    const css = readFileSync("src/styles/allCssImport.css", "utf8");
    assert.match(css, /signupPopup\.css/);
  });
});
