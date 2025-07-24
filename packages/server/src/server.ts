import { logger } from "@chara-codes/logger";
import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type Server, serve } from "bun";
import { cyan } from "picocolors";
import superjson from "superjson";

import { type Context, createContext } from "./api/context";
import { chatRouter } from "./api/routes/chat";
import { filesRouter } from "./api/routes/files";
import { instructionsRouter } from "./api/routes/instructions";
import { linksRouter } from "./api/routes/links";
import { messagesRouter } from "./api/routes/messages";

import { stacksRouter } from "./api/routes/stacks";
import { subscription } from "./api/routes/subscription";

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
  private appRouter: any;

  constructor(options: InternalServerOptions) {
    this.options = options;
    this.setupTRPC();
  }

  private setupTRPC() {
    this.appRouter = appRouter;
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

  private setupShutdownHandlers() {
    const shutdown = async () => {
      logger.info("Shutting down servers...");

      // Stop servers
      try {
        if (this.mainServer) {
          this.mainServer.stop();
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
      // Start main server
      this.mainServer = serve({
        port: this.options.server.port,
        fetch: (request: Request) => this.handleMainServerRequest(request),
      });

      // Setup shutdown handlers
      this.setupShutdownHandlers();

      // Log server information
      logger.debug(
        `Main Server ready at: http://localhost:${this.mainServer.port}/`
      );

      logger.debug("Available endpoints:");
      logger.debug(
        `- HTTP: ${cyan(
          `http://localhost:${this.mainServer.port}${this.options.trpc.endpoint}`
        )}`
      );
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

  // Check for valid port ranges
  if (config.server.port < 1024 || config.server.port > 65535) {
    errors.push("Main server port must be between 1024 and 65535");
  }

  // Check for valid endpoints
  if (!config.trpc.endpoint.startsWith("/")) {
    errors.push("tRPC endpoint must start with '/'");
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
