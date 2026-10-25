"use client";

/**
 * Guest cart id (PRD-002 RSEC-3, contract R2-C2)
 *
 * The guest id is a bearer value for the anonymous cart, so the server
 * issues it (`issueGuestCartId`, `<random>.<hmac>`) instead of the browser
 * picking a UUID. It is requested lazily, the first time a guest adds to
 * the bag, and kept in localStorage (`visitorId`, 7-day sliding expiry).
 *
 * When a cart operation answers `INVALID_GUEST_ID`, the stored id is
 * dropped and a new one is issued (`runWithGuestId` retries once). Ids
 * from before R2-C2 (unsigned UUIDs) are dropped on read. The drop is
 * compare-and-clear (VBUG-6): a late failure of an old id never clears a
 * newer id that another tab or call has stored meanwhile.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/hooks/useVisitor.jsx`.
 */

import { useCallback, useEffect, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { ISSUE_GUEST_CART_ID } from "@/graphql";
import { isInvalidGuestIdError } from "@/utils/errors";

// ─── Constants ────────────────────────────────────────────────────────────

const VISITOR_ID_KEY = "visitorId";
const VISITOR_EXPIRE_KEY = "visitorExpire";
const VISITOR_TTL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
// `<random>.<hmac>`; an unsigned UUID has no dot.
const SIGNED_GUEST_ID_PATTERN = /^[^.\s]+\.[^.\s]+$/;

// ─── State ────────────────────────────────────────────────────────────────

let issuing = null;
const listeners = new Set();

const notify = (visitorId) => {
  listeners.forEach((listener) => listener(visitorId));
};

// ─── Storage ──────────────────────────────────────────────────────────────

/** The stored, server-signed guest id, or null. */
export const readVisitorId = () => {
  try {
    const value = localStorage.getItem(VISITOR_ID_KEY);
    return value && SIGNED_GUEST_ID_PATTERN.test(value) ? value : null;
  } catch {
    return null;
  }
};

const writeVisitorId = (visitorId) => {
  try {
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
    localStorage.setItem(
      VISITOR_EXPIRE_KEY,
      new Date(Date.now() + VISITOR_TTL_DAYS * DAY_MS).toISOString(),
    );
  } catch {
    // Storage unavailable: the id lives for this page only.
  }
  notify(visitorId);
};

/** Forget the guest id (merged at login, or rejected by the server). */
export const clearVisitorId = () => {
  try {
    localStorage.removeItem(VISITOR_ID_KEY);
    localStorage.removeItem(VISITOR_EXPIRE_KEY);
  } catch {
    // Storage unavailable; nothing to clear.
  }
  notify(null);
};

/** Forget the stored guest id only while it is still `visitorId`. */
const clearVisitorIdIfCurrent = (visitorId) => {
  let stored = null;
  try {
    stored = localStorage.getItem(VISITOR_ID_KEY);
  } catch {
    // Storage unavailable: nothing stored to compare or clear.
    return;
  }
  if (stored === visitorId) clearVisitorId();
};

// ─── Issuing ──────────────────────────────────────────────────────────────

/** The stored guest id, or a new one from `issueGuestCartId` (single-flight). */
export async function ensureVisitorId(client) {
  const stored = readVisitorId();
  if (stored) return stored;

  if (!issuing) {
    issuing = client
      .mutate({ mutation: ISSUE_GUEST_CART_ID, context: { skipAuth: true } })
      .then(({ data }) => {
        const visitorId = data?.issueGuestCartId;
        if (!visitorId) throw new Error("No guest cart id was issued");
        writeVisitorId(visitorId);
        return visitorId;
      })
      .finally(() => {
        issuing = null;
      });
  }
  return await issuing;
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
    const stored = readVisitorId();
    if (stored) {
      writeVisitorId(stored);
    } else {
      try {
        // Drops an unsigned pre-R2-C2 id, which the server would reject.
        if (localStorage.getItem(VISITOR_ID_KEY)) clearVisitorId();
      } catch {
        // Storage unavailable.
      }
    }
    setVisitorId(stored);
    listeners.add(setVisitorId);
    return () => {
      listeners.delete(setVisitorId);
    };
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
