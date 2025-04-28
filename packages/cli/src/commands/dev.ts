import type { CommandModule } from "yargs";
import { readConfig } from "../config";
import { resolve } from "path";
import {
  createTRPCProxyClient,
  createWSClient,
  wsLink,
  httpBatchLink,
  loggerLink,
} from "@trpc/client";
import { cyan, bold } from "picocolors";
import { logger } from "../utils/logger";
import type { AppRouter } from "@chara/server";
import { applyInstructions } from "../instructions/apply-instructions";

interface DevCommandArgs {
  projectDir?: string;
  verbose?: boolean;
  trace?: boolean;
}

async function connectToServerEvents(): Promise<void> {
  // Create WebSocket client
  const wsClient = createWSClient({
    url: "ws://localhost:3030/events",
  });

  // Create tRPC client with WebSocket link
  const client = createTRPCProxyClient<AppRouter>({
    links: [
      loggerLink(),
      wsLink({
        client: wsClient,
      }),
    ],
  });

  client.events.subscribe(undefined, {
    onData(data: any) {
      logger.event("Server event received");

      if (data.type === "instructions_execute") {
        logger.event("Instructions received");
        try {
          applyInstructions(data.data);
        } catch (e) {
          logger.error(e as string);
        }
      }
    },
    onError(err: any) {
      logger.error("Subscription error", err);
    },
    onStarted() {
      logger.event("CLI WS client started succesfully");
    },
  });
}

// Connect to server HTTP endpoints
function createApiClient() {
  return createTRPCProxyClient<any>({
    links: [
      httpBatchLink({
        url: "http://localhost:3030/trpc",
      }),
    ],
  });
}

export const devCommand: CommandModule<{}, DevCommandArgs> = {
  command: "dev",
  describe: "Start development with Chara Codes",
  builder: (yargs) =>
    yargs
      .option("projectDir", {
        describe: "Project root directory",
        type: "string",
        default: process.cwd(),
        alias: "p",
      })
      .option("verbose", {
        describe: "Enable debug logs",
        type: "boolean",
        default: false,
        alias: "v",
      })
      .option("trace", {
        describe: "Enable trace logs (includes debug logs)",
        type: "boolean",
        default: false,
        alias: "t",
      }),
  handler: async (argv) => {
    // Resolve the project directory path
    const projectDir = resolve(argv.projectDir || process.cwd());
    // Set log level based on flags
    if (argv.trace) {
      logger.setLevel("trace");
    } else if (argv.verbose) {
      logger.setLevel("debug");
    } else {
      logger.setLevel("info");
    }

    logger.info(bold(cyan("\n🚀 Starting development with Chara Codes...\n")));

    // Change the current working directory to the project root
    try {
      process.chdir(projectDir);
      logger.info(`Working directory: ${projectDir}`);
    } catch (error) {
      logger.error(`Failed to change to directory: ${projectDir}`);
      logger.error((error as Error).message);
      process.exit(1);
    }

    // Read the config from the project directory
    const config = await readConfig();
    logger.debug("Configuration loaded", config);

    try {
      // Connect to server events via WebSocket
      logger.debug("Connecting to server events...");
      await connectToServerEvents();
      logger.debug("Connected to server events");

      // Initialize API client
      const apiClient = createApiClient();
      logger.debug("API client initialized");

      logger.success("✓ Chara development environment is ready!");
      logger.debug(`API endpoint: ${bold("http://localhost:3030/trpc")}`);
      logger.debug(`WebSocket endpoint: ${bold("ws://localhost:3030/events")}`);
      logger.info(`Press ${bold("Ctrl+C")} to stop\n`);
    } catch (error) {
      logger.error("Failed to initialize development environment:");
      logger.error((error as Error).message);
      process.exit(1);
    }
  },
};
