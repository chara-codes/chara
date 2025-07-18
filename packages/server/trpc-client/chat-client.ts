import { createTRPCProxyClient, httpBatchStreamLink } from "@trpc/client";
import type { AppRouter } from "../src";
import superjson from "superjson";

async function main() {
  const url = "http://localhost:3030/trpc/";

  const proxy = createTRPCProxyClient<AppRouter>({
    links: [httpBatchStreamLink({ url, transformer: superjson })],
  });

  const chats = await proxy.chat.getChatList.query({});
  console.log(chats);
}
main();
