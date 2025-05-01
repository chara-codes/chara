import { createTRPCProxyClient, httpBatchStreamLink } from "@trpc/client";
import type { AppRouter } from "../src";

async function main() {
  const url = "http://localhost:3030/trpc/";

  const trpc = createTRPCProxyClient<AppRouter>({
    links: [httpBatchStreamLink({ url })],
  });

  await trpc.lnks.delete.mutate(1);

  const stack = await trpc.stacks.create.mutate({
    title: `title ${Math.random()}`,
    description: `description ${Math.random()}`,
  });
  const link = await trpc.lnks.add.mutate({
    title: "Next.js",
    url: "https://nextjs.org/docs/?" + Math.random(),
    stackId: stack.id,
  });
  console.log(link);
}

if (import.meta.main) {
  main();
}
