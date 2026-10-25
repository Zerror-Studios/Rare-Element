"use client";

/**
 * Client Apollo provider (PRD-002 SF-3 / SF-9 / SF-18, PRD-001 phase 2)
 *
 * Link chain: error/refresh → auth → http.
 * - http: same-origin `/v1/graphql` with `credentials: "include"`, so the
 *   HttpOnly customer refresh cookie travels with refresh and logout.
 * - auth: adds the in-memory access token. A shopper who is logged in
 *   (persisted profile) but has no token yet (page reload) or an expired
 *   one waits for one single-flight `customerRefreshToken` first.
 *   `context.skipAuth` sends a request anonymously (guest-cart merge).
 * - error: TOKEN_EXPIRED → refresh once and retry; INVALID_AUTH_TOKEN /
 *   TENANT_MISMATCH → end the session; TENANT_NOT_FOUND
 *   → one "store unavailable" notice (R2-C5). Branches on
 *   `extensions.code` only.
 * - tenant: during SSR this client calls the gateway directly (not through
 *   `middleware.js`), so it adds the server-only edge secret itself, as
 *   the RSC client does; strict tenant mode would ignore it otherwise.
 */

import {
  ApolloLink,
  CombinedGraphQLErrors,
  HttpLink,
  Observable,
} from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { toast } from "react-toastify";
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { TokenManager } from "@/utils/tokenManager";
import { useAuthStore } from "@/store/auth-store";
import {
  API_VERSION,
  BROWSER_GRAPHQL_URL,
  getBrowserTenantDomain,
  getServerGraphqlUrl,
  getServerTenantDomain,
} from "@/utils/env";
import React from "react";

// ─── Constants ────────────────────────────────────────────────────────────

const FATAL_AUTH_CODES = [
  "INVALID_AUTH_TOKEN",
  "TENANT_MISMATCH",
];
const STORE_UNAVAILABLE_TOAST_ID = "store-unavailable";

const isServer = () => typeof window === "undefined";

/**
 * PRD-002 R2-C1: the edge secret for SSR requests, `{}` in the browser.
 * The `typeof window` test must stay inline: Next compiles it to a
 * constant per bundle, so the browser build drops this `require` and
 * `lib/edge-headers.js` (and the secret's name) never reach it.
 */
function getSsrEdgeHeaders() {
  if (typeof window === "undefined") {
    return require("@/lib/edge-headers").getEdgeSecretHeaders();
  }
  return {};
}

/** Subscribe to `next(result)` once `promise` settles (null on failure). */
function afterPromise(promise, next) {
  return new Observable((observer) => {
    let subscription;
    let closed = false;
    promise
      .catch(() => null)
      .then((result) => {
        if (closed) return;
        subscription = next(result).subscribe(observer);
      });
    return () => {
      closed = true;
      subscription?.unsubscribe();
    };
  });
}

// ─── Links ────────────────────────────────────────────────────────────────

function makeHttpLink() {
  return new HttpLink({
    // Resolved per request: SSR of client components runs on the server.
    uri: () => (isServer() ? getServerGraphqlUrl() : BROWSER_GRAPHQL_URL),
    credentials: "include",
    fetchOptions: { cache: "no-store" },
  });
}

const tenantLink = new ApolloLink((operation, forward) => {
  const tenant = isServer() ? getServerTenantDomain() : getBrowserTenantDomain();
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      "x-api-version": API_VERSION,
      ...(tenant ? { "x-forwarded-host": tenant } : {}),
      ...(tenant && isServer() ? { "x-tenant-domain": tenant } : {}),
      ...getSsrEdgeHeaders(),
    },
  }));
  return forward(operation);
});

const authLink = new ApolloLink((operation, forward) => {
  const { skipAuth } = operation.getContext();
  const withToken = () => {
    const token = skipAuth ? null : TokenManager.getAccessToken();
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    }));
    return operation;
  };

  const needsRefresh =
    !skipAuth &&
    !isServer() &&
    !TokenManager.hasValidToken() &&
    useAuthStore.getState().isLoggedIn;

  if (!needsRefresh) return forward(withToken());
  return afterPromise(TokenManager.refresh(), () => forward(withToken()));
});

const errorLink = new ErrorLink(({ error, operation, forward }) => {
  if (!CombinedGraphQLErrors.is(error)) return;
  const context = operation.getContext();
  const codes = error.errors.map((item) => item.extensions?.code);

  if (codes.includes("TENANT_NOT_FOUND") && !isServer()) {
    toast.error("This store is unavailable right now. Please try later.", {
      toastId: STORE_UNAVAILABLE_TOAST_ID,
    });
    return;
  }
  if (context.skipAuth) return;

  if (codes.some((code) => FATAL_AUTH_CODES.includes(code))) {
    TokenManager.endSession();
    return;
  }

  if (!codes.includes("TOKEN_EXPIRED") || context.isRetry) return;

  operation.setContext({ isRetry: true });
  return afterPromise(TokenManager.refresh(), (token) =>
    token
      ? forward(operation)
      : new Observable((observer) => observer.error(error)),
  );
});

// ─── Client ───────────────────────────────────────────────────────────────

function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([errorLink, tenantLink, authLink, makeHttpLink()]),
  });
}

export function ApolloWrapper({ children }) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
