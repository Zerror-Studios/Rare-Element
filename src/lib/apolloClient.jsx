import Router from "next/router";
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { useAuthStore } from "@/store/auth-store";
import { TokenManager } from "@/utils/tokenManager";

// -------------------------------------------
// UNAUTHENTICATED handler
// -------------------------------------------
const handleUnauthorized = () => {
  if (typeof window !== "undefined") {
    useAuthStore.getState().clearAuth();
    TokenManager.clearTokens();
    localStorage.removeItem("user-data");
    Router.replace("/login");
  }
};

// -------------------------------------------
// REFRESH TOKEN logic
// -------------------------------------------
let isRefreshing = false;
let pendingRequests = [];

const resolvePendingRequests = (token) => {
  pendingRequests.map((callback) => callback(token));
  pendingRequests = [];
};

const refreshAccessToken = async () => {
  const refreshToken = TokenManager.getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const query = `
    query RefreshToken($refreshToken: String!) {
      refreshToken(refreshToken: $refreshToken) {
        accessToken
        refreshToken
      }
    }
  `;

  const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      dbtoken: `Bearer ${process.env.NEXT_PUBLIC_DB_TOKEN}`,
    },
    body: JSON.stringify({
      query,
      variables: { refreshToken },
    }),
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  const { accessToken, refreshToken: newRefreshToken } = result.data.refreshToken;
  TokenManager.setTokens(accessToken, newRefreshToken);
  return accessToken;
};

// -------------------------------------------
// ERROR MIDDLEWARE
// -------------------------------------------
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (let err of graphQLErrors) {
      const code = err.extensions?.code;
      const message = err.message;
      if (code === "UNAUTHENTICATED" || message === "TOKEN_EXPIRED" || message === "Unauthorized!!") {
        if (!isRefreshing) {
          isRefreshing = true;
          return from(
            refreshAccessToken()
              .then((newToken) => {
                isRefreshing = false;
                resolvePendingRequests(newToken);
                operation.setContext(({ headers = {} }) => ({
                  headers: {
                    ...headers,
                    authtoken: `Bearer ${newToken}`,
                  },
                }));
                return forward(operation);
              })
              .catch((error) => {
                isRefreshing = false;
                pendingRequests = [];
                handleUnauthorized();
                throw error;
              })
          );
        }

        // If already refreshing, queue the request
        return from(
          new Promise((resolve) => {
            pendingRequests.push((token) => {
              operation.setContext(({ headers = {} }) => ({
                headers: {
                  ...headers,
                  authtoken: `Bearer ${token}`,
                },
              }));
              resolve(forward(operation));
            });
          })
        );
      }
    }
  }

  if (networkError && networkError.statusCode === 401) {
    handleUnauthorized();
  }
});

// -------------------------------------------
// AUTH MIDDLEWARE
// -------------------------------------------
const authLink = new ApolloLink((operation, forward) => {
  const token = TokenManager.getAccessToken();
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      dbtoken: `Bearer ${process.env.NEXT_PUBLIC_DB_TOKEN}`,
      ...(token ? { authtoken: `Bearer ${token}` } : {}),
    },
  }));

  return forward(operation);
});

// -------------------------------------------
// HTTP LINK
// -------------------------------------------
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
  credentials: "same-origin",
});

// -------------------------------------------
// FINAL APOLLO CLIENT
// -------------------------------------------
export function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: ApolloLink.from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
  });
}
