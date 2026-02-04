import React, { createContext, useContext } from "react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { useAuthStore } from "@/store/auth-store";
import { LOGOUT } from "@/graphql";
import { TokenManager } from "@/utils/tokenManager";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const client = useApolloClient();
  const { clearAuth, user } = useAuthStore((state) => state);
  const [userLogout] = useMutation(LOGOUT);

  const logout = async () => {
    try {
      if (user?._id) {
        await userLogout({ variables: { userId: user._id } });
      }
      clearAuth();
      TokenManager.clearTokens();
      localStorage.removeItem("user-data");
      await client.clearStore();
    } catch (err) {
      console.error("Logout error:", err);
      // Still clear local auth even if backend call fails
      clearAuth();
      TokenManager.clearTokens();
      localStorage.removeItem("user-data");
    }
  };

  return (
    <AuthContext.Provider value={{ logout }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
};
