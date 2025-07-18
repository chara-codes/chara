import { logger } from "@chara-codes/logger";
import {
  createTRPCProxyClient,
  createWSClient,
  wsLink,
  loggerLink,
} from "@trpc/client";
import type { AppRouter } from "@chara-codes/server";
import { applyInstructions } from "../instructions/apply-instructions";
import superjson from "superjson";
import type { ConnectEventsActionOptions } from "./types";

export async function connectEventsAction(
  options: ConnectEventsActionOptions = {}
): Promise<void> {
  if (options.verbose) {
    logger.debug("Connecting to server events via WebSocket...");
  }

  try {
    // Create WebSocket client
    const wsClient = createWSClient({
      url: "ws://localhost:3030/events",
    });

    if (options.verbose) {
      logger.debug("WebSocket client created, establishing tRPC connection...");
    }

    // Create tRPC client with WebSocket link
    const client = createTRPCProxyClient<AppRouter>({
      links: [
        loggerLink(),
        wsLink({
          client: wsClient,
          transformer: superjson,
        }),
      ],
    });

    if (options.verbose) {
      logger.debug("Setting up event subscription...");
    }

    (client.events as any).subscribe(undefined, {
      onData(data: { type: string; data: any }) {
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
      onError(err: Error) {
        logger.error("Subscription error", err);
      },
      onStarted() {
        logger.event("CLI WS client started successfully");
        if (options.verbose) {
          logger.debug("WebSocket event subscription established");
        }
      },
    });

    if (options.verbose) {
      logger.debug("Server events connection completed");
    }
  } catch (error) {
    logger.error("Failed to connect to server events:");
    logger.error((error as Error).message);
    throw new Error(
      `Failed to connect to server events: ${(error as Error).message}`
    );
  }
}
