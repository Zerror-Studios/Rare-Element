/**
 * Storefront environment (PRD-002 SF-4 / SF-5 / SF-22)
 *
 * One place for every env-driven value. `NEXT_PUBLIC_*` values are inlined
 * into the browser bundle at build time; `API_GATEWAY_URL` is server-only
 * (the `middleware.js` proxy and the server Apollo clients).
 *
 * - The browser calls the API **same-origin** at `/v1/graphql`;
 *   `middleware.js` proxies it to `${API_GATEWAY_URL}/v1/graphql` (R2-C1),
 *   so the HttpOnly customer refresh cookie is first-party (PRD-001 FR-1.4).
 *   The proxy fails closed in production without NEXT_PUBLIC_TENANT_DOMAIN
 *   (VSEC-4).
 * - Server-side requests use the absolute gateway URL and must name the
 *   tenant: `NEXT_PUBLIC_TENANT_DOMAIN` is required in production.
 */

// ─── Constants ────────────────────────────────────────────────────────────

const DEV_SITE_URL = "http://localhost:3000";
const DEV_TENANT_FALLBACK = "localhost:3000";

export const GRAPHQL_PATH = "/v1/graphql";
export const API_VERSION = "v1";

export const TENANT_DOMAIN = process.env.NEXT_PUBLIC_TENANT_DOMAIN || "";

// W2V-C-04: the origin comes from `NEXT_PUBLIC_SITE_URL`, else the tenant
// domain; never from a hard-coded brand domain, so a UAT build without env
// can't point canonical, sitemap and robots URLs at production.
const CONFIGURED_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (TENANT_DOMAIN ? `https://${TENANT_DOMAIN}` : "")
).replace(/\/+$/, "");

/** False when neither env value is set: pages are then `noindex`. */
export const SITE_URL_CONFIGURED = Boolean(CONFIGURED_SITE_URL);

/** Canonical origin for metadata, canonical URLs and JSON-LD. */
export const SITE_URL = CONFIGURED_SITE_URL || DEV_SITE_URL;

if (!SITE_URL_CONFIGURED && typeof window === "undefined") {
  process.emitWarning(
    "NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_TENANT_DOMAIN are unset: SEO " +
      `URLs use ${DEV_SITE_URL} and every page is noindex.`,
    { code: "ZCOM_SITE_URL_UNSET" },
  );
}

/** Browser endpoint: same-origin by default (see the module header). */
export const BROWSER_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_API_URL || GRAPHQL_PATH;

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "contact@nahara.co.in";

// PRD-014 FR-1.9 (FE-24): no hard-coded fallback ids. An unset id loads
// no tag, so a build without env never reports into another property.
// PRD-034 FR-1.2: the GA4 and Pixel ids are now only the fallback for a
// store whose backend `storefrontTrackingConfig` has none
// (`utils/tracking-config.js`); GTM stays env-only.
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "";
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "";

/** Env tag ids: the fallback in `utils/tracking-config.js`. */
export const TAG_IDS = Object.freeze({
  gaId: GA_MEASUREMENT_ID,
  gtmId: GTM_ID,
  pixelId: FB_PIXEL_ID,
});

// ─── Server-side helpers ──────────────────────────────────────────────────

const isProduction = () => process.env.NODE_ENV === "production";

/** Absolute GraphQL URL for server components (RSC/SSR/ISR). */
export function getServerGraphqlUrl() {
  const gateway = process.env.API_GATEWAY_URL;
  if (gateway) return `${gateway.replace(/\/+$/, "")}${GRAPHQL_PATH}`;
  if (/^https?:\/\//i.test(BROWSER_GRAPHQL_URL)) return BROWSER_GRAPHQL_URL;
  throw new Error(
    "API_GATEWAY_URL is not set: server-side GraphQL requests need the " +
      "absolute gateway origin (e.g. https://api.example.com).",
  );
}

/** Tenant host sent on server-side requests (SF-5). */
export function getServerTenantDomain() {
  if (TENANT_DOMAIN) return TENANT_DOMAIN;
  if (isProduction()) {
    throw new Error(
      "NEXT_PUBLIC_TENANT_DOMAIN is not set: server-side requests cannot " +
        "select the tenant. Set it to the brand domain (e.g. nahara.co.in).",
    );
  }
  return DEV_TENANT_FALLBACK;
}

/** Tenant host sent from the browser (the brand domain or the page host). */
export function getBrowserTenantDomain() {
  if (TENANT_DOMAIN) return TENANT_DOMAIN;
  return typeof window !== "undefined" ? window.location.host : "";
}

/** A page's robots value, or `noindex` on a build with no site origin. */
export function indexableRobots(robots = "index, follow") {
  return SITE_URL_CONFIGURED ? robots : "noindex, nofollow";
}

/** Absolute canonical URL for a path such as `/products/ring`. */
export function toCanonicalUrl(path = "/") {
  const clean = `/${String(path || "").replace(/^\/+/, "")}`;
  return clean === "/" ? `${SITE_URL}/` : `${SITE_URL}${clean}`;
}
