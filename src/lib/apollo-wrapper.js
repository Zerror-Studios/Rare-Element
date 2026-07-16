"use client";

import {
  ApolloLink,
  HttpLink,
} from "@apollo/client";
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { TokenManager } from "@/utils/tokenManager";
import React from "react";

function makeClient() {
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
    fetchOptions: { cache: "no-store" },
    headers: {
      'x-forwarded-host': process.env.NEXT_PUBLIC_TENANT_DOMAIN || (typeof window !== 'undefined' ? window.location.host : 'localhost:3000'),
    }
  });

  const authLink = new ApolloLink((operation, forward) => {
    const token = TokenManager.getAccessToken();
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    }));

    return forward(operation);
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([authLink, httpLink]),
  });
}

export function ApolloWrapper({ children }) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
