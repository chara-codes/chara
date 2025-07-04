import { createDataStreamResponse, type CoreMessage } from "ai";
import { beautifyAgent } from "../agents/beautify-agent";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
export const beautifyController = {
  OPTIONS: () => new Response("", { headers: CORS_HEADERS }),
  async POST(req: Request) {
    const { model, messages } = (await req.json()) as {
      model: string;
      messages: CoreMessage[];
    };

    return createDataStreamResponse({
      headers: CORS_HEADERS,
      execute: async (dataStream) => {
        const result = await beautifyAgent({
          model,
          messages,
        });
        result.mergeIntoDataStream(dataStream);
      },
    });
  },
};
