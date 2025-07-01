import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { linksRouter } from "./api/routes/links";
import { stacksRouter } from "./api/routes/stacks";
import { messagesRouter } from "./api/routes/messages";
import { createContext, type Context } from "./api/context";
import { cyan } from "picocolors";
import { serve } from "bun";
import { createBunWSHandler } from "./utils/create-bun-ws-handler";
import { subscription } from "./api/routes/subscription";
import { instructionsRouter } from "./api/routes/instructions";
import { filesRouter } from "./api/routes/files";
import superjson from "superjson";
import { previewRouter } from "./api/routes/preview";
import { BunSSEServerTransport } from "./mcp/transport";
import {
  mcpClientsSubscriptions,
  mcpClientsMutations,
} from "./api/routes/mcpservers";
import { createServer } from "./mcp/server";
import { sessionRouter } from "./api/routes/sessions";
import { parse } from "querystring";
import { logger } from "@chara/logger";

const t = initTRPC.context<Context>().create({ transformer: superjson });

const router = t.router;

export const appRouter = router({
  lnks: linksRouter,
  stacks: stacksRouter,
  messages: messagesRouter,
  sessions: sessionRouter,
  events: subscription,
  instructions: instructionsRouter,
  files: filesRouter,
  preview: previewRouter,
  mcpClientsSubscriptions: mcpClientsSubscriptions,
  mcpResponses: mcpClientsMutations,
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

    if (url.pathname === "/mcp-tunnel") {
      const success = server.upgrade(request, {
        data: { username: "test", req: request },
      });
      return success
        ? undefined
        : new Response("WebSocket upgrade error", { status: 400 });
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
logger.server(`- HTTP: ${cyan(`http://localhost:${server.port}/trpc`)}`);
logger.server(`- WebSocket: ${cyan(`ws://localhost:${server.port}/events`)}`);

// In-memory store for active SSE transports by session ID
const transports: Record<string, BunSSEServerTransport> = {};
const MCPserver = await createServer();

const SSEServer = serve({
  port: 3035,
  idleTimeout: 255,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (req.method === "GET" && pathname === "/sse") {
      logger.info("Received GET request to /sse");

      const transport = new BunSSEServerTransport("/messages");
      const sessionId = transport.sessionId;
      transports[sessionId] = transport;

      transport.onclose = () => {
        logger.info(`SSE transport closed for session ${sessionId}`);
        delete transports[sessionId];
      };

      await MCPserver.connect(transport);
      logger.info(`Established SSE stream with session ID: ${sessionId}`);

      return transport.createResponse();
    }

    if (req.method === "POST" && pathname === "/messages") {
      logger.info("Received POST request to /messages");
      const query = parse(url.searchParams.toString());
      const sessionId = query.sessionId?.toString();

      if (!sessionId) {
        return new Response("Missing sessionId parameter", { status: 400 });
      }

      const transport = transports[sessionId];
      if (!transport) {
        return new Response("Session not found", { status: 404 });
      }

      try {
        return transports[sessionId].handlePostMessage(req);
      } catch (error) {
        logger.error("Error handling request:", error);
        return new Response("Error handling request", { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  },
  async error(err) {
    logger.error("Server error:", err);
    return new Response("Internal server error", { status: 500 });
  },
});

// Shutdown handling
process.on("SIGINT", async () => {
  logger.info("Shutting down Bun MCP server...");
  for (const sessionId in transports) {
    try {
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (err) {
      logger.error(`Error closing transport ${sessionId}`, err);
    }
  }
  logger.info("Server shutdown complete");
  process.exit(0);
});

logger.server(`Server ready at: http://localhost:${SSEServer.port}/`);
logger.success("MCP Server handler initialized");
logger.info("Available endpoints:");
logger.info(`- HTTP: ${cyan(`http://localhost:${SSEServer.port}/mcp`)}`);
