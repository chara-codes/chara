import { logger } from "@apk/logger";
import { type CoreMessage, createDataStreamResponse } from "ai";
import { chatAgent } from "../agents/chat-agent";
import { gitAgent } from "../agents/git-agent";
import { isoGitService } from "../services/isogit";

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
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode");

    if (mode === "write") {
      const workingDir = process.cwd();
      if (!(await isoGitService.isRepositoryInitialized(workingDir))) {
        isoGitService.initializeRepository(process.cwd());
      }

      const commitMessage = await gitAgent({
        model,
        messages,
      });

      isoGitService.saveToHistory(workingDir, commitMessage.toString());
    }
    return createDataStreamResponse({
      headers: { ...CORS_HEADERS, "accept-encoding": "" },
      execute: async (dataStream) => {
        const result = await chatAgent({
          model,
          messages,
          mode: mode === "write" ? "write" : "ask",
          workingDir: process.cwd(),
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
