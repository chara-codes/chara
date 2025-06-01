import { streamText, type CoreMessage } from "ai";
import { providersRegistry } from "../providers";
import { logger } from "@chara/logger";

export const chatAgent = (
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
  return streamText({
    ...options,
    system: "You are a helpful assistant.",
    model: aiModel,
    toolCallStreaming: true,
    messages: [{ role: "system", content: "Be funny" }, ...messages],
  });
};
