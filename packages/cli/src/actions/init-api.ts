import { logger } from "@apk/logger";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { InitApiActionOptions } from "./types";

export async function initApiAction(
  options: InitApiActionOptions = {},
): Promise<any> {
  if (options.verbose) {
    logger.debug("Initializing API client...");
  }

  try {
    // Connect to server HTTP endpoints
    const apiClient = createTRPCProxyClient<any>({
      links: [
        httpBatchLink({
          url: "http://localhost:3030/trpc",
          transformer: superjson,
        }),
      ],
    });

    if (options.verbose) {
      logger.debug("API client initialized successfully");
      logger.debug("API endpoint: http://localhost:3030/trpc");
    }

    return apiClient;
  } catch (error) {
    logger.error("Failed to initialize API client:");
    logger.error((error as Error).message);
    throw new Error(
      `Failed to initialize API client: ${(error as Error).message}`,
    );
  }
}
