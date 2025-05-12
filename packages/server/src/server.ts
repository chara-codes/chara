import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { linksRouter } from "./api/routes/links";
import { stacksRouter } from "./api/routes/stacks";
import { messagesRouter } from "./api/routes/messages";
import { createContext, type Context } from "./api/context";
import { cyan } from "picocolors";
import { serve } from "bun";
import { createBunWSHandler } from "./utils/create-bun-ws-handler";
import { myLogger as logger } from "./utils/logger";
import { chatRouter } from "./api/routes/chat";
import { subscription } from "./api/routes/subscription";
import { instructionsRouter } from "./api/routes/instructions";
import { filesRouter } from "./api/routes/files";
import superjson from "superjson";
import { previewRouter } from "./api/routes/preview";

const t = initTRPC.context<Context>().create({ transformer: superjson });

const publicProcedure = t.procedure;
const router = t.router;

export const appRouter = router({
  lnks: linksRouter,
  stacks: stacksRouter,
  messages: messagesRouter,
  chat: chatRouter,
  events: subscription,
  instructions: instructionsRouter,
  files: filesRouter,
  preview: previewRouter,
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
    // logger.request(request.method, request.url);
    // logger.info(`Headers: ${JSON.stringify(request.headers, null, 2)}`);
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

    if (url.pathname === "/events") {
      const success = server.upgrade(request, {
        data: { username: "test", req: request },
      });
      return success
        ? undefined
        : new Response("WebSocket upgrade error", { status: 400 });
    }

    if (url.pathname === "/chat") {
      const generatorFunction = async function* () {
        for (let i = 0; i < 5; i++) {
          yield `Data chunk ${i}\n`;
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
        }
      };
      const chatGenerator = generatorFunction(); // engineerAgent(body.message);

      // Create a ReadableStream from the generator
      const chatStream = new ReadableStream({
        start(controller) {
          const pushData = () => {
            const { value, done }: any = chatGenerator.next();
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(new TextEncoder().encode(value));
            // setTimeout(pushData, 10); // Simulate streaming with delay
          };
          pushData();
        },
      });

      return new Response(chatStream, {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
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
logger.api(`- WebSocket: ${cyan(`ws://localhost:${server.port}/events`)}`);
