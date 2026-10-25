/**
 * Server Apollo client (RSC / ISR) — PRD-002 SF-5
 *
 * One client per request (`registerApolloClient`), anonymous only: never
 * forward a shopper's cookies or token from here, because catalog pages are
 * cached. Calls the gateway at its absolute URL and names the tenant with
 * `x-tenant-domain` / `x-forwarded-host` from NEXT_PUBLIC_TENANT_DOMAIN
 * (required in production, see `utils/env.js`), plus the optional
 * `x-zcom-edge-secret` (PRD-002 R2-C1) so strict tenant mode trusts it.
 * There is no shopper IP here: cached pages are shared.
 */

import { HttpLink } from "@apollo/client";
import {
  InMemoryCache,
  ApolloClient,
  registerApolloClient,
} from "@apollo/client-integration-nextjs";
import {
  API_VERSION,
  getServerGraphqlUrl,
  getServerTenantDomain,
} from "@/utils/env";
import { getEdgeSecretHeaders } from "@/lib/edge-headers";

export const { getClient } = registerApolloClient(() => {
  const tenant = getServerTenantDomain();
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: getServerGraphqlUrl(),
      headers: {
        "x-api-version": API_VERSION,
        "x-tenant-domain": tenant,
        "x-forwarded-host": tenant,
        ...getEdgeSecretHeaders(),
      },
    }),
  });
});
