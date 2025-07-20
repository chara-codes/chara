import { logger } from "@chara-codes/logger";
import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type Server, serve } from "bun";
import { cyan } from "picocolors";
import { parse } from "querystring";
import superjson from "superjson";

import { type Context, createContext } from "./api/context";
import { chatRouter } from "./api/routes/chat";
import { filesRouter } from "./api/routes/files";
import { instructionsRouter } from "./api/routes/instructions";
import { linksRouter } from "./api/routes/links";
import {
  mcpClientsMutations,
  mcpClientsSubscriptions,
} from "./api/routes/mcpservers";
import { messagesRouter } from "./api/routes/messages";

import { stacksRouter } from "./api/routes/stacks";
import { subscription } from "./api/routes/subscription";
import { createServer } from "./mcp/server";
import { BunSSEServerTransport } from "./mcp/transport";
import { createBunWSHandler } from "./utils/create-bun-ws-handler";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const appRouter = t.router({
  chat: chatRouter,
  lnks: linksRouter,
  stacks: stacksRouter,
  messages: messagesRouter,
  events: subscription,
  instructions: instructionsRouter,
  files: filesRouter,
  mcpClientsSubscriptions: mcpClientsSubscriptions,
  mcpResponses: mcpClientsMutations,
});

export interface ServerOptions {
  /** Main server configuration */
  server?: {
    port?: number;
    cors?: {
      origin?: string;
      methods?: string;
      headers?: string;
    };
  };
  /** WebSocket configuration */
  websocket?: {
    enabled?: boolean;
    endpoint?: string;
    batching?: {
      enabled?: boolean;
    };
  };
  /** MCP (Model Context Protocol) configuration */
  mcp?: {
    enabled?: boolean;
    port?: number;
    sseEndpoint?: string;
    messagesEndpoint?: string;
    idleTimeout?: number;
  };
  /** tRPC configuration */
  trpc?: {
    endpoint?: string;
    transformer?: typeof superjson;
  };
  /** Logging configuration */
  logging?: {
    requests?: boolean;
    headers?: boolean;
  };
}

interface InternalServerOptions {
  server: {
    port: number;
    cors: {
      origin: string;
      methods: string;
      headers: string;
    };
  };
  websocket: {
    enabled: boolean;
    endpoint: string;
    batching: {
      enabled: boolean;
    };
  };
  mcp: {
    enabled: boolean;
    port: number;
    sseEndpoint: string;
    messagesEndpoint: string;
    idleTimeout: number;
  };
  trpc: {
    endpoint: string;
    transformer: typeof superjson;
  };
  logging: {
    requests: boolean;
    headers: boolean;
  };
}

const defaultOptions: InternalServerOptions = {
  server: {
    port: 3030,
    cors: {
      origin: "*",
      methods: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      headers: "*",
    },
  },
  websocket: {
    enabled: true,
    endpoint: "/events",
    batching: {
      enabled: true,
    },
  },
  mcp: {
    enabled: true,
    port: 3035,
    sseEndpoint: "/sse",
    messagesEndpoint: "/messages",
    idleTimeout: 255,
  },
  trpc: {
    endpoint: "/trpc",
    transformer: superjson,
  },
  logging: {
    requests: false,
    headers: false,
  },
};

function mergeOptions(
  defaults: InternalServerOptions,
  overrides: ServerOptions = {}
): InternalServerOptions {
  return {
    server: {
      port: overrides.server?.port ?? defaults.server.port,
      cors: {
        origin: overrides.server?.cors?.origin ?? defaults.server.cors.origin,
        methods:
          overrides.server?.cors?.methods ?? defaults.server.cors.methods,
        headers:
          overrides.server?.cors?.headers ?? defaults.server.cors.headers,
      },
    },
    websocket: {
      enabled: overrides.websocket?.enabled ?? defaults.websocket.enabled,
      endpoint: overrides.websocket?.endpoint ?? defaults.websocket.endpoint,
      batching: {
        enabled:
          overrides.websocket?.batching?.enabled ??
          defaults.websocket.batching.enabled,
      },
    },
    mcp: {
      enabled: overrides.mcp?.enabled ?? defaults.mcp.enabled,
      port: overrides.mcp?.port ?? defaults.mcp.port,
      sseEndpoint: overrides.mcp?.sseEndpoint ?? defaults.mcp.sseEndpoint,
      messagesEndpoint:
        overrides.mcp?.messagesEndpoint ?? defaults.mcp.messagesEndpoint,
      idleTimeout: overrides.mcp?.idleTimeout ?? defaults.mcp.idleTimeout,
    },
    trpc: {
      endpoint: overrides.trpc?.endpoint ?? defaults.trpc.endpoint,
      transformer: overrides.trpc?.transformer ?? defaults.trpc.transformer,
    },
    logging: {
      requests: overrides.logging?.requests ?? defaults.logging.requests,
      headers: overrides.logging?.headers ?? defaults.logging.headers,
    },
  };
}

