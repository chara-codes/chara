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

export function createTrpcClient() {
  const server = process.env.NEXT_PUBLIC_SERVER || "localhost:3030";
  const wsClient = createWSClient({
  url: `ws://${server}/events`, // WebSocket endpoint
});
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
            url: `http://${server}/trpc`, // HTTP streaming endpoint
            transformer: superjson,
          }),
          // Use httpBatchLink for non-streaming operations
          false: httpBatchLink({
            url: `http://${server}/trpc`, // HTTP endpoint
            transformer: superjson,
          }),
        }),
      }),
    ],
  });
}
