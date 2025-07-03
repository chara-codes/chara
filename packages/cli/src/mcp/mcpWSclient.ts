import { logger } from "@chara/logger";
import type { AppRouter } from "@chara/server";
import {
  createTRPCProxyClient,
  createWSClient,
  loggerLink,
  wsLink,
} from "@trpc/client";

import {
  CompatibilityCallToolResultSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ListResourceTemplatesResultSchema,
  ListToolsResultSchema,
  ReadResourceResultSchema,
  type ResourceTemplate,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import superjson from "superjson";
import type { z } from "zod";
import { readConfig } from "../config.ts";
import type { ActiveClient } from "../types/index.ts";
import { prepareClients } from "./client.ts";

const CLIENT_ID = "client-123";

const wsClient = createWSClient({
  url: "ws://localhost:3030/mcp-tunnel",
});

// Create tRPC client with WebSocket link
const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    loggerLink(),
    wsLink({
      client: wsClient,
      transformer: superjson,
    }),
  ],
});

class MCPClient {
  private clientsList: ActiveClient[];
  private toolToClientMap: Map<string, ActiveClient>;
  private resourceToClientMap: Map<string, ActiveClient>;
  private promptToClientMap: Map<string, ActiveClient>;

  /**
   * Creates a new MCPClients instance
   */
  constructor() {
    this.toolToClientMap = new Map<string, ActiveClient>();
    this.resourceToClientMap = new Map<string, ActiveClient>();
    this.promptToClientMap = new Map<string, ActiveClient>();
    this.clientsList = [];
  }

  public readConfig = async () => {
    // Load configuration and connect to servers
    const config = await readConfig();
    if (config.mcpServers) {
      this.clientsList = await prepareClients(config.mcpServers);
    }
  };

  public listTools = async (
    command: string,
    params: string,
  ): Promise<Tool[]> => {
    const allTools: Tool[] = [];
    for (const client of this.clientsList) {
      try {
        const result = await client.client.request(
          {
            method: command,
            params: JSON.parse(params),
          },
          ListToolsResultSchema,
        );

        if (result.tools) {
          const toolsWithSource = result.tools.map((tool) => {
            this.toolToClientMap.set(tool.name, client);
            return {
              ...tool,
              description: `[${client.name}] ${tool.description || ""}`,
            };
          });
          allTools.push(...toolsWithSource);
        }
      } catch (error) {
        logger.error(`Error fetching tools from ${client.name}:`, error);
      }
    }
    return allTools;
  };

