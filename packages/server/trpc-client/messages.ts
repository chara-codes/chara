import {
  createTRPCProxyClient,
  unstable_httpBatchStreamLink,
} from "@trpc/client";
import type { AppRouter } from "../src/server";

async function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  const url = "http://localhost:3030/trpc/";

  const proxy = createTRPCProxyClient<AppRouter>({
    links: [unstable_httpBatchStreamLink({ url })],
  });

  const answers = await proxy.messages.ask.query("Tell me a joke about Obama?")
  for await (const answer of answers) {
    process.stdout.write(answer);
  }

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
