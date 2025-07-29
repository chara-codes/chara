import { logger } from "@chara-codes/logger";
import { generateText, type CoreMessage } from "ai";
import {
  parseSuggestionsFromResponse,
  suggestionAgent,
} from "../agents/suggestion-agent";
import { isoGitService } from "../services/isogit";
import { trpc } from "../services/trpc";
import { mapMessages } from "../utils";

let mcpTools: Record<string, unknown> = {};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const suggestController = {
  setTools: (newTools: Record<string, unknown>) => {
    mcpTools = newTools;
  },
  OPTIONS: () => new Response("", { headers: CORS_HEADERS }),
  POST: async (req: Request) => {
    const data = await req.json();
    const { model, messages, userMessageId } = data as {
      model: string;
      messages: CoreMessage[];
      userMessageId?: number;
    };
    const url = new URL(req.url);
    const maxSuggestions = parseInt(
      url.searchParams.get("maxSuggestions") || "10"
    );

    const workingDir = process.cwd();

    // Initialize repository if needed
    if (!(await isoGitService.isRepositoryInitialized(workingDir))) {
      await isoGitService.initializeRepository(process.cwd());
    }

    // Update message with commit info if available
    const { status, commit } = await isoGitService.getLastCommit(workingDir);
    if (status === "success" && userMessageId) {
      await trpc.chat.updateMessage.mutate({
        messageId: Number(userMessageId),
        commit: commit?.oid,
      });
    }

    try {
      const result = await suggestionAgent({
        model,
        messages: mapMessages(messages),
        workingDir: process.cwd(),
        maxSuggestions,
        tools: mcpTools,
      });

      // Parse suggestions from the response text
      const suggestions = parseSuggestionsFromResponse(result.text);

      return new Response(JSON.stringify({ suggestions }), {
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      logger.dump(error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
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
