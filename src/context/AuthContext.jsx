"use client";

/**
 * Customer session context (PRD-001 phase 2 / PRD-002 SF-11, SF-18)
 *
 * - `completeLogin(accessToken, expiresIn)`: keeps the token in memory,
 *   loads the profile and merges the guest cart into the customer cart
 *   with one `mergeGuestCart(guestId)` call (PRD-002 R2-C3: idempotent,
 *   server re-priced). On failure the guest id is kept and the shopper is
 *   warned; a rejected id (`INVALID_GUEST_ID`) is dropped.
 * - The profile is not persisted (RSEC-11): after a reload it is fetched
 *   again when the logged-in hint is set.
 * - `logout()`: `customerLogout` revokes the cookie session server-side;
 *   local state and the Apollo store are always cleared (`finally`).
 * - A session the server ends (refresh rejected) clears local state too.
 *
 * Keep the merge in sync with
 * `storefronts/deveshe-dreams/src/lib/customer-session.service.js`.
 */

import React, { createContext, useCallback, useContext, useEffect } from "react";
import { useApolloClient } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/auth-store";
import { CUSTOMER_LOGOUT, GET_MY_PROFILE, MERGE_GUEST_CART } from "@/graphql";
import { TokenManager } from "@/utils/tokenManager";
import { isInvalidGuestIdError } from "@/utils/errors";
import { clearVisitorId, readVisitorId } from "@/hooks/useVisitor";

const AuthContext = createContext();

// ─── Guest cart merge ─────────────────────────────────────────────────────

/** Moves the guest cart into the customer cart; false when it failed. */
async function mergeGuestCart(client) {
  const guestId = readVisitorId();
  if (!guestId) return true;

  try {
    await client.mutate({
      mutation: MERGE_GUEST_CART,
      variables: { guestId },
    });
    clearVisitorId();
    return true;
  } catch (error) {
    if (isInvalidGuestIdError(error)) {
      clearVisitorId();
      return true;
    }
    console.error("Guest cart merge failed:", error);
    return false;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const client = useApolloClient();
  const { clearAuth, setUser, setIsLoggedIn } = useAuthStore((state) => state);

  const resetLocalSession = useCallback(async () => {
    TokenManager.clear();
    clearAuth();
    try {
      localStorage.removeItem("user-data");
    } catch {
      // Storage unavailable; the in-memory store is already cleared.
    }
    await client.clearStore();
  }, [clearAuth, client]);

  // Restore the in-memory token after a reload and follow server-side ends.
  useEffect(() => {
    TokenManager.purgeLegacyStorage();
    const unsubscribe = TokenManager.subscribe(async (event) => {
      if (event !== "SESSION_ENDED") return;
      if (!useAuthStore.getState().isLoggedIn) return;
      await resetLocalSession();
      toast.info("Your session has ended. Please log in again.");
    });
    const { isLoggedIn, user } = useAuthStore.getState();
    if (isLoggedIn && !TokenManager.hasValidToken()) {
      TokenManager.refresh();
    }
    // The profile isn't persisted (RSEC-11); the auth link waits for the
    // refresh above before this query goes out.
    if (isLoggedIn && !user) {
      client
        .query({ query: GET_MY_PROFILE, fetchPolicy: "network-only" })
        .then(({ data }) => {
          if (data?.getMyProfile && useAuthStore.getState().isLoggedIn) {
            setUser(data.getMyProfile);
          }
        })
        .catch(() => {
          // A refused session ends through SESSION_ENDED above.
        });
    }
    return unsubscribe;
  }, [client, resetLocalSession, setUser]);

  const completeLogin = async (accessToken, expiresIn) => {
    await client.clearStore();
    TokenManager.setAccessToken(accessToken, expiresIn);

    const { data } = await client.query({
      query: GET_MY_PROFILE,
      fetchPolicy: "network-only",
    });
    const user = data?.getMyProfile || null;
    setUser(user);
    setIsLoggedIn(true);

    if (!(await mergeGuestCart(client))) {
      toast.warn("Some items from your bag could not be added.");
    }
    await client.resetStore();
    return user;
  };

  const logout = async () => {
    try {
      await client.mutate({ mutation: CUSTOMER_LOGOUT });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      await resetLocalSession();
    }
  };

  return (
    <AuthContext.Provider value={{ logout, completeLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
};
