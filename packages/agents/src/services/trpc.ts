import type { AppRouter } from "@chara-codes/server";
import { createTRPCProxyClient, httpBatchStreamLink } from "@trpc/client";
import superjson from "superjson";

const url = process.env.PUBLIC_SERVER_URL ?? "http://localhost:3030/";

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchStreamLink({ url: `${url}trpc`, transformer: superjson })],
});
