import { streamText, type CoreMessage } from "ai";
import { providersRegistry } from "../providers";

export const beautifyAgent = (
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

  return streamText({
    ...options,
    system:
      "You are a helpful assistant, the main goal is beautify users prompts.",
    model: aiModel,
    messages: [
      {
        role: "system",
        content:
          "Use previous messages and the current user prompt to generate a better, implementation-focused answer. Limit the response to 300 symbols, make it actionable for development, and use plain text only. Prioritize clarity and practical instructions.",
      },
      ...messages,
    ],
  });
};
