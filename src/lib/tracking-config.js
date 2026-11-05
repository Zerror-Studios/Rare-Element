/**
 * Server read of the store's tag ids (PRD-034 FR-1.2) — SERVER ONLY
 *
 * One anonymous `storefrontTrackingConfig` read through the RSC client
 * (edge-signed, tenant from NEXT_PUBLIC_TENANT_DOMAIN), used by
 * `app/layout.jsx`. It never breaks a page: an error, a timeout or a
 * missing field answers null, and `utils/tracking-config.js` then falls
 * back to the env ids. No dynamic API is used, so pages stay static; the
 * fetch revalidates every 5 minutes, which also makes otherwise static
 * pages (about, login, …) ISR at that interval, so a store that installs
 * or changes an ads app sees its ids without a redeploy.
 */

import { getClient } from "@/lib/apollo-client-rsc";
import { STOREFRONT_TRACKING_CONFIG } from "@/graphql/queries/tracking.gql";

// ─── Constants ────────────────────────────────────────────────────────────

const TRACKING_CONFIG_TIMEOUT_MS = 3000;
const TRACKING_CONFIG_REVALIDATE_S = 300;

// ─── Public API ───────────────────────────────────────────────────────────

/** The backend config, or null when it can't be read. */
export async function getStorefrontTrackingConfig() {
  try {
    const { data } = await getClient().query({
      query: STOREFRONT_TRACKING_CONFIG,
      context: {
        fetchOptions: {
          signal: AbortSignal.timeout(TRACKING_CONFIG_TIMEOUT_MS),
          next: { revalidate: TRACKING_CONFIG_REVALIDATE_S },
        },
      },
    });
    return data?.storefrontTrackingConfig ?? null;
  } catch {
    // Unreachable gateway or an older backend: env tag ids apply.
    return null;
  }
}