class ServerManager {
  private options: InternalServerOptions;
  private mainServer?: Server;
  private mcpServer?: Server;
  private appRouter: any;
  private mcpTransports: Record<string, BunSSEServerTransport> = {};
  private mcpServerInstance?: any;

  constructor(options: InternalServerOptions) {
    this.options = options;
    this.setupTRPC();
  }

  private setupTRPC() {
    this.appRouter = appRouter;
  }

  private createWebSocketHandler() {
    if (!this.options.websocket.enabled) return undefined;

    return createBunWSHandler({
      router: this.appRouter,
      createContext,
      onError: (error) =>
        logger.error(`WebSocket error: ${JSON.stringify(error, null, 2)}`),
      batching: this.options.websocket.batching,
    });
  }

  private async handleMainServerRequest(
    request: Request
  ): Promise<Response | undefined> {
    const url = new URL(request.url);

    if (this.options.logging.requests) {
      logger.info(`${request.method} ${request.url}`);
    }

    if (this.options.logging.headers) {
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        headers[key] = value;
      });
      logger.info(`Headers: ${JSON.stringify(headers, null, 2)}`);
    }

    // Handle CORS preflight
    if (request.method === "HEAD" || request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Methods": this.options.server.cors.methods,
          "Access-Control-Allow-Origin": this.options.server.cors.origin,
          "Access-Control-Allow-Headers": this.options.server.cors.headers,
        },
      });
    }

    // Root endpoint
    if (url.pathname === "/") {
      return new Response("hello world");
    }

    // WebSocket upgrade for events
    if (
      this.options.websocket.enabled &&
      url.pathname === this.options.websocket.endpoint
    ) {
      if (!this.mainServer) {
        return new Response("Server not initialized", { status: 500 });
      }

      const success = this.mainServer.upgrade(request, {
        data: { username: "test", req: request },
      });
      return success
        ? undefined
        : new Response("WebSocket upgrade error", { status: 400 });
    }

    // MCP tunnel WebSocket upgrade
    if (this.options.mcp.enabled && url.pathname === "/mcp-tunnel") {
      if (!this.mainServer) {
        return new Response("Server not initialized", { status: 500 });
      }

      const success = this.mainServer.upgrade(request, {
        data: { username: "test", req: request },
      });
      return success
        ? undefined
        : new Response("WebSocket upgrade error", { status: 400 });
    }

    // tRPC handler
    const response = await fetchRequestHandler({
      endpoint: this.options.trpc.endpoint,
      req: request,
      router: this.appRouter,
      createContext,
    });

    response.headers.append(
      "Access-Control-Allow-Origin",
      this.options.server.cors.origin
    );
    return response;
  }

  private async handleMCPRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (req.method === "GET" && pathname === this.options.mcp.sseEndpoint) {
      logger.debug("Received GET request to SSE endpoint");

      const transport = new BunSSEServerTransport(
        this.options.mcp.messagesEndpoint
      );
      const sessionId = transport.sessionId;
      this.mcpTransports[sessionId] = transport;

      transport.onclose = () => {
        logger.debug(`SSE transport closed for session ${sessionId}`);
        delete this.mcpTransports[sessionId];
      };

      if (this.mcpServerInstance) {
        await this.mcpServerInstance.connect(transport);
        logger.debug(`Established SSE stream with session ID: ${sessionId}`);
      }

      return transport.createResponse();
    }

    if (
      req.method === "POST" &&
      pathname === this.options.mcp.messagesEndpoint
    ) {
      logger.debug("Received POST request to messages endpoint");
      const query = parse(url.searchParams.toString());
      const sessionId = query.sessionId?.toString();

      if (!sessionId) {
        return new Response("Missing sessionId parameter", { status: 400 });
      }

      const transport = this.mcpTransports[sessionId];
      if (!transport) {
        return new Response("Session not found", { status: 404 });
      }

      try {
        return transport.handlePostMessage(req);
      } catch (error) {
        logger.error("Error handling request:", error);
        return new Response("Error handling request", { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  }

  private async initializeMCPServer() {
    if (!this.options.mcp.enabled) return;

    try {
      this.mcpServerInstance = await createServer();

      this.mcpServer = serve({
        port: this.options.mcp.port,
        idleTimeout: this.options.mcp.idleTimeout,
        fetch: (req) => this.handleMCPRequest(req),
        error: (err) => {
          logger.error("MCP Server error:", err);
          return new Response("Internal server error", { status: 500 });
        },
      });

      logger.debug(
        `MCP Server ready at: http://localhost:${this.mcpServer.port}/`
      );
      logger.debug("MCP Server handler initialized");
      logger.debug("Available MCP endpoints:");
      logger.debug(
        `- SSE: ${cyan(
          `http://localhost:${this.mcpServer.port}${this.options.mcp.sseEndpoint}`
        )}`
      );
      logger.debug(
        `- Messages: ${cyan(
          `http://localhost:${this.mcpServer.port}${this.options.mcp.messagesEndpoint}`
        )}`
      );
    } catch (error) {
      logger.error("Failed to initialize MCP server:", error);
      throw error;
    }
  }

  private setupShutdownHandlers() {
    const shutdown = async () => {
      logger.info("Shutting down servers...");

      // Close MCP transports
      for (const sessionId in this.mcpTransports) {
        try {
          await this.mcpTransports[sessionId].close();
          delete this.mcpTransports[sessionId];
        } catch (err) {
          logger.error(`Error closing transport ${sessionId}`, err);
        }
      }

      // Stop servers
      try {
        if (this.mainServer) {
          this.mainServer.stop();
        }
        if (this.mcpServer) {
          this.mcpServer.stop();
        }
      } catch (err) {
        logger.error("Error stopping servers:", err);
      }

      logger.info("Server shutdown complete");
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  async start(): Promise<void> {
    try {
      // Initialize MCP server if enabled
      await this.initializeMCPServer();

      // Create WebSocket handler if enabled
      const websocketHandler = this.createWebSocketHandler();

      // Start main server
      if (websocketHandler) {
        this.mainServer = serve({
          port: this.options.server.port,
          fetch: (request: Request) => this.handleMainServerRequest(request),
          websocket: websocketHandler,
        });
      } else {
        this.mainServer = serve({
          port: this.options.server.port,
          fetch: (request: Request) => this.handleMainServerRequest(request),
        });
      }

      // Setup shutdown handlers
      this.setupShutdownHandlers();

      // Log server information
      logger.debug(
        `Main Server ready at: http://localhost:${this.mainServer.port}/`
      );

      if (this.options.websocket.enabled) {
        logger.debug("WebSocket handler initialized");
      }

      logger.debug("Available endpoints:");
      logger.debug(
        `- HTTP: ${cyan(
          `http://localhost:${this.mainServer.port}${this.options.trpc.endpoint}`
        )}`
      );

      if (this.options.websocket.enabled) {
        logger.debug(
          `- WebSocket: ${cyan(
            `ws://localhost:${this.mainServer.port}${this.options.websocket.endpoint}`
          )}`
        );
      }
    } catch (error) {
      logger.error("Failed to start server:", error);
      throw error;
    }
  }

  getAppRouter() {
    return this.appRouter;
  }

  getServers() {
    return {
      main: this.mainServer,
      mcp: this.mcpServer,
    };
  }
}

export type AppRouter = typeof appRouter;

/**
 * Start the Chara server with optional configuration
 */
export async function startServer(options?: ServerOptions): Promise<{
  manager: ServerManager;
  appRouter: AppRouter;
}> {
  try {
    logger.debug("Starting Chara server...");

    // Merge provided options with defaults
    const finalOptions = mergeOptions(defaultOptions, options);

    // Validate configuration
    const validation = validateConfiguration(finalOptions);
    if (!validation.valid) {
      logger.error("Configuration validation failed:");
      validation.errors.forEach((error) => logger.error(`- ${error}`));
      throw new Error("Invalid server configuration");
    }

    // Create and start server
    const manager = new ServerManager(finalOptions);
    await manager.start();

    logger.debug("Chara server started successfully!");

    // Log configuration info
    if (finalOptions.websocket.enabled) {
      logger.debug("WebSocket support is enabled");
    }
    if (finalOptions.mcp.enabled) {
      logger.debug("MCP (Model Context Protocol) support is enabled");
    }

    return {
      manager,
      appRouter: manager.getAppRouter(),
    };
  } catch (error) {
    logger.error("Failed to start server:", error);
    throw error;
  }
}

/**
 * Validate server configuration
 */
function validateConfiguration(config: InternalServerOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for port conflicts
  if (config.mcp.enabled && config.server.port === config.mcp.port) {
    errors.push("Main server port and MCP server port cannot be the same");
  }

  // Check for valid port ranges
  if (config.server.port < 1024 || config.server.port > 65535) {
    errors.push("Main server port must be between 1024 and 65535");
  }

  if (
    config.mcp.enabled &&
    (config.mcp.port < 1024 || config.mcp.port > 65535)
  ) {
    errors.push("MCP server port must be between 1024 and 65535");
  }

  // Check for valid endpoints
  if (!config.trpc.endpoint.startsWith("/")) {
    errors.push("tRPC endpoint must start with '/'");
  }

  if (config.websocket.enabled && !config.websocket.endpoint.startsWith("/")) {
    errors.push("WebSocket endpoint must start with '/'");
  }

  if (config.mcp.enabled) {
    if (!config.mcp.sseEndpoint.startsWith("/")) {
      errors.push("MCP SSE endpoint must start with '/'");
    }

    if (!config.mcp.messagesEndpoint.startsWith("/")) {
      errors.push("MCP messages endpoint must start with '/'");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Auto-start server if this file is run directly
if (import.meta.main) {
  // Load configuration from environment variables
  const envConfig: ServerOptions = {};

  if (process.env.SERVER_PORT) {
    envConfig.server = { port: parseInt(process.env.SERVER_PORT) };
  }

  if (
    process.env.SERVER_CORS_ORIGIN ||
    process.env.SERVER_CORS_METHODS ||
    process.env.SERVER_CORS_HEADERS
  ) {
    envConfig.server = envConfig.server || {};
    envConfig.server.cors = {
      origin: process.env.SERVER_CORS_ORIGIN,
      methods: process.env.SERVER_CORS_METHODS,
      headers: process.env.SERVER_CORS_HEADERS,
    };
  }

  if (process.env.WEBSOCKET_ENABLED !== undefined) {
    envConfig.websocket = { enabled: process.env.WEBSOCKET_ENABLED === "true" };
  }

  if (process.env.WEBSOCKET_ENDPOINT) {
    envConfig.websocket = envConfig.websocket || {};
    envConfig.websocket.endpoint = process.env.WEBSOCKET_ENDPOINT;
  }

  if (process.env.WEBSOCKET_BATCHING_ENABLED !== undefined) {
    envConfig.websocket = envConfig.websocket || {};
    envConfig.websocket.batching = {
      enabled: process.env.WEBSOCKET_BATCHING_ENABLED === "true",
    };
  }

  if (process.env.MCP_ENABLED !== undefined) {
    envConfig.mcp = { enabled: process.env.MCP_ENABLED === "true" };
  }

  if (process.env.MCP_PORT) {
    envConfig.mcp = envConfig.mcp || {};
    envConfig.mcp.port = parseInt(process.env.MCP_PORT);
  }

  if (process.env.MCP_SSE_ENDPOINT) {
    envConfig.mcp = envConfig.mcp || {};
    envConfig.mcp.sseEndpoint = process.env.MCP_SSE_ENDPOINT;
  }

  if (process.env.MCP_MESSAGES_ENDPOINT) {
    envConfig.mcp = envConfig.mcp || {};
    envConfig.mcp.messagesEndpoint = process.env.MCP_MESSAGES_ENDPOINT;
  }

  if (process.env.MCP_IDLE_TIMEOUT) {
    envConfig.mcp = envConfig.mcp || {};
    envConfig.mcp.idleTimeout = parseInt(process.env.MCP_IDLE_TIMEOUT);
  }

  if (process.env.TRPC_ENDPOINT) {
    envConfig.trpc = { endpoint: process.env.TRPC_ENDPOINT };
  }

  if (process.env.LOGGING_REQUESTS !== undefined) {
    envConfig.logging = { requests: process.env.LOGGING_REQUESTS === "true" };
  }

  if (process.env.LOGGING_HEADERS !== undefined) {
    envConfig.logging = envConfig.logging || {};
    envConfig.logging.headers = process.env.LOGGING_HEADERS === "true";
  }

  await startServer(envConfig);
}
