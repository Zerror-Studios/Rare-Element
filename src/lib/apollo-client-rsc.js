import { HttpLink } from "@apollo/client";
import {
  InMemoryCache,
  ApolloClient,
  registerApolloClient,
} from "@apollo/client-integration-nextjs";

export const { getClient } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
      headers: {
        'x-forwarded-host': process.env.NEXT_PUBLIC_TENANT_DOMAIN || (typeof window !== 'undefined' ? window.location.host : 'localhost:3000'),
      }
    }),
  });
});
