import { logger } from "@chara-codes/logger";
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
    const data = await req.json();
    const { model, messages } = data as {
      model: string;
      messages: CoreMessage[];
    };
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode");

    let commit;
    if (mode === "write") {
      const workingDir = process.cwd();
      if (!(await isoGitService.isRepositoryInitialized(workingDir))) {
        isoGitService.initializeRepository(process.cwd());
      }

      const commitMessage = await gitAgent({
        model,
        messages,
      });
      commit = await isoGitService.saveToHistory(
        workingDir,
        commitMessage.text
      );
    }
    return createDataStreamResponse({
      headers: { ...CORS_HEADERS, "accept-encoding": "" },
      execute: async (dataStream) => {
        dataStream.writeMessageAnnotation(commit);
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
