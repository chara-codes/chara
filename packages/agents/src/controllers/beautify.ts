import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type ModelMessage,
} from "ai";
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
      messages: ModelMessage[];
    };

    return createUIMessageStreamResponse({
      headers: CORS_HEADERS,
      stream: createUIMessageStream({
        execute: async ({ writer }) => {
          const result = await beautifyAgent({
            model,
            messages,
          });
          writer.merge(result.toUIMessageStream());
        },
      }),
    });
  },
};
