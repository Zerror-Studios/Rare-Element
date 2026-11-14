/**
 * Kit PRD-003 FR-5/FR-6: this store's GraphQL documents come from the kit.
 *
 * A document in `src/graphql` may not duplicate a kit operation (re-export
 * the kit's document instead), and the store's own documents are only the
 * ones listed here, each with the reason it stays (at most 5).
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

// ─── The store's own documents (FR-5) ───────────────────────────────────────

const STORE_DOCUMENTS = [
  // the category page and the home featured sections: the category with its first page of product cards (`products(limit, offset)`), which the kit's GetCategory doesn't select
  "GetClientSideCategory",
  // one page of product URLs for this store's own sitemap route
  "GetSitemapProducts",
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const listFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)],
  );

const storeOperations = () =>
  listFiles("src/graphql").flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(/\b(?:query|mutation)\s+([A-Za-z]\w*)/g)].map((m) => m[1]),
  );

const kitOperations = () =>
  new Set(
    [
      ...readFileSync("node_modules/@zcom/storefront-kit/dist/graphql/generated.d.ts", "utf8").matchAll(
        /export declare const (\w+)Document\b/g,
      ),
    ].map((m) => m[1]),
  );

// ─── Tests ──────────────────────────────────────────────────────────────────

test("no store document duplicates a kit operation", () => {
  const kit = kitOperations();
  const duplicates = storeOperations().filter((name) => kit.has(name));
  assert.deepEqual(duplicates, [], "re-export the kit's document instead");
});

test("the store's own documents are the listed ones (at most 5)", () => {
  assert.ok(STORE_DOCUMENTS.length <= 5, "more than 5 needs the owner's yes (PRD-003 FR-5)");
  assert.deepEqual([...storeOperations()].sort(), [...STORE_DOCUMENTS].sort());
});
