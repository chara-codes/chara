import { generateText, type CoreMessage } from "ai";
import { providersRegistry } from "../providers";

export const gitAgent = (
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

  return generateText({
    ...options,
    system:
      "You are a helpful assistant, the main goal is make a commit message.",
    model: aiModel,
    messages: [
      ...messages,
      {
        role: "system",
        content:
          "Use previous messages and the current user prompt commit of changes, use maximum 200 symbols.",
      },
    ],
  });
};
