"use client";

import {
  ApolloProvider,
} from "@apollo/client/react";
import {
  InMemoryCache,
  ApolloClient,
  HttpLink,
  ApolloLink,
} from "@apollo/client";
import { TokenManager } from "@/utils/tokenManager";
import React from "react";

function makeClient() {
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
    fetchOptions: { cache: "no-store" },
  });

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

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([authLink, httpLink]),
  });
}

const client = makeClient();

export function ApolloWrapper({ children }) {
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
}
