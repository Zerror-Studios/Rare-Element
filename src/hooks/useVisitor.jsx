"use client";

/**
 * Guest cart id (PRD-002 R2-C2) on the kit's `guestCartStore` (PRD-002
 * FR-4.1): the id is issued by the server (`issueGuestCartId`, anonymous,
 * single-flight), kept in the kit's storage key (a pre-kit `visitorId` is
 * moved there once by the kit), shared by every component, and merged into
 * the customer cart at login by the kit. The store keeps this hook's API
 * for its cart components.
 */

import { useCallback, useEffect, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { guestCartStore } from "@zcom/storefront-kit/client";

import { ISSUE_GUEST_CART_ID } from "@/graphql";
import { isInvalidGuestIdError } from "@/utils/errors";

// ─── Storage ──────────────────────────────────────────────────────────────

export const readVisitorId = () => guestCartStore.get();

export const clearVisitorId = () => guestCartStore.clear();

/** Drops `guestId` only if it is still the stored one (VBUG-6). */
const clearVisitorIdIfCurrent = (guestId) => {
  if (guestCartStore.get() === guestId) guestCartStore.clear();
};

// ─── Issuing ──────────────────────────────────────────────────────────────

/** The stored guest id, or a new one from `issueGuestCartId` (single-flight). */
export async function ensureVisitorId(client) {
  return await guestCartStore.ensure(async () => {
    const { data } = await client.mutate({
      mutation: ISSUE_GUEST_CART_ID,
      context: { skipAuth: true },
    });
    const visitorId = data?.issueGuestCartId;
    if (!visitorId) throw new Error("No guest cart id was issued");
    return visitorId;
  });
}

/**
 * Runs `operation(guestId)`; on `INVALID_GUEST_ID` drops the stored id and
 * retries once with a newly issued one.
 */
export async function runWithGuestId(client, operation) {
  const guestId = await ensureVisitorId(client);
  try {
    return await operation(guestId);
  } catch (error) {
    if (!isInvalidGuestIdError(error)) throw error;
    clearVisitorIdIfCurrent(guestId);
    return await operation(await ensureVisitorId(client));
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export const useVisitor = () => {
  const client = useApolloClient();
  const [visitorId, setVisitorId] = useState(null);

  useEffect(() => {
    setVisitorId(guestCartStore.get());
    return guestCartStore.subscribe(setVisitorId);
  }, []);

  const ensure = useCallback(() => ensureVisitorId(client), [client]);
  const runWithId = useCallback(
    (operation) => runWithGuestId(client, operation),
    [client],
  );

  return {
    visitorId,
    ensureVisitorId: ensure,
    runWithGuestId: runWithId,
    resetVisitorId: clearVisitorId,
  };
};
