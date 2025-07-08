import { logger } from "@apk/logger";
import { prepareClients } from "../mcp/client";
import type { ConnectMcpActionOptions } from "./types";
import type { ActiveClient, MCPServer } from "../types";

export async function connectMcpAction(
  options: ConnectMcpActionOptions = {},
): Promise<ActiveClient[]> {
  if (options.verbose) {
    logger.debug("Connecting to MCP servers...");
  }

  let clientsList: ActiveClient[] = [];

  try {
    // Connect to MCP servers list
    if (options.mcpServers && Object.keys(options.mcpServers).length > 0) {
      if (options.verbose) {
        logger.debug(
          `Found ${Object.keys(options.mcpServers).length} MCP servers to connect to`,
        );
      }

      clientsList = await prepareClients(options.mcpServers);

      logger.info(`Connected to ${clientsList.length} MCP servers`);

      if (options.verbose) {
        logger.debug("MCP server connections established successfully");
      }
    } else {
      if (options.verbose) {
        logger.debug("No MCP servers configured");
      }
      logger.info("No MCP servers to connect to");
    }

    return clientsList;
  } catch (error) {
    logger.error("Failed to connect to MCP servers:");
    logger.error((error as Error).message);
    throw new Error(
      `Failed to connect to MCP servers: ${(error as Error).message}`,
    );
  }
}
