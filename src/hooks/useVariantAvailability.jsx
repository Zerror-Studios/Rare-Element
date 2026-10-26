/**
 * Fresh stock read for the PDP and the cart (PRD-020 FR-8, FR-12, D9)
 *
 * Calls `getVariantAvailability` for up to 50 ids (never cached on the
 * server) and returns the answered rows keyed by id. While the read is
 * pending, or when it fails, the map keeps the last good answer (empty at
 * first), so callers fall back to the server-rendered value and nothing is
 * blocked. `refresh()` re-reads (variant change on the PDP).
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/hooks/useVariantAvailability.jsx`.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_VARIANT_AVAILABILITY } from "@/graphql";
import { toAvailabilityIds, toAvailabilityMap } from "@/utils/stock-signal";

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useVariantAvailability(ids, { skip = false } = {}) {
  const idsKey = toAvailabilityIds(ids).join(",");
  const variantIds = useMemo(
    () => (idsKey ? idsKey.split(",") : []),
    [idsKey],
  );
  const inactive = skip || variantIds.length === 0;
  const [rows, setRows] = useState(null);

  const { data, refetch } = useQuery(GET_VARIANT_AVAILABILITY, {
    variables: { variantIds },
    skip: inactive,
    fetchPolicy: "network-only",
    errorPolicy: "none",
  });

  useEffect(() => {
    if (data?.getVariantAvailability) setRows(data.getVariantAvailability);
  }, [data]);

  const refresh = useCallback(() => {
    if (inactive) return;
    // A failed re-read keeps the last answer (never blocks add to cart).
    refetch().catch(() => {});
  }, [inactive, refetch]);

  const fresh = useMemo(() => toAvailabilityMap(rows), [rows]);
  return { fresh, refresh };
}
