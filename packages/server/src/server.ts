import { initTRPC, tracked } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";
import { linksRouter } from "./api/routes/links";
import { stacksRouter } from "./api/routes/stacks";
import { messagesRouter } from "./api/routes/messages";
import { createContext, type Context } from "./api/context";
import { bold } from "picocolors";
import { serve } from "bun";
import { createBunWSHandler } from "./utils/create-bun-ws-handler";
import EventEmitter, { on } from "node:events";

const t = initTRPC.context<Context>().create();

const ee = new EventEmitter();

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
  aaa: publicProcedure.subscription(async function* (opts) {
    // listen for new events
    for await (const [data] of on(ee, "add", {
      // Passing the AbortSignal from the request automatically cancels the event emitter when the request is aborted
      signal: opts.signal,
    })) {
      console.log(data);
      yield tracked(data.test, data);
    }
  }),
});

export type AppRouter = typeof appRouter;

const websocket = createBunWSHandler({
  router: appRouter,
  // optional arguments:
  createContext,
  onError: console.error,
  batching: {
    enabled: true,
  },
});

const server = serve({
  port: 3030,
  async fetch(request): Promise<Response | undefined> {
    const url = new URL(request.url);

    // Only used for start-server-and-test package that
    // expects a 200 OK to start testing the server
    if (request.method === "HEAD" || request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    if (url.pathname === "/") {
      return new Response("hello world");
    }

    if (url.pathname === "/chat") {
      const success = server.upgrade(request, {
        data: { username: "test", req: request },
      });
      return success
        ? undefined
        : new Response("WebSocket upgrade error", { status: 400 });
    }
    console.log(`${bold(request.method)} ${request.url}`);
    console.log(request.headers);
    const response = await fetchRequestHandler({
      endpoint: "/trpc",
      req: request,
      router: appRouter,
      createContext,
    });
    response.headers.append("Access-Control-Allow-Origin", "*");
    return response;
  },
  websocket,
});
console.log(`🚀 Server ready at: http://localhost:${server.port}/`);
console.log(websocket);
