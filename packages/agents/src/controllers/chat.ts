import { logger } from "@chara-codes/logger";
import { createDataStreamResponse, type CoreMessage } from "ai";
import { chatAgent } from "../agents/chat-agent";
import { gitAgent } from "../agents/git-agent";
import { isoGitService } from "../services/isogit";
import { trpc } from "../services/trpc";
import { chatToolsAskMode, chatToolsWriteMode } from "../tools/chat-tools";
import { mapMessages } from "../utils";

let mcpTools: Record<string, any> = {};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const chatController = {
  setTools: (newTools: Record<string, any>) => {
    mcpTools = newTools;
  },
  OPTIONS: () => new Response("", { headers: CORS_HEADERS }),
  POST: async (req: Request) => {
    const data = await req.json();
    const { model, messages, userMessageId } = data as {
      model: string;
      messages: CoreMessage[];
      chatId: number;
      userMessageId?: number;
    };
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode");

    const workingDir = process.cwd();
    if (!(await isoGitService.isRepositoryInitialized(workingDir))) {
      await isoGitService.initializeRepository(process.cwd());
    }
    const { status, commit } = await isoGitService.getLastCommit(workingDir);
    if (status === "success" && userMessageId) {
      await trpc.chat.updateMessage.mutate({
        messageId: Number(userMessageId),
        commit: commit?.oid,
      });
    }

    // Combine agent-specific tools with the general MCP tools
    const localChatTools =
      mode === "write" ? chatToolsWriteMode : chatToolsAskMode;
    const allTools = { ...localChatTools, ...mcpTools };

    return createDataStreamResponse({
      headers: { ...CORS_HEADERS, "accept-encoding": "" },
      execute: async (dataStream) => {
        const result = await chatAgent({
          model,
          messages: mapMessages(messages),
          mode: mode === "write" ? "write" : "ask",
          workingDir: process.cwd(),
          tools: allTools,
          onFinish: async () => {
            if (mode === "write") {
              const commitMessage = await gitAgent({
                model,
                messages: mapMessages(messages),
              });
              await isoGitService.saveToHistory(workingDir, commitMessage.text);
            }
          },
        });
        result.mergeIntoDataStream(dataStream);
      },
      onError: (error) => {
        logger.dump(error);
        if (mode === "write") {
          gitAgent({
            model,
            messages: mapMessages(messages),
          }).then((commitMessage) =>
            isoGitService.saveToHistory(workingDir, commitMessage.text)
          );
        }
        // Error messages are masked by default for security reasons.
        // If you want to expose the error message to the client, you can do so here:
        return error instanceof Error ? error.message : String(error);
      },
    });
  },
};
