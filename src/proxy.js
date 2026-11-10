/**
 * Proxy (Next 16; `middleware.js` before): the kit's `createZcomMiddleware`
 * (PRD-002 FR-4.1).
 *
 * - `/v1/graphql` → the gateway with the signed edge headers; client tenant
 *   headers stripped; fails closed without NEXT_PUBLIC_TENANT_DOMAIN.
 * - `/.well-known/zcom-store` → the go-live identity check (PRD-018 FR-4.3).
 * - A suspended store answers the branded 503 on every page (PRD-018 FR-1.6).
 * - `/account/*` and `/checkout/*` need a customer session cookie, except
 *   the result pages and `/checkout/start` (a guest's bag is filled first,
 *   then login merges it). The cookie is a hint; the API verifies.
 */

import {
  buildStoreUnavailableHtml,
  createZcomMiddleware,
} from "@zcom/storefront-kit/edge";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "contact@nahara.co.in";

const proxy = createZcomMiddleware({
  loginGuard: {
    paths: ["/account", "/checkout"],
    publicPaths: [
      "/checkout/thank-you",
      "/checkout/payment-failed",
      "/checkout/payment-return",
      "/checkout/start",
    ],
  },
  unavailableHtml: buildStoreUnavailableHtml({
    brandName: "Nahara",
    supportEmail: SUPPORT_EMAIL,
    background: "#ffffff",
    text: "#111111",
  }),
});

export default proxy;

export const config = {
  // Every page (no `_next/`, `api/` or file with an extension), the proxy
  // and the store identity endpoint.
  matcher: [
    "/v1/graphql",
    "/.well-known/zcom-store",
    "/((?!_next/|api/|.*\\.).*)",
  ],
};
