import { createTRPCReact, httpBatchStreamLink } from "@trpc/react-query";
import type { AppRouter } from "@chara/server";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchStreamLink({
        url: "http://localhost:3030/trpc",
        transformer: superjson,
      }),
    ],
  });
}
