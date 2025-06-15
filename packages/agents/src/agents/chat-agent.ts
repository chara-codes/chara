import { streamText, type CoreMessage } from "ai";
import { providersRegistry } from "../providers";
import { logger } from "@chara/logger";
import { mcpWrapper } from "../mcp/mcp-client";
import { chatTools } from "../tools/chat-tools";
import { chatPrompt } from "../prompts/chat";

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

  // Get ready tools from MCP wrapper (already initialized)
  logger.info(`Using ${Object.keys(chatTools).length} tools for chat`);

  return streamText({
    ...options,
    system: chatPrompt({
      hasTools: !!Object.keys(chatTools).length,
      hasTool: (name) => Object.keys(chatTools).includes(name),
    }),
    tools: {
      // ...mcpWrapper.getTools(),
      ...chatTools,
    },
    model: aiModel,
    toolCallStreaming: true,
    experimental_continueSteps: true,
    maxSteps: 500,
    messages,
  });
};
