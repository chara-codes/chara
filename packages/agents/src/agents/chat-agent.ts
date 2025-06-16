import { streamText, type CoreMessage } from "ai";
import { providersRegistry } from "../providers";
import { logger } from "@chara/logger";
import { mcpWrapper } from "../mcp/mcp-client";
import { chatTools } from "../tools";

export const chatAgent = async (
  {
    model,
    messages,
  }: {
    model: string;
    messages: CoreMessage[];
  },
  options: { headers?: Record<string, string> } = {},
) => {
  const [providerName = "openai", modelName = "gpt-4o-mini"] =
    model.split(":::");
  const aiModel = providersRegistry.getModel(providerName, modelName);
  logger.info(providerName, modelName);

  // Always start with local tools
  const mcpTools = mcpWrapper.getToolsSync();
  const allTools = { ...chatTools, ...mcpTools };

  const localCount = Object.keys(chatTools).length;
  const mcpCount = Object.keys(mcpTools).length;
  const total = Object.keys(allTools).length;

  logger.info(`🔧 Using ${total} tools: ${localCount} local + ${mcpCount} MCP`);

  return streamText({
    ...options,
    system: "You are a helpful assistant.",
    tools: allTools,
    model: aiModel,
    toolCallStreaming: true,
    experimental_continueSteps: true,
    maxSteps: 500,
    messages,
  });
};
