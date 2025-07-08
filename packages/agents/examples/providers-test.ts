import { logger } from "@apk/logger";
import {
  generateText,
  StreamData,
  streamText,
  tool,
  type LanguageModelV1,
} from "ai";
import { parseArgs } from "node:util";
import z from "zod";
import { providersRegistry } from "../src/providers";

const { values } = parseArgs({
  // args: Bun.argv,
  options: {
    model: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: false,
});

function initModel(m: string | undefined): LanguageModelV1 {
  const model = (m || "").toLowerCase();
  switch (model) {
    case "ollama":
      return providersRegistry.getModel(model, "qwen3:latest");
    case "groq":
      return providersRegistry.getModel(model, "llama-3.1-8b-instant");
    case "openrouter":
      return providersRegistry.getModel(model, "anthropic/claude-sonnet-4");
    case "mistral":
      return providersRegistry.getModel(model, "devstral-small-2505");
    default:
      return providersRegistry.getModel("openai", "o1-mini");
  }
}

const model = initModel(values?.model);
// logger.dump(model);
// const model = providersRegistry.getModel("groq", "llama-3.1-8b-instant");
// const model = providersRegistry.getModel("ollama", "deepseek-r1:14b");
// const model = providersRegistry.getModel("openai", "gpt-4.1-nano");
const data = new StreamData();

const result = streamText({
  model,
  maxSteps: 5, // allow up to 5 steps
  tools: {
    weather: tool({
      description: "Get the weather in a location",
      parameters: z.object({
        location: z.string().describe("The location to get the weather for"),
      }),
      execute: async ({ location }, { toolCallId }) => {
        logger.dump(toolCallId);
        data.appendMessageAnnotation({
          type: "tool-status",
          toolCallId,
          status: "in-progress",
        });
        return {
          location,
          temperature: Math.floor(Math.random() * 21) - 10,
        };
      },
    }),
  },
  toolChoice: "required",
  onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
    logger.dump({ text, toolCalls, toolResults, finishReason, usage });
  },
  messages: [
    {
      role: "system",
      content:
        "Choose and call right tools to answer the users question. You the synoptic, please provide professional information about the weather, it should include current weather and weather forecast.",
    },
    {
      role: "user",
      content: "What is the weather in Durres?",
    },
  ],
});

const res = result.toDataStream({ data });
for await (const chunk of res) {
  logger.dump(chunk);
}
