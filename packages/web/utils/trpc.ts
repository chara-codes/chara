import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "@chara/server";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: "http://localhost:3030/trpc",
        // transformer: superjson,
      }),
    ],
  });
}
