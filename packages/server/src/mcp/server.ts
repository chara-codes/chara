import { logger } from "@apk/logger";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  type ListPromptsResultSchema,
  ListResourcesRequestSchema,
  type ListResourcesResultSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type ResourceTemplate,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as eventsource from "eventsource";
import type { z } from "zod";
import { trpcMCPCalls } from "../api/routes/mcpservers";

const CLIENT_ID = "client-123";
global.EventSource = eventsource.EventSource;

export async function handleClientRequest(
  clientId: string,
  command: string,
  params: string,
): Promise<string> {
  const emit = trpcMCPCalls.clients[clientId];

  if (!emit) {
    throw new Error(`Client ${clientId} is not connected.`);
  }

  const instructionId = `tools-${Date.now()}`;

  // Prepare a promise that will resolve when the client responds
  const resultPromise = new Promise<string>((resolve) => {
    trpcMCPCalls.pendingResponses.set(instructionId, resolve);
  });

  // Send instruction
  emit({
    instructionId,
    command: command,
    params: params ?? "",
  });

  // Wait for the response
  const result = await resultPromise;
  return result;
}

export const createServer = async () => {
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

  // List of tools
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    let allTools: Tool[] = [];
    try {
      const params = JSON.stringify({
        _meta: request.params?._meta,
      });
      const response = await handleClientRequest(
        CLIENT_ID,
        "tools/list",
        params,
      );
      allTools = JSON.parse(response);
    } catch (error) {
      console.error("Error fetching tools from:", error);
    }

    return { tools: allTools };
  });

  // Tool call
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    let toolCall = {};
    const { name, arguments: args } = request.params;
    try {
      const params = JSON.stringify({
        name,
        arguments: args || {},
        _meta: {
          progressToken: request.params._meta?.progressToken,
        },
      });
      const response = await handleClientRequest(
        CLIENT_ID,
        "tools/call",
        params,
      );
      toolCall = JSON.parse(response);
    } catch (error) {
      logger.error(`Error calling tool ${name}:`, error);
    }

    return toolCall;
  });

  // List of prompts
  server.setRequestHandler(ListPromptsRequestSchema, async (request) => {
    let allPrompts: z.infer<typeof ListPromptsResultSchema>["prompts"] = [];
    try {
      const params = JSON.stringify({
        cursor: request.params?.cursor,
        _meta: request.params?._meta || {
          progressToken: undefined,
        },
      });
      const response = await handleClientRequest(
        CLIENT_ID,
        "prompts/list",
        params,
      );
      allPrompts = JSON.parse(response);
    } catch (error) {
      logger.error(`Error fetching prompt:`, error);
    }

    return {
      prompts: allPrompts,
      nextCursor: request.params?.cursor,
    };
  });

  // Cal for prompt
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;
    let promptCall = {};
    try {
      logger.info("Forwarding prompt request:", name);
      const params = JSON.stringify({
        name,
        arguments: request.params.arguments || {},
        _meta: request.params._meta || {
          progressToken: undefined,
        },
      });
      const response = await handleClientRequest(
        CLIENT_ID,
        "prompts/get",
        params,
      );
      promptCall = JSON.parse(response);
      logger.success("Prompt result:", response);
    } catch (error) {
      logger.error(`Error getting prompt ${name}:`, error);
      throw error;
    }
    return promptCall;
  });

  // List of resources
  server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
    let allResources: z.infer<typeof ListResourcesResultSchema>["resources"] =
      [];
    try {
      const params = JSON.stringify({
        cursor: request.params?.cursor,
        _meta: request.params?._meta,
      });
      const response = await handleClientRequest(
        CLIENT_ID,
        "resources/list",
        params,
      );
      allResources = JSON.parse(response);
    } catch (error) {
      logger.error(`Error fetching resources:`, error);
    }

    return {
      resources: allResources,
      nextCursor: request.params?.cursor,
    };
  });

  // Read resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    try {
      const params = JSON.stringify({
        uri,
        _meta: request.params._meta,
      });
      const response = await handleClientRequest(
        CLIENT_ID,
        "resources/read",
        params,
      );
      return JSON.parse(response);
    } catch (error) {
      logger.error(`Error reading resource:`, error);
      throw error;
    }
  });

  // List resource templates
  server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async (request) => {
      let allTemplates: ResourceTemplate[] = [];
      try {
        const params = JSON.stringify({
          cursor: request.params?.cursor,
          _meta: request.params?._meta || {
            progressToken: undefined,
          },
        });
        const response = await handleClientRequest(
          CLIENT_ID,
          "resources/templates/list",
          params,
        );
        allTemplates = JSON.parse(response);
      } catch (error) {
        logger.error(`Error fetching resource templates:`, error);
      }

      return {
        resourceTemplates: allTemplates,
        nextCursor: request.params?.cursor,
      };
    },
  );

  return server;
};
