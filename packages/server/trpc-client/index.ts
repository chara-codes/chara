import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../src/api/routes";
import superjson from "superjson";

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://0.0.0.0:1337/trpc",
    }),
  ],
  transformer: superjson,
});

async function main() {
  const hello = await trpc.hello.query();
  console.log(hello);
  const aTest = await trpc.a.test.query();
  console.log(aTest);
  const test = await trpc.test.query({ test: "test", zz: 1 });
  console.log(test);
  const exec = await trpc.a.exec.mutate("test");
  console.log(exec);
}

void main();
