import { type CoreMessage, generateText } from "ai";
import { providersRegistry } from "../providers";

export const gitAgent = async (
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
  const aiModel = await providersRegistry.getModel(providerName, modelName);

  return generateText({
    ...options,
    system:
      "You are a helpful assistant, the main goal is make a commit message. Use previous messages and the current user prompt commit of changes, use maximum 200 symbols.",
    model: aiModel,
    messages: [...messages],
  });
};
