/**
 * Test harness: Next's real `next/server` exports, as an ES module.
 *
 * The installed `next/server` is CommonJS with exports Node can't detect
 * statically, so `import { NextResponse } from "next/server"` in
 * `src/middleware.js` is pointed here by `register-hooks.mjs`.
 *
 * Keep in sync with `storefronts/deveshe-dreams/test/next-server.shim.mjs`.
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const server = require("next/server");

export const { NextRequest, NextResponse, userAgent } = server;
