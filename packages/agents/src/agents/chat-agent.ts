import { StreamData, streamText, tool, type CoreMessage } from "ai";
import { providersRegistry } from "../providers";
import { logger } from "@chara/logger";
import { mcpWrapper } from "../mcp/mcp-client";

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
  const tools = mcpWrapper.getTools();
  logger.dump(tools);
  logger.info(`Using ${Object.keys(tools).length} tools for chat`);

  return streamText({
    ...options,
    system: "You are a helpful assistant.",
    tools,
    model: aiModel,
    toolCallStreaming: true,
    maxSteps: 10,
    messages: [{ role: "system", content: "Be funny" }, ...messages],
  });
};
