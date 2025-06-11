import { createDataStreamResponse, type CoreMessage } from "ai";
import { chatAgent } from "../agents/chat-agent";
import { logger } from "@chara/logger";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const chatController = {
  OPTIONS: () => new Response("", { headers: CORS_HEADERS }),
  POST: async (req: Request) => {
    const { model, messages } = (await req.json()) as {
      model: string;
      messages: CoreMessage[];
    };

    return createDataStreamResponse({
      headers: { ...CORS_HEADERS, "accept-encoding": "" },
      execute: async (dataStream) => {
        const result = await chatAgent({
          model,
          messages,
        });
        result.mergeIntoDataStream(dataStream);
      },
      onError: (error) => {
        logger.dump(error);
        // Error messages are masked by default for security reasons.
        // If you want to expose the error message to the client, you can do so here:
        return error instanceof Error ? error.message : String(error);
      },
    });
  },
};
