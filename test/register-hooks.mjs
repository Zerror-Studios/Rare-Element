/**
 * Test harness: loads `src/middleware.js` in plain Node (PRD-014 FR-1.7, QA-12)
 *
 * No test framework and no new dependency: `node --test` with module
 * hooks (Node >= 22.15) that
 * - resolve the `@/…` alias and extensionless imports under `src/`, and
 *   load those files as ES modules (the package has no `"type"`);
 * - map `next/server` to a shim that re-exports Next's real
 *   `NextRequest` / `NextResponse` (CommonJS in the installed `next`);
 * - pass a test's `?case=…` query on to every `src/` import, so each case
 *   gets fresh modules that read `process.env` again.
 *
 * Usage: `node --import ./test/register-hooks.mjs --test "test/*.test.mjs"`
 *
 * Keep in sync with `storefronts/deveshe-dreams/test/register-hooks.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

// ─── Constants ────────────────────────────────────────────────────────────

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = path.join(ROOT, "src");
const SRC_URL = pathToFileURL(SRC).href;
const NEXT_SERVER_SHIM = new URL("./next-server.shim.mjs", import.meta.url).href;
const CANDIDATE_SUFFIXES = ["", ".js", ".mjs", "/index.js"];

// ─── Helpers ──────────────────────────────────────────────────────────────

function findFile(base) {
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = `${base}${suffix}`;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function queryOf(parentURL) {
  if (!parentURL) return "";
  return new URL(parentURL).search;
}

// ─── Hooks ────────────────────────────────────────────────────────────────

registerHooks({
  resolve(specifier, context, nextResolve) {
    const fromSrc = context.parentURL?.startsWith(SRC_URL);
    // Only for the app's own imports: the shim itself requires the real one
    if (fromSrc && specifier === "next/server") {
      return { url: NEXT_SERVER_SHIM, format: "module", shortCircuit: true };
    }
    let target = null;
    if (specifier.startsWith("@/")) {
      target = findFile(path.join(SRC, specifier.slice(2)));
    } else if (fromSrc && /^\.\.?\//.test(specifier)) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      target = findFile(path.resolve(parentDir, specifier));
    }
    if (target) {
      return {
        url: `${pathToFileURL(target).href}${queryOf(context.parentURL)}`,
        format: "module",
        shortCircuit: true,
      };
    }
    const resolved = nextResolve(specifier, context);
    if (resolved.url.startsWith(SRC_URL)) {
      return { ...resolved, format: "module" };
    }
    return resolved;
  },
});
