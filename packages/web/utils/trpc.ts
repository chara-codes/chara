import { createTRPCReact, httpBatchStreamLink } from "@trpc/react-query";
import type { AppRouter } from "@chara/server";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export function createTrpcClient() {
  const server = process.env.NEXT_PUBLIC_SERVER || "localhost:3030";
  return trpc.createClient({
    links: [
      httpBatchStreamLink({
        url: `http://${server}/trpc`,
        transformer: superjson,
      }),
    ],
  });
}
