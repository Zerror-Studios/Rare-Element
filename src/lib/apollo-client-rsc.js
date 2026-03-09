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
        dbtoken: `Bearer ${process.env.NEXT_PUBLIC_DB_TOKEN}`,
      },
    }),
  });
});
