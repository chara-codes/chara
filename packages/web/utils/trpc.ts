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
  const server = process.env.NEXT_PUBLIC_SERVER || "localhost:3030";
  const url = `http://${server}/trpc`;

  return trpc.createClient({
    links: [
      splitLink({
        // Stream-only chat.* queries (and only queries – mutations keep batching)
        condition(op) {
          return op.path.startsWith("chat.") && op.type === "query";
        },
        true: httpBatchStreamLink({ url, transformer: superjson }),
        false: httpBatchLink({ url, transformer: superjson }),
      }),
    ],
  });
}
