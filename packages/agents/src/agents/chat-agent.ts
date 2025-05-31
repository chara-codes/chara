import { streamText, type CoreMessage } from "ai";
import { providersRegistry } from "../providers";

export const chatAgent = (
  {
    model,
    messages,
  }: {
    model: string;
    messages: CoreMessage[];
  },
  options: { headers?: Record<string, string> },
) => {
  const [providerName = "openai", modelName = "gpt-4o-mini"] =
    model.split(":::");
  const aiModel = providersRegistry.getModel(providerName, modelName);
  return streamText({
    headers: { ...options?.headers },
    model: aiModel,
    toolCallStreaming: true,
    messages: [{ role: "system", content: "Be funny" }, ...messages],
  });
};
