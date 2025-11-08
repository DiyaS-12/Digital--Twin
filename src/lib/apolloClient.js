import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const client = new ApolloClient({
  link: new HttpLink({
    uri: `${import.meta.env.VITE_SUPABASE_URL}/graphql/v1`,
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  }),
  cache: new InMemoryCache(),
});
console.log("🔗 GraphQL Endpoint:", `${import.meta.env.VITE_SUPABASE_URL}/graphql/v1`);
console.log("🔑 API Key starts with:", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.slice(0, 10));

export default client;
