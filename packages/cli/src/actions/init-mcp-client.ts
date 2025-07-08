import { logger } from "@chara-codes/logger";
import { initMCPClient } from "../mcp/mcp-ws-client";
import type { InitMcpClientActionOptions } from "./types";

export async function initMcpClientAction(
  options: InitMcpClientActionOptions = {}
): Promise<void> {
  if (options.verbose) {
    logger.debug("Initializing MCP client...");
  }

  try {
    await initMCPClient();

    if (options.verbose) {
      logger.debug("MCP client initialized successfully");
    }
  } catch (error) {
    logger.error("Failed to initialize MCP client:");
    logger.error((error as Error).message);
    throw new Error(
      `Failed to initialize MCP client: ${(error as Error).message}`
    );
  }
}
