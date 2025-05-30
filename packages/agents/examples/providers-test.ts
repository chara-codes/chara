import { logger } from "@chara/logger";
import { providersRegistry } from "../src/providers";
import { streamObject } from "ai";
import z from "zod";

logger.dump(providersRegistry.getProviderStatus());

const model = providersRegistry.getModel("openai", "gpt-4o-mini");

const { partialObjectStream } = streamObject({
  model,
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      story: z.string(),
      ingredients: z.array(z.string()),
      steps: z.array(z.string()),
    }),
  }),
  messages: [
    {
      role: "system",
      content:
        "You are the italian chief in very cool restaurant with 2 michlen stars, answer the question",
    },
    {
      role: "user",
      content: "Suggest receipt for lasania",
    },
  ],
});

for await (const partialObject of partialObjectStream) {
  console.clear();
  logger.dump(partialObject);
}
