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
import { BunSSEServerTransport } from "./mcp/transport";
import {
  mcpClientsSubscriptions,
  mcpClientsMutations,
} from "./api/routes/mcpservers";
import { createServer } from "./mcp/server";
import { sessionRouter } from "./api/routes/sessions";
import superjson from "superjson";
import { parse } from "querystring";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAgent } from "./ai/agents/mastra-agent";

const t = initTRPC.context<Context>().create({ transformer: superjson });

const publicProcedure = t.procedure;
const router = t.router;

export const appRouter = router({
  lnks: linksRouter,
  stacks: stacksRouter,
  messages: messagesRouter,
  chat: chatRouter,
  sessions: sessionRouter,
  events: subscription,
  instructions: instructionsRouter,
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
    logger.request(request.method, request.url);
    logger.info(`Headers: ${JSON.stringify(request.headers, null, 2)}`);
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

    // New endpoint for the Mastra agent
    if (url.pathname === "/agent") {
      try {
        // Get the request body
        const body = await request.json();
        const { message } = body;

        if (!message) {
          return new Response(
            JSON.stringify({ error: "Message is required" }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        // Get agent instance
        const agent = await getAgent();

        // Use generate method to process the message
        const response = await (agent as any).generate(message);

        // Stream the response
        const agentStream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();

            // Send response as a stream
            controller.enqueue(
              encoder.encode(response || "No response generated")
            );
            controller.close();
          },
        });

        return new Response(agentStream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache",
          },
        });
      } catch (error) {
        console.error("Error in agent endpoint:", error);
        return new Response(
          JSON.stringify({ error: "Internal server error" }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
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
logger.api(`- HTTP: ${cyan(`http://localhost:${SSEServer.port}/mcp`)}`);
