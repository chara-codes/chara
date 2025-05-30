import { streamText } from "ai";
import { providersRegistry } from "../providers";

export const beautifyController = {
  async POST(req: Request) {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const { messages } = (await req.json()) as { messages: any };

    const result = streamText({
      model: providersRegistry.getModel("ollama", "qwen3:latest"),
      system: "You are a helpful assistant.",
      messages,
    });

    return result.toDataStreamResponse();
  },
};
