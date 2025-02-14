import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";
import { linksRouter } from "./api/routes/links";
import { stacksRouter } from "./api/routes/stacks";
import { messagesRouter } from "./api/routes/messages";
import { createContext, type Context } from "./api/context";


const t = initTRPC.context<Context>().create();

const publicProcedure = t.procedure;
const router = t.router;

export const appRouter = router({
  hello: publicProcedure.input(z.string().nullish()).query(({ input }) => {
    return `hello ${input ?? "world"}`;
  }),
  iterable: publicProcedure.query(async function* () {
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      yield i;
    }
  }),
  lnks: linksRouter,
  stacks: stacksRouter,
  messages: messagesRouter,
});

export type AppRouter = typeof appRouter;

Bun.serve({
  port: 3030,
  fetch(request) {
    // Only used for start-server-and-test package that
    // expects a 200 OK to start testing the server
    if (request.method === "HEAD") {
      return new Response();
    }

    if (new URL(request.url).pathname === "/") {
      return new Response("hello world");
    }

    return fetchRequestHandler({
      endpoint: "/trpc",
      req: request,
      router: appRouter,
      createContext,
    });
  },
});
