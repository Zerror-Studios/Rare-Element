import { buildSecurityHeaders } from "@zcom/storefront-kit/core";

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

// The browser calls `/v1/graphql` same-origin; `src/proxy.js` proxies
// it to the gateway so the HttpOnly customer cookie is first-party.
if (isProduction && !API_GATEWAY_URL) {
  throw new Error(
    "API_GATEWAY_URL is required in production (the gateway origin, e.g. " +
      "https://api.example.com). See .env.example.",
  );
}

// ─── Security headers (PRD-002 SF-9, PRD-002 kit FR-1.17) ─────────────────

// The kit's policy covers the payment apps, GA4/GTM, the Meta and Google ad
// tags, the platform media CDN and the S3 upload hosts; this adds Nahara's
// own asset CDN. 'unsafe-inline' scripts stay (Next bootstrap and the tag
// base snippets; a nonce would end ISR, SF-9). Roll a change out with
// CSP_REPORT_ONLY=true first.
const ASSET_ORIGIN = "https://assets.nahara.co.in";

const absoluteApiOrigin = (() => {
  try {
    return /^https?:\/\//i.test(BROWSER_GRAPHQL_URL)
      ? new URL(BROWSER_GRAPHQL_URL).origin
      : "";
  } catch {
    return "";
  }
})();

const securityHeaders = buildSecurityHeaders({
  imageHosts: [ASSET_ORIGIN],
  extraConnectHosts: [ASSET_ORIGIN, absoluteApiOrigin].filter(Boolean),
  development: !isProduction,
  reportOnly: process.env.CSP_REPORT_ONLY === "true",
});

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
      // The platform media CDN every store's files are served from since
      // backend PRD-039 (2026-11-10; the UAT one too): without it the image
      // optimiser refuses product and lookbook images.
      { protocol: "https", hostname: "media.zerrorstudios.com" },
      { protocol: "https", hostname: "media-uat.zerrorstudios.com" },
    ],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  // Same-origin API (PRD-001 FR-1.4): `/v1/graphql` is proxied by
  // `src/proxy.js` (the kit's middleware), which also sets the gateway
  // edge headers (PRD-002 R2-C1); a config rewrite can't add request headers.
};

export default nextConfig;
