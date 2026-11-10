"use client";

/**
 * Fresh stock read for the PDP and the cart (PRD-020 FR-8, FR-12, D9) on
 * the kit's `useStockSignal` (PRD-002 FR-4.1): `getVariantAvailability` for
 * up to 50 ids, never cached; while it is pending or failed the last good
 * answer stays (empty at first), so callers fall back to the
 * server-rendered value and nothing is blocked. `refresh()` re-reads
 * (variant change on the PDP, cart drawer opened).
 */

import { useMemo } from "react";
import { useStockSignal } from "@zcom/storefront-kit/client";

import { toAvailabilityIds } from "@/utils/stock-signal";

export function useVariantAvailability(ids, { skip = false } = {}) {
  const variantIds = toAvailabilityIds(ids);
  const { signals, refresh } = useStockSignal(variantIds, { skip });
  // The store's helpers take `{ [id]: signal }`
  const fresh = useMemo(() => Object.fromEntries(signals), [signals]);
  return { fresh, refresh };
}
