/**
 * Backend PRD-050 FR-4.4, FR-5.5 on kit 2.1.0: the product page records
 * views for browse abandonment through the kit, every tag goes through the
 * kit (which never loads one while the address carries a token), and every
 * page with a token in its query strips it on mount, so the kit's tags can
 * follow.
 *
 * Keep in sync with `storefronts/deveshe-dreams/test/analytics-privacy.test.mjs`.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Constants ──────────────────────────────────────────────────────────────

const PRODUCT_PAGE = "src/app/products/[slug]/product-client.jsx";

/** Pages that read a token (or an email) from the query. */
const TOKEN_QUERY_PAGES = [
    "src/app/email/confirm/confirm-client.jsx",
    "src/app/email/preferences/preferences-client.jsx",
    "src/app/unsubscribe/unsubscribe-client.jsx",
    "src/app/review/review-link-client.jsx",
    "src/app/review/unsubscribe/unsubscribe-client.jsx",
    "src/app/back-in-stock/confirm/confirm-client.jsx",
    "src/app/reset-password/reset-password-client.jsx",
];

const KIT_TOKEN_HOOKS = /\b(useEmailConfirmPage|useEmailPreferencesPage|takeQueryParams)\b/;
const TAG_SCRIPTS = /googletagmanager\.com\/(gtag\/js|gtm\.js)|connect\.facebook\.net|fbevents\.js/;

// ─── Helpers ────────────────────────────────────────────────────────────────

const listFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)],
  );

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("analytics privacy and browse data", () => {
  it("records product views through the kit", () => {
    const source = readFileSync(PRODUCT_PAGE, "utf8");
    assert.match(source, /import \{ useRecordProductView \} from "@zcom\/storefront-kit\/client"/);
    assert.match(source, /useRecordProductView\(data\?\._id\)/);
  });

  it("loads no tag script itself (the kit's ZcomTags does)", () => {
    const offenders = listFiles("src")
      .filter((file) => /\.(jsx?|mjs)$/.test(file))
      .filter((file) => TAG_SCRIPTS.test(readFileSync(file, "utf8")));
    assert.deepEqual(offenders, []);
  });

  it("strips the token from every token page's address", () => {
    for (const file of TOKEN_QUERY_PAGES) {
      const source = readFileSync(file, "utf8");
      assert.ok(
        /history\.replaceState\(/.test(source) || KIT_TOKEN_HOOKS.test(source),
        file,
      );
    }
  });
});
