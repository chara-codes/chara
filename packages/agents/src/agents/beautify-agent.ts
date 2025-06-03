import { streamText, type CoreMessage } from "ai";
import { providersRegistry } from "../providers";
import { logger } from "@chara/logger";

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
          "Use previous messages and current user prompt and improve it. Focus on development aspects, make answer up to 300 symbols and clear for implement. Use plain text for the generated message.",
      },
      ...messages,
    ],
  });
};
