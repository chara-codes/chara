import { createTRPCReact, httpBatchStreamLink } from "@trpc/react-query";
import { createWSClient, wsLink } from "@trpc/client";
import type { AppRouter } from "@chara/server";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export function createTrpcClient() {
  // Create WebSocket client
  const wsClient = createWSClient({
    url: "ws://localhost:3030/events",
  });
  
  return trpc.createClient({
    links: [
      // HTTP link for regular operations
      httpBatchStreamLink({
        url: "http://localhost:3030/trpc",
        transformer: superjson,
      }),
      // WebSocket link for subscriptions
      wsLink({
        client: wsClient,
        transformer: superjson,
      }),
    ],
  });
}
