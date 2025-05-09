import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type Tool,
  ListToolsResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ReadResourceResultSchema,
  ListResourceTemplatesRequestSchema,
  ListResourceTemplatesResultSchema,
  type ResourceTemplate,
  CompatibilityCallToolResultSchema,
  GetPromptResultSchema
} from "@modelcontextprotocol/sdk/types.js";
import { prepareClients } from './client.ts';
import type { ActiveClient } from "../types/index.ts";
import { logger } from "../utils/logger";
import { readConfig } from '../config.ts';
import { z } from 'zod';
import * as eventsource from 'eventsource';

global.EventSource = eventsource.EventSource

export const createServer = async () => {
  // Load configuration and connect to servers
  const config = await readConfig();
  let clientsList: ActiveClient[] = [];
  if (config.mcpServers) {
    clientsList = await prepareClients(config.mcpServers);
  }
  logger.info(`Connected to ${clientsList.length} servers`);

  // Maps to track which client owns which resource
  const toolToClientMap = new Map<string, ActiveClient>();
  const resourceToClientMap = new Map<string, ActiveClient>();
  const promptToClientMap = new Map<string, ActiveClient>();

  const server = new Server(
    {
      name: "chara-proxy-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        prompts: {},
        resources: { subscribe: true },
        tools: {},
      },
    },
  );

  // List Tools Handler
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    const allTools: Tool[] = [];
    toolToClientMap.clear();

    for (const client of clientsList) {
      try {
        const result = await client.client.request(
          {
            method: 'tools/list',
            params: {
              _meta: request.params?._meta
            }
          },
          ListToolsResultSchema
        );

        if (result.tools) {
          const toolsWithSource = result.tools.map(tool => {
            toolToClientMap.set(tool.name, client);
            return {
              ...tool,
              description: `[${client.name}] ${tool.description || ''}`
            };
          });
          allTools.push(...toolsWithSource);
        }
      } catch (error) {
        logger.error(`Error fetching tools from ${client.name}:`, error);
      }
    }

    return { tools: allTools };
  });

  // Call Tool Handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const clientForTool = toolToClientMap.get(name);

    if (!clientForTool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      logger.info('Forwarding tool call:', name);

      // Use the correct schema for tool calls
      return await clientForTool.client.request(
        {
          method: 'tools/call',
          params: {
            name,
            arguments: args || {},
            _meta: {
              progressToken: request.params._meta?.progressToken
            }
          }
        },
        CompatibilityCallToolResultSchema
      );
    } catch (error) {
      logger.error(`Error calling tool through ${clientForTool.name}:`, error);
      throw error;
    }
  });

  // List Prompts Handler
  server.setRequestHandler(ListPromptsRequestSchema, async (request) => {
    const allPrompts: z.infer<typeof ListPromptsResultSchema>['prompts'] = [];
    promptToClientMap.clear();

    for (const client of clientsList) {
      try {
        const result = await client.client.request(
          {
            method: 'prompts/list' as const,
            params: {
              cursor: request.params?.cursor,
              _meta: request.params?._meta || {
                progressToken: undefined
              }
            }
          },
          ListPromptsResultSchema
        );

        if (result.prompts) {
          const promptsWithSource = result.prompts.map(prompt => {
            promptToClientMap.set(prompt.name, client);
            return {
              ...prompt,
              description: `[${client.name}] ${prompt.description || ''}`
            };
          });
          allPrompts.push(...promptsWithSource);
        }
      } catch (error) {
        logger.error(`Error fetching prompts from ${client.name}:`, error);
      }
    }

    return {
      prompts: allPrompts,
      nextCursor: request.params?.cursor
    };
  });

  // Get Prompt Handler
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;
    const clientForPrompt = promptToClientMap.get(name);

    if (!clientForPrompt) {
      throw new Error(`Unknown prompt: ${name}`);
    }

    try {
      logger.info('Forwarding prompt request:', name);

      // Match the exact structure from the example code
      const response = await clientForPrompt.client.request(
        {
          method: 'prompts/get' as const,
          params: {
            name,
            arguments: request.params.arguments || {},
            _meta: request.params._meta || {
              progressToken: undefined
            }
          }
        },
        GetPromptResultSchema
      );

      logger.success('Prompt result:', response);
      return response;
    } catch (error) {
      logger.error(`Error getting prompt from ${clientForPrompt.name}:`, error);
      throw error;
    }
  });

  // List Resources Handler
  server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
    const allResources: z.infer<typeof ListResourcesResultSchema>['resources'] = [];
    resourceToClientMap.clear();

    for (const client of clientsList) {
      try {
        const result = await client.client.request(
          {
            method: 'resources/list',
            params: {
              cursor: request.params?.cursor,
              _meta: request.params?._meta
            }
          },
          ListResourcesResultSchema
        );

        if (result.resources) {
          const resourcesWithSource = result.resources.map(resource => {
            resourceToClientMap.set(resource.uri, client);
            return {
              ...resource,
              name: `[${client.name}] ${resource.name || ''}`
            };
          });
          allResources.push(...resourcesWithSource);
        }
      } catch (error) {
        logger.error(`Error fetching resources from ${client.name}:`, error);
      }
    }

    return {
      resources: allResources,
      nextCursor: undefined
    };
  });

  // Read Resource Handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const clientForResource = resourceToClientMap.get(uri);

    if (!clientForResource) {
      throw new Error(`Unknown resource: ${uri}`);
    }

    try {
      return await clientForResource.client.request(
        {
          method: 'resources/read',
          params: {
            uri,
            _meta: request.params._meta
          }
        },
        ReadResourceResultSchema
      );
    } catch (error) {
      logger.error(`Error reading resource from ${clientForResource.name}:`, error);
      throw error;
    }
  });

  // List Resource Templates Handler
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async (request) => {
    const allTemplates: ResourceTemplate[] = [];

    for (const client of clientsList) {
      try {
        const result = await client.client.request(
          {
            method: 'resources/templates/list' as const,
            params: {
              cursor: request.params?.cursor,
              _meta: request.params?._meta || {
                progressToken: undefined
              }
            }
          },
          ListResourceTemplatesResultSchema
        );

        if (result.resourceTemplates) {
          const templatesWithSource = result.resourceTemplates.map(template => ({
            ...template,
            name: `[${client.name}] ${template.name || ''}`,
            description: template.description ? `[${client.name}] ${template.description}` : undefined
          }));
          allTemplates.push(...templatesWithSource);
        }
      } catch (error) {
        logger.error(`Error fetching resource templates from ${client.name}:`, error);
      }
    }

    return {
      resourceTemplates: allTemplates,
      nextCursor: request.params?.cursor
    };
  });

  const cleanup = async () => {
    await Promise.all(clientsList.map(({ cleanup }) => cleanup()));
  };

  return { server, cleanup };
};