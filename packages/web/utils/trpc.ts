import {
  createTRPCReact,
  httpBatchLink,
  httpBatchStreamLink,
  splitLink,
} from "@trpc/react-query";
import type { AppRouter } from "@chara/server";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export function createTrpcClient() {
  const url = "http://localhost:3030/trpc";
  return trpc.createClient({
    links: [
      // httpBatchLink({
      //   url: "http://localhost:3030/trpc",
      //   transformer: superjson,
      // }),
      splitLink({
        // Stream only chat.* queries (and only queries – mutations keep batching)
        condition(op) {
          return op.path.startsWith("chat.") && op.type === "query";
        },
        true: httpBatchStreamLink({ url, transformer: superjson }), // streaming here
        false: httpBatchLink({ url, transformer: superjson }), // everything else
      }),
    ],
  });
}
