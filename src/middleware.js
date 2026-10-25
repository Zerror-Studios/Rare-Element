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
 * `/account/*` and `/checkout/*` (except the result pages) need a customer
 * session. The HttpOnly refresh cookie is only a hint here: it's present
 * for a session that may still be revoked, and the real check happens
 * server-side on every customer operation. Without the cookie the shopper
 * goes to `/login?next=…`.
 *
 * Cookie names (PRD-001 FR-2.1): `__Host-zc_cust_rt` over HTTPS,
 * `zc_cust_rt` in local dev, and the legacy `refresh_token` during the
 * backend's migration window.
 */

import { NextResponse } from "next/server";
import { buildGatewayProxyHeaders } from "@/lib/edge-headers";
import { GRAPHQL_PATH, getServerTenantDomain } from "@/utils/env";

// ─── Constants ────────────────────────────────────────────────────────────

const SESSION_COOKIE_NAMES = [
  "__Host-zc_cust_rt",
  "zc_cust_rt",
  "refresh_token",
];
const PUBLIC_CHECKOUT_PATHS = [
  "/checkout/thank-you",
  "/checkout/payment-failed",
];

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

// ─── Middleware ───────────────────────────────────────────────────────────

export function middleware(request) {
  const { pathname, search } = request.nextUrl;
  if (pathname === GRAPHQL_PATH) return proxyGraphql(request);
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

export const config = {
  matcher: ["/v1/graphql", "/account/:path*", "/checkout/:path*"],
};
