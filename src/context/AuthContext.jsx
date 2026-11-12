"use client";

/**
 * Customer session context on the kit (PRD-002 FR-4.1).
 *
 * Sign-in is the kit's email code (`useCodeSignIn`, backend PRD-041 FR-9
 * to FR-12; it is also the sign-up), then `completeCodeSignIn`; password
 * sign-in (`login`) stays for customers who have a password (FR-11).
 *
 * The kit owns the session (in-memory access token, the HttpOnly refresh
 * cookie, single-flight refresh, guest-cart merge at login). This keeps the
 * store's `useAuthStore` (the `isLoggedIn` flag and the profile many
 * components read) in step with it, loads the profile after a sign-in or a
 * reload, and shows the store's own messages:
 * - "Some items from your bag could not be added." when the merge failed;
 * - "Your session has ended…" when the server ended the session.
 */

import React, { createContext, useCallback, useContext, useEffect } from "react";
import { useApolloClient } from "@apollo/client/react";
import { toast } from "react-toastify";
import { tokenManager, useAuth as useKitAuth, useSession } from "@zcom/storefront-kit/client";

import { GET_MY_PROFILE } from "@/graphql";
import { useAuthStore } from "@/store/auth-store";

const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const client = useApolloClient();
  const kit = useKitAuth();
  const session = useSession();
  const { clearAuth, setUser, setIsLoggedIn } = useAuthStore((state) => state);

  const loadProfile = useCallback(async () => {
    const { data } = await client.query({
      query: GET_MY_PROFILE,
      fetchPolicy: "network-only",
    });
    const user = data?.getMyProfile || null;
    if (user && tokenManager.getState().status === "customer") setUser(user);
    return user;
  }, [client, setUser]);

  // Follow the kit's session: signed in after a reload, or ended on its own
  useEffect(() => {
    if (session.status === "customer") {
      setIsLoggedIn(true);
      if (!useAuthStore.getState().user) loadProfile().catch(() => undefined);
    } else if (session.status === "guest") {
      clearAuth();
    }
  }, [clearAuth, loadProfile, session.status, setIsLoggedIn]);

  useEffect(
    () =>
      tokenManager.onSessionEnded(() => {
        toast.info("Your session has ended. Please log in again.");
      }),
    [],
  );

  /** Signs in, merges the guest bag and loads the profile. */
  const login = async (email, password) => {
    const auth = await kit.login(email, password);
    if (auth.merge === "failed") {
      toast.warn("Some items from your bag could not be added.");
    }
    setIsLoggedIn(true);
    return await loadProfile();
  };

  /**
   * After the kit's `useCodeSignIn().verifyCode` (backend PRD-041 FR-10):
   * the kit already started the session and merged the guest bag; this
   * brings the store's state in step exactly as `login` does and resolves
   * the profile.
   */
  const completeCodeSignIn = async ({ merge } = {}) => {
    if (merge === "failed") {
      toast.warn("Some items from your bag could not be added.");
    }
    setIsLoggedIn(true);
    return await loadProfile();
  };

  const logout = async () => {
    try {
      await kit.logout();
    } finally {
      clearAuth();
    }
  };

  return (
    <AuthContext.Provider value={{ login, completeCodeSignIn, logout }}>
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
