import type { UIMessage } from "ai";
import { convertToModelMessages, generateId } from "ai";
import { beautifyAgent } from "../agents/beautify-agent";
import { logger } from "../utils/logger";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const beautifyController = {
  OPTIONS: () => new Response("", { headers: CORS_HEADERS }),

  POST: async (req: Request) => {
    try {
      const { messages, model, id, text } = await req.json();
      console.log(text);
      if (!model) {
        return new Response(
          JSON.stringify({
            error: "Missing required field: model",
          }),
          {
            status: 400,
            headers: {
              ...CORS_HEADERS,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Handle different payload formats
      let uiMessages: UIMessage[];

      if (messages && Array.isArray(messages)) {
        // Convert messages to UIMessage format (same as chat controller)
        uiMessages = messages.map((msg: any) => {
          if (msg.parts) {
            // Already in UIMessage format
            return msg as UIMessage;
          } else {
            // Convert from simple {role, content} format to UIMessage format
            return {
              id: msg.id || generateId(),
              role: msg.role,
              parts: [{ type: "text" as const, text: msg.content || "" }],
            } as UIMessage;
          }
        });
      } else {
        return new Response(
          JSON.stringify({
            error: "Missing required field: messages or text",
          }),
          {
            status: 400,
            headers: {
              ...CORS_HEADERS,
              "Content-Type": "application/json",
            },
          }
        );
      }

      try {
        const modelMessages = convertToModelMessages(uiMessages);
        // Start beautify agent
        const result = await beautifyAgent({
          model,
          messages: modelMessages,
        });

        // Return the streaming response using AI SDK's toUIMessageStreamResponse
        return result.toUIMessageStreamResponse({
          headers: CORS_HEADERS,
          originalMessages: uiMessages,
          generateMessageId: () => generateId(),
          onFinish: async ({ messages: finalMessages }) => {
            logger.debug("Beautify completed:", {
              originalLength: uiMessages.length,
              finalLength: finalMessages.length,
              model,
            });
          },
        });
      } catch (error) {
        logger.error("Beautify agent error:", error);
        throw error;
      }
    } catch (error) {
      logger.error("Beautify controller error:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return new Response(
        JSON.stringify({
          error: errorMessage,
          code: "BEAUTIFY_ERROR",
        }),
        {
          status: 500,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
          },
        }
      );
    }
  },
};
