import { initTRPC, tracked } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { linksRouter } from "./api/routes/links";
import { stacksRouter } from "./api/routes/stacks";
import { messagesRouter } from "./api/routes/messages";
import { createContext, type Context } from "./api/context";
import { cyan } from "picocolors";
import { serve } from "bun";
import { createBunWSHandler } from "./utils/create-bun-ws-handler";
import { myLogger as logger } from "./utils/logger";
import { on } from "node:events";
import { chatRouter } from "./api/routes/chat";
import { ee } from "./utils/event-emitter";
import type { subscribe } from "node:diagnostics_channel";
import { subscription } from "./api/routes/subscription";

const t = initTRPC.context<Context>().create();

const publicProcedure = t.procedure;
const router = t.router;

export const appRouter = router({
  lnks: linksRouter,
  stacks: stacksRouter,
  messages: messagesRouter,
  chat: chatRouter,
  subscribe: subscription,
});

export type AppRouter = typeof appRouter;

const websocket = createBunWSHandler({
  router: appRouter,
  // optional arguments:
  createContext,
  onError: (error) =>
    logger.error(`WebSocket error: ${JSON.stringify(error, null, 2)}`),
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
    logger.request(request.method, request.url);
    logger.info(`Headers: ${JSON.stringify(request.headers, null, 2)}`);
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
logger.server(`Server ready at: http://localhost:${server.port}/`);
logger.success("WebSocket handler initialized");
logger.info("Available endpoints:");
logger.api(`- HTTP: ${cyan(`http://localhost:${server.port}/trpc`)}`);
logger.api(`- WebSocket: ${cyan(`ws://localhost:${server.port}/chat`)}`);
