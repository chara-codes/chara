import {
  createTRPCReact,
  wsLink,
  splitLink,
  httpBatchLink,
  httpBatchStreamLink,
  createWSClient,
} from "@trpc/react-query";
import type { AppRouter } from "@chara/server";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const wsClient = createWSClient({
  url: "ws://localhost:3030/events", // WebSocket endpoint
});

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      // Split link to determine the appropriate transport mechanism
      splitLink({
        // Use WebSocket link for subscriptions
        condition: (op) => op.type === "subscription",
        true: wsLink({
          client: wsClient,
          transformer: superjson,
        }),
        false: splitLink({
          // Use httpBatchStreamLink for streaming queries/mutations
          condition: (op) => op.type === "query" || op.type === "mutation", // Adjust if needed
          true: httpBatchStreamLink({
            url: "http://localhost:3030/trpc", // HTTP streaming endpoint
            transformer: superjson,
          }),
          // Use httpBatchLink for non-streaming operations
          false: httpBatchLink({
            url: "http://localhost:3030/trpc", // HTTP endpoint
            transformer: superjson,
          }),
        }),
      }),
    ],
  });
}
