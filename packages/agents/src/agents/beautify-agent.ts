import { logger } from "@chara-codes/logger";
import { type CoreMessage, streamText } from "ai";
import { providersRegistry } from "../providers";

export const beautifyAgent = async (
  {
    model,
    messages,
  }: {
    model: string;
    messages: CoreMessage[];
  },
  options: { headers?: Record<string, string> } = {}
) => {
  const [providerName = "openai", modelName = "gpt-4o-mini"] =
    model.split(":::");
  const aiModel = await providersRegistry.getModel(providerName, modelName);

  return streamText({
    ...options,
    model: aiModel,
    messages: [
      {
        role: "system",
        content:
          "Use previous messages and the current user prompt to generate a better, implementation-focused answer. Limit the response to 300 symbols, make it actionable for development, and use plain text only. Prioritize clarity and practical instructions.",
      },
      ...messages,
    ],
    onError: (err) => {
      logger.dump(err);
    },
    // experimental_telemetry: {
    //   isEnabled: true,
    //   tracer: getTracer(),
    //   metadata: {
    //     agent: "beautify",
    //     provider: providerName,
    //     model: modelName,
    //   },
    // },
  });
};
