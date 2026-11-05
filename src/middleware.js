/**
 * Middleware: API proxy + route protection hint
 *
 * API proxy (PRD-002 R2-C1): same-origin `/v1/graphql` is rewritten to
 * `${API_GATEWAY_URL}/v1/graphql` here (not in next.config, which can't set
 * request headers), with the edge headers from `lib/edge-headers.js`:
 * client `x-zcom-*`, `x-tenant-domain` and `x-forwarded-host` headers
 * stripped, then `x-zcom-client-ip`, `x-tenant-domain` and the optional
 * `x-zcom-edge-secret` added. The tenant domain comes from
 * `getServerTenantDomain()`: in production a missing
 * NEXT_PUBLIC_TENANT_DOMAIN fails closed with a 500 (VSEC-4) instead of
 * forwarding the request without a tenant.
 *
 * Route protection (PRD-002 SF-16, PRD-001 phase 2):
 * `/account/*` and `/checkout/*` (except the result pages and `/checkout/start`) need a customer
 * session. The HttpOnly refresh cookie is only a hint here: it's present
 * for a session that may still be revoked, and the real check happens
 * server-side on every customer operation. Without the cookie the shopper
 * goes to `/login?next=…`.
 *
 * Cookie names (PRD-001 FR-2.1): `__Host-zc_cust_rt` over HTTPS,
 * `zc_cust_rt` in local dev, and the legacy `refresh_token` during the
 * backend's migration window.
 *
 * Suspended store (PRD-018 FR-1.6, D6): every page request first asks
 * `lib/store-status.js` (one cached gateway probe per 30 s); while the
 * gateway answers `TENANT_SUSPENDED` the page is the branded 503 with
 * `Retry-After`. `/v1/graphql`, `/api/*` and static files are never held.
 *
 * Store identity (PRD-018 FR-4.3): `/.well-known/zcom-store?nonce=…`
 * answers the store slug and the caller's nonce, signed together (CP-18,
 * `lib/store-identity.js`).
 */

import { NextResponse } from "next/server";
import {
  buildGatewayProxyHeaders,
  getEdgeSecretHeaders,
} from "@/lib/edge-headers";
import {
  STORE_IDENTITY_PATH,
  storeIdentityResponse,
} from "@/lib/store-identity";
import {
  createStoreStatusCache,
  probeStoreStatus,
  storeStatusEnum,
  storeUnavailableResponse,
} from "@/lib/store-status";
import {
  API_VERSION,
  GRAPHQL_PATH,
  SUPPORT_EMAIL,
  getServerTenantDomain,
} from "@/utils/env";

// ─── Constants ────────────────────────────────────────────────────────────

const SESSION_COOKIE_NAMES = [
  "__Host-zc_cust_rt",
  "zc_cust_rt",
  "refresh_token",
];
// PRD-028 FR-10.1: a guest paying a store's payment link (`/pay/<token>`)
// comes back from a redirect payment app through payment-return.
// PRD-034 FR-1.9: the checkout URL fills a guest's bag first, then sends
// the guest to login (which merges it).
const PUBLIC_CHECKOUT_PATHS = [
  "/checkout/thank-you",
  "/checkout/payment-failed",
  "/checkout/payment-return",
  "/checkout/start",
];
const PROTECTED_PATH_PATTERN = /^\/(account|checkout)(\/|$)/;
const BRAND = {
  brandName: "Nahara",
  background: "#ffffff",
  foreground: "#111111",
};

// ─── API proxy ────────────────────────────────────────────────────────────

function proxyGraphql(request) {
  const gateway = (process.env.API_GATEWAY_URL || "").replace(/\/+$/, "");
  if (!gateway) {
    return NextResponse.json(
      { errors: [{ message: "API gateway is not configured" }] },
      { status: 503 },
    );
  }
  let tenantDomain;
  try {
    tenantDomain = getServerTenantDomain();
  } catch {
    // Production without NEXT_PUBLIC_TENANT_DOMAIN: never proxy untenanted.
    return NextResponse.json(
      { errors: [{ message: "The store is not available right now." }] },
      { status: 500 },
    );
  }
  const target = new URL(`${gateway}${GRAPHQL_PATH}${request.nextUrl.search}`);
  return NextResponse.rewrite(target, {
    request: { headers: buildGatewayProxyHeaders(request, tenantDomain) },
  });
}

// ─── Store status ─────────────────────────────────────────────────────────

/** The gateway probe with the edge headers; UNKNOWN when unconfigured. */
async function probeGateway() {
  const gateway = (process.env.API_GATEWAY_URL || "").replace(/\/+$/, "");
  if (!gateway) return storeStatusEnum.UNKNOWN;
  let tenantDomain;
  try {
    tenantDomain = getServerTenantDomain();
  } catch {
    return storeStatusEnum.UNKNOWN;
  }
  return await probeStoreStatus({
    graphqlUrl: `${gateway}${GRAPHQL_PATH}`,
    headers: {
      "x-api-version": API_VERSION,
      "x-tenant-domain": tenantDomain,
      ...getEdgeSecretHeaders(),
    },
  });
}

const getStoreStatus = createStoreStatusCache({ probe: probeGateway });

/** Page navigations only (GET/HEAD); never the API or the proxy. */
function isPageRequest(request) {
  return request.method === "GET" || request.method === "HEAD";
}

// ─── Route guard ──────────────────────────────────────────────────────────

function guardRoute(request) {
  const { pathname, search } = request.nextUrl;
  if (!PROTECTED_PATH_PATTERN.test(pathname)) return NextResponse.next();
  if (PUBLIC_CHECKOUT_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const hasSession = SESSION_COOKIE_NAMES.some(
    (name) => !!request.cookies.get(name)?.value,
  );
  if (hasSession) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
  return NextResponse.redirect(url);
}

// ─── Middleware ───────────────────────────────────────────────────────────

async function servePage(request) {
  if (
    isPageRequest(request) &&
    (await getStoreStatus()) === storeStatusEnum.SUSPENDED
  ) {
    return storeUnavailableResponse({ ...BRAND, contactEmail: SUPPORT_EMAIL });
  }
  return guardRoute(request);
}

// The proxy stays synchronous; only page requests wait for the probe.
export function middleware(request) {
  const { pathname } = request.nextUrl;
  if (pathname === GRAPHQL_PATH) return proxyGraphql(request);
  if (pathname === STORE_IDENTITY_PATH) return storeIdentityResponse(request);
  return servePage(request);
}

export const config = {
  // Every page (no `_next/`, `api/` or file with an extension), the proxy
  // and the store identity endpoint.
  matcher: [
    "/v1/graphql",
    "/.well-known/zcom-store",
    "/((?!_next/|api/|.*\\.).*)",
  ],
};