  public getTool = async (command: string, params: string) => {
    const { name } = JSON.parse(params);
    const client = this.toolToClientMap.get(name);

    if (!client) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      return await client.client.request(
        {
          method: command,
          params: JSON.parse(params),
        },
        CompatibilityCallToolResultSchema,
      );
    } catch (error) {
      logger.error(`Error calling tool through ${name}:`, error);
      throw error;
    }
  };

  public listPrompts = async (command: string, params: string) => {
    const allPrompts: z.infer<typeof ListPromptsResultSchema>["prompts"] = [];
    this.promptToClientMap.clear();

    for (const client of this.clientsList) {
      try {
        const result = await client.client.request(
          {
            method: command,
            params: JSON.parse(params),
          },
          ListPromptsResultSchema,
        );

        if (result.prompts) {
          const promptsWithSource = result.prompts.map((prompt) => {
            this.promptToClientMap.set(prompt.name, client);
            return {
              ...prompt,
              description: `[${client.name}] ${prompt.description || ""}`,
            };
          });
          allPrompts.push(...promptsWithSource);
        }
      } catch (error) {
        logger.error(`Error fetching prompts from ${client.name}:`, error);
      }
    }
    return allPrompts;
  };

  public getPrompt = async (command: string, params: string) => {
    const { name } = JSON.parse(params);
    const client = this.promptToClientMap.get(name);

    if (!client) {
      throw new Error(`Unknown prompt: ${name}`);
    }

    try {
      logger.info("Forwarding prompt request:", name);

      // Match the exact structure from the example code
      const response = await client.client.request(
        {
          method: command,
          params: JSON.parse(params),
        },
        GetPromptResultSchema,
      );

      logger.success("Prompt result:", response);
      return response;
    } catch (error) {
      logger.error(`Error getting prompt from ${name}:`, error);
      throw error;
    }
  };

  public listResources = async (command: string, params: string) => {
    const allResources: z.infer<typeof ListResourcesResultSchema>["resources"] =
      [];
    this.resourceToClientMap.clear();

    for (const client of this.clientsList) {
      try {
        const result = await client.client.request(
          {
            method: command,
            params: JSON.parse(params),
          },
          ListResourcesResultSchema,
        );

        if (result.resources) {
          const resourcesWithSource = result.resources.map((resource) => {
            this.resourceToClientMap.set(resource.uri, client);
            return {
              ...resource,
              name: `[${client.name}] ${resource.name || ""}`,
            };
          });
          allResources.push(...resourcesWithSource);
        }
      } catch (error) {
        logger.error(`Error fetching resources from ${client.name}:`, error);
      }
    }
    return allResources;
  };

  public getResource = async (command: string, params: string) => {
    const { uri } = JSON.parse(params);
    const client = this.resourceToClientMap.get(uri);

    if (!client) {
      throw new Error(`Unknown resource: ${uri}`);
    }

    try {
      return await client.client.request(
        {
          method: command,
          params: JSON.parse(params),
        },
        ReadResourceResultSchema,
      );
    } catch (error) {
      logger.error(`Error reading resource from ${uri}:`, error);
      throw error;
    }
  };

  public listTemplates = async (command: string, params: string) => {
    const allTemplates: ResourceTemplate[] = [];

    for (const client of this.clientsList) {
      try {
        const result = await client.client.request(
          {
            method: command,
            params: JSON.parse(params),
          },
          ListResourceTemplatesResultSchema,
        );

        if (result.resourceTemplates) {
          const templatesWithSource = result.resourceTemplates.map(
            (template) => ({
              ...template,
              name: `[${client.name}] ${template.name || ""}`,
              description: template.description
                ? `[${client.name}] ${template.description}`
                : undefined,
            }),
          );
          allTemplates.push(...templatesWithSource);
        }
      } catch (error) {
        logger.error(
          `Error fetching resource templates from ${client.name}:`,
          error,
        );
      }
    }

    return allTemplates;
  };
}

export const initMCPClient = async (): Promise<void> => {
  const clients = new MCPClient();
  await clients.readConfig();
  // Subscribe to instructions
  trpc.mcpClientsSubscriptions.subscribe(
    { clientId: CLIENT_ID },
    {
      onData: async (instruction) => {
        logger.info("📨 Received instruction:", instruction);
        let response = "";

        switch (instruction.command) {
          case "tools/list": {
            const allTools: Tool[] = await clients.listTools(
              instruction.command,
              instruction.params,
            );
            response = JSON.stringify(allTools);
            break;
          }

          case "tools/call": {
            const toolRes = await clients.getTool(
              instruction.command,
              instruction.params,
            );
            response = JSON.stringify(toolRes);
            break;
          }

          case "prompts/list": {
            const allPrompts = await clients.listPrompts(
              instruction.command,
              instruction.params,
            );
            response = JSON.stringify(allPrompts);
            break;
          }

          case "prompts/get": {
            const promptRes = await clients.getPrompt(
              instruction.command,
              instruction.params,
            );
            response = JSON.stringify(promptRes);
            break;
          }

          case "resources/list": {
            const allResources = await clients.listResources(
              instruction.command,
              instruction.params,
            );
            response = JSON.stringify(allResources);
            break;
          }

          case "resources/read": {
            const resourceObj = await clients.getResource(
              instruction.command,
              instruction.params,
            );
            response = JSON.stringify(resourceObj);
            break;
          }

          case "resources/templates/list": {
            const allTemplates = await clients.listTemplates(
              instruction.command,
              instruction.params,
            );
            response = JSON.stringify(allTemplates);
            break;
          }
        }

        await trpc.mcpResponses.mutate({
          clientId: CLIENT_ID,
          instructionId: instruction.instructionId,
          result: response,
        });
      },

      onError(err: any) {
        logger.error("Subscription error", err);
      },
      onStarted() {
        logger.event("MCP proxy WS client started succesfully");
      },
    },
  );
};
