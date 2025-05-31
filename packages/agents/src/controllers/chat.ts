import type { CoreMessage } from "ai";
import { chatAgent } from "../agents/chat-agent";

export const chatController = {
  POST: async (req: Request) => {
    const { model, messages } = (await req.json()) as {
      model: string;
      messages: CoreMessage[];
    };
    const result = chatAgent(
      {
        model,
        messages,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
    return result.toDataStreamResponse();
  },
};
