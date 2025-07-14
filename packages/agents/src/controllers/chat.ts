import { logger } from "@chara-codes/logger";
import { type CoreMessage, createDataStreamResponse } from "ai";
import { chatAgent } from "../agents/chat-agent";
import { gitAgent } from "../agents/git-agent";
import { isoGitService } from "../services/isogit";
import { trpc } from "../services/trpc";
import { mapMessages } from "../utils";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const chatController = {
  OPTIONS: () => new Response("", { headers: CORS_HEADERS }),
  POST: async (req: Request) => {
    const data = await req.json();
    const { model, messages, chatId } = data as {
      model: string;
      messages: CoreMessage[];
      chatId: number;
    };
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode");

    const workingDir = process.cwd();
    if (!(await isoGitService.isRepositoryInitialized(workingDir))) {
      await isoGitService.initializeRepository(process.cwd());
    }
    const lastCommit = await isoGitService.getLastCommit(workingDir);

    const lastMessage = messages[messages.length - 1];

    const [content, ...context] = Array.isArray(lastMessage?.content)
      ? lastMessage.content
      : [lastMessage?.content];

    const messageRow = await trpc.chat.saveMessage.mutate({
      content: JSON.stringify([content]),
      context,
      commit: lastCommit.commit?.oid,
      role: "user",
      chatId: Number(chatId),
    });

    console.log(messageRow);

    // if (mode === "write") {
    //   const commitMessage = await gitAgent({
    //     model,
    //     messages,
    //   });
    //   commit = await isoGitService.saveToHistory(
    //     workingDir,
    //     commitMessage.text
    //   );
    // }
    return createDataStreamResponse({
      headers: { ...CORS_HEADERS, "accept-encoding": "" },
      execute: async (dataStream) => {
        const result = await chatAgent({
          model,
          messages: mapMessages(messages),
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
