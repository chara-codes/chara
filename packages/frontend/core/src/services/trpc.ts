import type { AppRouter } from "@chara-codes/server";
import {
  createTRPCProxyClient,
  httpBatchLink as vanillaHttpBatchLink,
} from "@trpc/client";
import {
  createTRPCReact,
  createWSClient,
  httpBatchLink,
  httpBatchStreamLink,
  splitLink,
  wsLink,
} from "@trpc/react-query";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export function createTrpcClient() {
  const server = import.meta.env?.VITE_SERVER_URL || "localhost:3030";
  const trpcUrl = `http://${server}/trpc`;
  const wsUrl = `ws://${server}/events`;
  const wsClient = createWSClient({
    url: wsUrl, // WebSocket endpoint
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
          // Use httpBatchStreamLink for streaming queries
          condition: (op) => op.path.startsWith("chat.") && op.type === "query",
          true: httpBatchStreamLink({
            url: trpcUrl, // HTTP streaming endpoint
            transformer: superjson,
          }),
          // Use httpBatchLink for non-streaming operations
          false: httpBatchLink({
            url: trpcUrl, // HTTP endpoint
            transformer: superjson,
          }),
        }),
      }),
    ],
  });
}

export function createVanillaTrpcClient() {
  const server = import.meta.env?.VITE_SERVER_URL || "localhost:3030";
  const trpcUrl = `http://${server}/trpc`;

  return createTRPCProxyClient<AppRouter>({
    links: [
      vanillaHttpBatchLink({
        url: trpcUrl,
        transformer: superjson,
      }),
    ],
  });
}

// Create a singleton vanilla client for reuse
let vanillaClient: ReturnType<typeof createVanillaTrpcClient> | null = null;

export function getVanillaTrpcClient() {
  if (!vanillaClient) {
    vanillaClient = createVanillaTrpcClient();
  }
  return vanillaClient;
}
