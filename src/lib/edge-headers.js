/**
 * Gateway edge headers (PRD-002 ROPS-1, contract R2-C1) — SERVER ONLY
 *
 * Import this module only from `middleware.js` and server code (the RSC
 * Apollo client): it reads the server-only `EDGE_SHARED_SECRET`, which
 * must never reach the browser bundle.
 *
 * The gateway trusts `x-tenant-domain` and `x-zcom-client-ip` only when
 * the request also carries a valid `x-zcom-edge-secret`. The `/v1/graphql`
 * proxy therefore:
 * - strips every client-sent `x-zcom-*`, `x-tenant-domain` and
 *   `x-forwarded-host` header (VSEC-4);
 * - adds `x-zcom-client-ip` (see `getClientIp`), `x-tenant-domain` (the
 *   configured brand domain; the middleware fails closed without it) and,
 *   when configured, `x-zcom-edge-secret`.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/lib/edge-headers.server.js`.
 */

// ─── Constants ────────────────────────────────────────────────────────────

export const EDGE_SECRET_HEADER = "x-zcom-edge-secret";
export const CLIENT_IP_HEADER = "x-zcom-client-ip";
export const TENANT_DOMAIN_HEADER = "x-tenant-domain";
const RESERVED_HEADER_PREFIX = "x-zcom-";
// Tenant-selecting headers a client must never choose (VSEC-4).
const CLIENT_TENANT_HEADERS = [TENANT_DOMAIN_HEADER, "x-forwarded-host"];

/**
 * PRD-007 FR-8.2: the proxy is the API's caller, not the shopper's browser,
 * so the browser's Origin and Referer are not forwarded. The gateway never
 * needs this storefront in CORS_ORIGINS.
 */
const BROWSER_ONLY_HEADERS = ["origin", "referer"];

// ─── Helpers ──────────────────────────────────────────────────────────────

/** `{ x-zcom-edge-secret }` when EDGE_SHARED_SECRET is set, else `{}`. */
export function getEdgeSecretHeaders() {
  const secret = process.env.EDGE_SHARED_SECRET;
  return secret ? { [EDGE_SECRET_HEADER]: secret } : {};
}

/**
 * The shopper's IP from the hosting platform's trusted source, or ""
 * (VSEC-3). The gateway rate-limits on this value, so it must not be one
 * the client can choose:
 * 1. on Vercel (`VERCEL` is set), `x-vercel-forwarded-for`: Vercel sets it
 *    at its edge and overwrites any client copy. Elsewhere a client could
 *    send it, so it is ignored;
 * 2. `request.ip`, where the runtime still provides it (removed from
 *    NextRequest in Next 15, kept for other hosts and adapters);
 * 3. the right-most `x-forwarded-for` hop: a client can prepend any value
 *    to that header, but the last hop is the one our own edge appended for
 *    the peer it saw. The first hop is client-controlled and never used.
 * `x-real-ip` is not trusted: without a proxy that overwrites it, the
 * client sets it.
 */
export function getClientIp(request) {
  if (process.env.VERCEL) {
    const vercelIp = (request.headers.get("x-vercel-forwarded-for") || "")
      .split(",")[0]
      .trim();
    if (vercelIp) return vercelIp;
  }
  if (request.ip) return request.ip;
  const hops = (request.headers.get("x-forwarded-for") || "")
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);
  return hops[hops.length - 1] || "";
}

/** Request headers for the proxied `/v1/graphql` call. */
export function buildGatewayProxyHeaders(request, tenantDomain) {
  const headers = new Headers(request.headers);
  [...headers.keys()]
    .filter((name) => name.toLowerCase().startsWith(RESERVED_HEADER_PREFIX))
    .forEach((name) => headers.delete(name));
  CLIENT_TENANT_HEADERS.forEach((name) => headers.delete(name));
  BROWSER_ONLY_HEADERS.forEach((name) => headers.delete(name));

  const clientIp = getClientIp(request);
  if (clientIp) headers.set(CLIENT_IP_HEADER, clientIp);
  if (tenantDomain) headers.set(TENANT_DOMAIN_HEADER, tenantDomain);
  Object.entries(getEdgeSecretHeaders()).forEach(([name, value]) =>
    headers.set(name, value),
  );
  return headers;
}
