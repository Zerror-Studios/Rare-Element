import { create } from "zustand";
import { persist } from "zustand/middleware";

// Only non-PII flags are persisted (PRD-002 RSEC-11): the logged-in hint
// and the customer id. The profile stays in memory and is reloaded after a
// refresh (`context/AuthContext.jsx`).
export const useAuthStore = create(
  persist(
    (set) => ({
      // Initial State
      user: null,
      userId: null,
      isLoggedIn: false,

      // Set State
      setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
      setUser: (user) => set({ user, userId: user?._id || null }),
      clearAuth: () => set({ isLoggedIn: false, user: null, userId: null }),
    }),
    {
      name: "user-data", // storage key
      version: 1,
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        userId: state.userId,
      }),
      // v0 stored the full profile; keep only the flags.
      migrate: (persisted) => ({
        isLoggedIn: !!persisted?.isLoggedIn,
        userId: persisted?.user?._id || persisted?.userId || null,
      }),
    }
  )
);
