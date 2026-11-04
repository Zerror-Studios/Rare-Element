// ─── Environment (PRD-002 SF-5, PRD-001 FR-1.4) ───────────────────────────

const isProduction = process.env.NODE_ENV === "production";
const API_GATEWAY_URL = (process.env.API_GATEWAY_URL || "").replace(/\/+$/, "");
const BROWSER_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_API_URL || "/v1/graphql";

// Server-side (RSC/ISR) requests must name the tenant; without it the
// gateway would resolve `localhost` and cache the wrong catalog.
if (isProduction && !process.env.NEXT_PUBLIC_TENANT_DOMAIN) {
  throw new Error(
    "NEXT_PUBLIC_TENANT_DOMAIN is required in production (the brand " +
      "domain, e.g. nahara.co.in). See .env.example.",
  );
}

// The browser calls `/v1/graphql` same-origin; `src/middleware.js` proxies
// it to the gateway so the HttpOnly customer cookie is first-party.
if (isProduction && !API_GATEWAY_URL) {
  throw new Error(
    "API_GATEWAY_URL is required in production (the gateway origin, e.g. " +
      "https://api.example.com). See .env.example.",
  );
}

// ─── Security headers (PRD-002 SF-9) ─────────────────────────────────────

const ASSET_ORIGIN = "https://assets.nahara.co.in";
const GOOGLE_ORIGINS =
  "https://www.googletagmanager.com https://www.google-analytics.com " +
  "https://*.google-analytics.com https://*.analytics.google.com " +
  "https://www.google.com https://*.doubleclick.net";
const META_ORIGINS = "https://connect.facebook.net https://www.facebook.com";
// Nimbbl Sonic: checkout UI/API, event log, device fingerprint, IP lookup.
const NIMBBL_ORIGINS = "https://*.nimbbl.tech";
const NIMBBL_SUPPORT_ORIGINS =
  "https://*.openfpcdn.io https://checkip.amazonaws.com";
// PRD-011 FR-4.2: every payment app's checkout hosts, in one place.
// Razorpay Checkout.js (script, iframe, API, event log), Cashfree JS SDK
// (script, modal, API; sandbox and live), PayU hosted page (form post).
const PAYMENT_SCRIPT_ORIGINS =
  "https://checkout.razorpay.com https://sdk.cashfree.com";
const PAYMENT_FRAME_ORIGINS =
  "https://api.razorpay.com https://checkout.razorpay.com " +
  "https://*.cashfree.com";
const PAYMENT_CONNECT_ORIGINS =
  "https://api.razorpay.com https://lumberjack.razorpay.com " +
  "https://*.cashfree.com";
const PAYMENT_IMG_ORIGINS = "https://*.razorpay.com https://*.cashfree.com";
// PRD-032 FR-P1: shopper review photos are POSTed straight to the store's
// S3 bucket (presigned, capped) and shown from it when the store has no
// CDN. The bucket name isn't known here, so every S3 virtual host is
// allowed for upload and display only. The bucket also needs a CORS rule
// allowing POST from this site's origin (owner step, PRD-032 pointer).
const REVIEW_PHOTO_ORIGINS = "https://*.amazonaws.com";
const PAYMENT_FORM_ORIGINS =
  "https://test.payu.in https://secure.payu.in https://api.razorpay.com " +
  "https://*.cashfree.com";

const absoluteApiOrigin = (() => {
  try {
    return /^https?:\/\//i.test(BROWSER_GRAPHQL_URL)
      ? new URL(BROWSER_GRAPHQL_URL).origin
      : "";
  } catch {
    return "";
  }
})();

const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-inline': Next.js bootstrap and the GTM/GA/Pixel base snippets.
  // A per-request nonce (PRD-002 SF-9) was not adopted: it forces dynamic
  // rendering, which would end ISR on the catalog pages, and GTM custom-HTML
  // tags need 'unsafe-inline' or per-tag nonce propagation. Roll out with
  // CSP_REPORT_ONLY=true first.
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"} ${GOOGLE_ORIGINS} ${META_ORIGINS} ${NIMBBL_ORIGINS} https://*.openfpcdn.io ${PAYMENT_SCRIPT_ORIGINS}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${ASSET_ORIGIN} ${REVIEW_PHOTO_ORIGINS} ${GOOGLE_ORIGINS} ${META_ORIGINS} ${NIMBBL_ORIGINS} ${PAYMENT_IMG_ORIGINS}`,
  "font-src 'self' data:",
  `media-src 'self' blob: ${ASSET_ORIGIN}`,
  `connect-src 'self' ${absoluteApiOrigin} ${ASSET_ORIGIN} ${REVIEW_PHOTO_ORIGINS} ${GOOGLE_ORIGINS} ${META_ORIGINS} ${NIMBBL_ORIGINS} ${NIMBBL_SUPPORT_ORIGINS} ${PAYMENT_CONNECT_ORIGINS}`,
  `frame-src ${NIMBBL_ORIGINS} ${PAYMENT_FRAME_ORIGINS} https://www.googletagmanager.com`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  `form-action 'self' ${NIMBBL_ORIGINS} ${PAYMENT_FORM_ORIGINS}`,
  "frame-ancestors 'none'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
]
  .join("; ")
  .replace(/\s{2,}/g, " ");

// CSP_REPORT_ONLY=true ships the policy as report-only (rollout switch).
const cspHeaderName =
  process.env.CSP_REPORT_ONLY === "true"
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";

const securityHeaders = [
  { key: cspHeaderName, value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  ...(isProduction
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year - images are immutable
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [25, 50, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.nahara.co.in",
      },
    ],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  // Same-origin API (PRD-001 FR-1.4): `/v1/graphql` is proxied by
  // `src/middleware.js`, which also sets the gateway edge headers
  // (PRD-002 R2-C1); a config rewrite can't add request headers.
};

export default nextConfig;
