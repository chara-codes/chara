import { logger } from "@chara-codes/logger";
import { streamText, type CoreMessage } from "ai";
import { chatPrompt } from "../prompts/chat";
import { providersRegistry } from "../providers";
import { chatToolsAskMode, chatToolsWriteMode } from "../tools/chat-tools";

/**
 * Cleans messages by removing toolCall tags like [toolCall:call_id,tool-name]
 *
 * These tags are sometimes added by UI components or other parts of the system
 * to track tool calls, but they should not be sent to the AI model as they
 * can confuse the model or interfere with its responses.
 *
 * @param messages - Array of CoreMessage objects to clean
 * @returns Array of CoreMessage objects with toolCall tags removed from string content
 *
 * @example
 * ```ts
 * const messages = [
 *   { role: "user", content: "Hello [toolCall:call_123,edit-file] world" }
 * ];
 * const cleaned = cleanMessages(messages);
 * // Result: [{ role: "user", content: "Hello  world" }]
 * ```
 */
export const cleanMessages = (messages: CoreMessage[]): CoreMessage[] => {
  return messages.map((message) => {
    if (typeof message.content === "string") {
      // Remove toolCall tags using regex
      const cleanedContent = message.content.replace(
        /\[toolCall:[^\]]+\]/g,
        ""
      );
      return {
        ...message,
        content: cleanedContent,
      } as CoreMessage;
    }
    return message;
  });
};

/**
 * Main chat agent function that processes messages and returns a streaming response
 *
 * @param config - Configuration object containing model, messages, mode, and workingDir
 * @param options - Optional configuration like headers
 * @returns StreamText result for processing the chat
 */
export const chatAgent = async (
  {
    model,
    messages,
    mode,
    workingDir = process.cwd(),
    tools = {},
    onFinish,
  }: {
    model: string;
    messages: CoreMessage[];
    mode: "write" | "ask";
    workingDir: string;
    tools?: Record<string, any>;
    onFinish: (result: any) => {};
  },
  options: { headers?: Record<string, string> } = {}
) => {
  const [providerName = "openai", modelName = "gpt-4o-mini"] =
    model.split(":::");
  const aiModel = await providersRegistry.getModel(providerName, modelName);

  const total = Object.keys(tools).length;
  logger.debug(`🔧 Using ${total} tools provided by the controller.`);

  // Clean messages before sending to AI model to remove any toolCall tags
  // that might interfere with model responses or cause confusion
  const cleanedMessages = cleanMessages(messages);

  return streamText({
    ...options,
    system: chatPrompt({
      hasTools: !!total,
      hasTool: (toolName: string) => Object.keys(tools).includes(toolName),
      mode,
      workingDir,
    }),
    tools: tools,
    model: aiModel,
    temperature: 0.5,
    toolCallStreaming: true,
    experimental_continueSteps: true,
    maxSteps: 99,
    messages: cleanedMessages,
    onFinish: (result) => {
      onFinish(result);
    },
  });
};
