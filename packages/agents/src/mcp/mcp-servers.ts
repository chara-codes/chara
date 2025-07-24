import { logger } from "@chara-codes/logger";
import {
  experimental_createMCPClient,
  type MCPClient,
  type MCPTransport,
} from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import { z } from "zod";

// Schema for command-based (stdio) server configuration
const commandServerSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  enabled: z.boolean().default(true),
});

// Schema for URL-based (sse) server configuration
const urlServerSchema = z.object({
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  enabled: z.boolean().default(true),
});

// The configuration for a single server is a union of the two types
const mcpServerSchema = z.union([commandServerSchema, urlServerSchema]);

// The overall config is a record of these server schemas
export const mcpServersConfigSchema = z.record(mcpServerSchema);

export type McpServerConfig = z.infer<typeof mcpServerSchema>;
export type McpServersConfig = z.infer<typeof mcpServersConfigSchema>;

const mcpClients: MCPClient[] = [];
let mcpInitializationState: "idle" | "initializing" | "done" | "error" = "idle";

/**
 * Initializes tools from all configured MCP servers using the Vercel AI SDK.
 * @param mcpConfig The MCP servers configuration
 * @returns A record of AI SDK tools
 */
export async function initializeMcpTools(
  mcpConfig: McpServersConfig
): Promise<Record<string, any>> {
  mcpInitializationState = "initializing";
  let allTools: Record<string, any> = {};

  for (const serverName in mcpConfig) {
    const serverConfig = mcpConfig[serverName];

    // if (!serverConfig.enabled) {
    //   logger.warn(`MCP server "${serverName}" is disabled, skipping.`);
    //   continue;
    // }

    try {
      logger.info(`🔧 Connecting to MCP server: ${serverName}...`);

      let transport: MCPTransport;

      if ("command" in serverConfig) {
        logger.debug(`  -> Using stdio transport for ${serverName}`);
        transport = new Experimental_StdioMCPTransport({
          command: serverConfig.command,
          args: serverConfig.args,
          env: serverConfig.env,
        });
      } else if ("url" in serverConfig) {
        logger.debug(`  -> Using sse transport for ${serverName}`);
        transport = {
          type: "sse",
          url: serverConfig.url,
          headers: serverConfig.headers,
        };
      } else {
        logger.warning(
          `⚠️ Invalid configuration for MCP server "${serverName}", skipping.`
        );
        continue;
      }

      const client = await experimental_createMCPClient({ transport });
      mcpClients.push(client);

      const tools = await client.tools();
      logger.info(
        `✅ Fetched ${Object.keys(tools).length} tools from ${serverName}`
      );

      const prefixedTools = Object.fromEntries(
        Object.entries(tools).map(([toolName, tool]) => [
          `${serverName}_${toolName}`,
          tool,
        ])
      );

      allTools = { ...allTools, ...prefixedTools };
    } catch (error) {
      logger.warning(
        `⚠️ Failed to initialize or fetch tools from ${serverName}:`,
        error
      );
      mcpInitializationState = "error";
    }
  }

  if (mcpInitializationState !== "error") {
    mcpInitializationState = "done";
  }
  return allTools;
}

/**
 * Closes all active MCP client connections.
 */
export async function closeMcpClients(): Promise<void> {
  if (mcpClients.length > 0) {
    logger.debug(`Closing ${mcpClients.length} MCP clients...`);
    await Promise.all(mcpClients.map((client) => client.close()));
    mcpClients.length = 0;
  }
  mcpInitializationState = "idle";
}

/**
 * Gets the status of the MCP clients.
 * @returns An object with the connection status.
 */
export function getMcpClientStatus() {
  return {
    initializationState: mcpInitializationState,
    isConnected: mcpClients.length > 0,
    connectedClients: mcpClients.length,
  };
}
