import { StreamData, streamText, tool, type CoreMessage } from "ai";
import { providersRegistry } from "../providers";
import { logger } from "@chara/logger";
import z from "zod";

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

  // const data = new StreamData();

  return streamText({
    ...options,
    system: "You are a helpful assistant.",
    tools: {
      weather: tool({
        description: "Get the weather in a location",
        parameters: z.object({
          location: z.string().describe("The location to get the weather for"),
        }),
        execute: async ({ location }) => ({
          location,
          temperature: 72 + Math.floor(Math.random() * 21) - 10,
        }),
      }),
    },
    model: aiModel,
    toolCallStreaming: true,
    maxSteps: 10,
    messages: [{ role: "system", content: "Be funny" }, ...messages],
  });
};
