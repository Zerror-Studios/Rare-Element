/**
 * robots.txt (PRD-014 FR-2.8, UX-33)
 *
 * The sitemap URL comes from the configured site origin (`SITE_URL`,
 * `NEXT_PUBLIC_SITE_URL`) instead of a hard-coded domain, so every
 * deployment points crawlers at its own sitemap. Account, checkout and
 * search pages are private or thin, and back-in-stock links are single-use
 * (CP-22), so they are not crawled. A build with
 * no site origin (neither `NEXT_PUBLIC_SITE_URL` nor the tenant domain)
 * disallows everything (W2V-C-04).
 */

import { SITE_URL, SITE_URL_CONFIGURED } from "@/utils/env";

// ─── Constants ────────────────────────────────────────────────────────────

// `/back-in-stock/` holds single-use email links (CP-22): a crawler that
// runs scripts must not confirm someone's alert. `/pay/` links are a
// shopper's payment link (PRD-028 FR-5.4).
const DISALLOWED_PATHS = [
  "/account",
  "/checkout",
  "/search",
  "/back-in-stock/",
  "/pay/",
  // PRD-032 FR-R3/R5: a buyer's review link and the opt-out link
  "/review",
  "/api/",
];

// ─── Route ────────────────────────────────────────────────────────────────

export default function robots() {
  // No configured origin (W2V-C-04): keep crawlers off this build.
  if (!SITE_URL_CONFIGURED) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: DISALLOWED_PATHS }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
