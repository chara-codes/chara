import type { AppRouter } from "@chara-codes/server";
import {
  createTRPCProxyClient,
  httpBatchLink as vanillaHttpBatchLink,
} from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export const createTrpcClient = getVanillaTrpcClient;

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
