import { logger } from "@chara/logger";
import { type CoreMessage, streamText } from "ai";
import { mcpWrapper } from "../mcp/mcp-client";
import { providersRegistry } from "../providers";
import { chatToolsAskMode, chatToolsWriteMode } from "../tools/chat-tools";
import { chatPrompt } from "../prompts/chat";

export const chatAgent = async (
  {
    model,
    messages,
    mode,
    workingDir = process.cwd(),
  }: {
    model: string;
    messages: CoreMessage[];
    mode: "write" | "ask";
    workingDir: string;
  },
  options: { headers?: Record<string, string> } = {},
) => {
  const [providerName = "openai", modelName = "gpt-4o-mini"] =
    model.split(":::");
  const aiModel = await providersRegistry.getModel(providerName, modelName);

  // Always start with local tools
  const mcpTools = mcpWrapper.getToolsSync();
  const chatTools = mode === "write" ? chatToolsWriteMode : chatToolsAskMode;
  const allTools = { ...chatTools, ...mcpTools };

  const localCount = Object.keys(chatTools).length;
  const mcpCount = Object.keys(mcpTools).length;
  const total = Object.keys(allTools).length;
  logger.debug(
    `🔧 Using ${total} tools: ${localCount} local + ${mcpCount} MCP`,
  );

  return streamText({
    ...options,
    system: chatPrompt({
      hasTools: !!total,
      hasTool: (toolName: string) => Object.keys(allTools).includes(toolName),
      mode,
      workingDir,
    }),
    tools: allTools,
    model: aiModel,
    toolCallStreaming: true,
    experimental_continueSteps: true,
    maxSteps: 500,
    messages,
  });
};
