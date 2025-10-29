import type { UIMessage } from "ai";
import { convertToModelMessages, generateId } from "ai";
import { chatAgent } from "../agents/chat-agent";
import { gitAgent } from "../agents/git-agent";
import { isoGitService } from "../services/isogit";
import { trpc } from "../services/trpc";
import { chatToolsAskMode, chatToolsWriteMode } from "../tools/chat-tools";
import { logger } from "../utils/logger";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Global state for managing active chats
const activeChats = new Map<string, AbortController>();
let mcpTools: Record<string, unknown> = {};

// ============================================================================
// Validation Helpers
// ============================================================================

function validateChatRequest(body: any): {
  valid: boolean;
  error?: string;
} {
  const { chatId, messages, model, mode } = body;

  if (!chatId || !messages || !model || !mode) {
    return {
      valid: false,
      error: "Missing required fields: chatId, messages, model, mode",
    };
  }

  return { valid: true };
}

function validateDeleteRequest(body: any): {
  valid: boolean;
  error?: string;
} {
  const { messageId, chatId } = body;

  if (!messageId || !chatId) {
    return {
      valid: false,
      error: "Missing required fields: messageId, chatId",
    };
  }

  return { valid: true };
}

// ============================================================================
// Message Conversion
// ============================================================================

function convertToUIMessages(messages: any[]): UIMessage[] {
  return messages.map((msg: any) => {
    if (msg.parts) {
      return msg;
    }

    return {
      id: msg.id || generateId(),
      role: msg.role,
      parts: [{ type: "text" as const, text: msg.content || "" }],
      createdAt: new Date(),
    };
  });
}

// ============================================================================
// Repository Management
// ============================================================================

async function ensureRepositoryInitialized(workingDir: string): Promise<void> {
  if (!(await isoGitService.isRepositoryInitialized(workingDir))) {
    await isoGitService.initializeRepository(workingDir);
  }
  await isoGitService.getLastCommit(workingDir);
}

// ============================================================================
// Chat Operations
// ============================================================================

async function saveChatMessages(
  chatId: string,
  messages: UIMessage[]
): Promise<void> {
  try {
    await trpc.chat.saveMessages.mutate({
      chatId,
      messages: messages as any,
    });
  } catch (error) {
    logger.error("Failed to save chat:", error);
    throw error;
  }
}

function getCombinedTools(mode: string): Record<string, unknown> {
  const localChatTools =
    mode === "write" ? chatToolsWriteMode : chatToolsAskMode;
  return { ...localChatTools, ...mcpTools };
}

async function createGitCommit(
  model: string,
  uiMessages: UIMessage[],
  workingDir: string
): Promise<string | undefined> {
  const commitMessage = await gitAgent({
    model,
    messages: convertToModelMessages(uiMessages),
  });

  const { commitSha } = await isoGitService.saveToHistory(
    workingDir,
    commitMessage.text
  );

  return commitSha;
}

async function updateMessageWithCommit(
  messageId: string,
  commitSha: string
): Promise<void> {
  await trpc.chat.updateMessage.mutate({
    messageId,
    commit: commitSha,
  });
}

async function handleWriteModeCompletion(
  model: string,
  uiMessages: UIMessage[],
  workingDir: string
): Promise<void> {
  try {
    const commitSha = await createGitCommit(model, uiMessages, workingDir);
    // Only update message if we actually got a commit SHA (i.e., there were changes)
    if (commitSha) {
      const lastMessageId = uiMessages[uiMessages.length - 1]?.id as string;
      await updateMessageWithCommit(lastMessageId, commitSha);
    }
  } catch (error) {
    logger.error("Failed to save to git history:", error);
  }
}

function createChatAbortController(chatId: string): AbortController {
  const controller = new AbortController();
  activeChats.set(chatId, controller);
  return controller;
}

function cleanupChatController(chatId: string): void {
  activeChats.delete(chatId);
}

// ============================================================================
// Rollback Operations
// ============================================================================

async function rollbackToParentCommit(
  workingDir: string,
  commitSha: string
): Promise<{ status: string; message?: string }> {
  try {
    const commitResult = await isoGitService.getCommitByOid(
      workingDir,
      commitSha
    );

    if (
      commitResult.status === "success" &&
      commitResult.commit &&
      commitResult.commit.commit.parent.length > 0
    ) {
      const parentCommitSha = commitResult.commit.commit.parent[0];

      if (parentCommitSha && typeof parentCommitSha === "string") {
        logger.info(
          `Resetting to parent commit ${parentCommitSha} (before changes from commit ${commitSha})`
        );

        const rollbackResult = await isoGitService.resetToCommit(
          workingDir,
          parentCommitSha as string
        );

        if (rollbackResult.status !== "success") {
          logger.warn(
            `Failed to rollback git to parent commit ${parentCommitSha}: ${rollbackResult.message}`
          );
        }

        return rollbackResult;
      } else {
        logger.warn(
          `Parent commit SHA is empty for commit ${commitSha}, skipping rollback`
        );
        return {
          status: "error",
          message: "Parent commit SHA is empty",
        };
      }
    } else {
      logger.warn(
        `Cannot find parent commit for ${commitSha}, skipping rollback`
      );
      return {
        status: "error",
        message: "No parent commit found",
      };
    }
  } catch (error) {
    logger.error(`Error during git rollback for commit ${commitSha}:`, error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Response Helpers
// ============================================================================

function createErrorResponse(
  error: string,
  code: string,
  status: number = 400
): Response {
  return new Response(JSON.stringify({ error, code }), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

function createJsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

// ============================================================================
// Main Controller
// ============================================================================

export const chatController = {
  setTools: (tools: Record<string, unknown>) => {
    mcpTools = { ...tools };
  },

  OPTIONS: () => new Response("", { headers: CORS_HEADERS }),

  POST: async (req: Request) => {
    try {
      const body = await req.json();
      const validation = validateChatRequest(body);

      if (!validation.valid) {
        return createErrorResponse(validation.error!, "VALIDATION_ERROR", 400);
      }

      const { messages, chatId, model, mode } = body;
      const uiMessages = convertToUIMessages(messages);
      const workingDir = process.cwd();
      const controller = createChatAbortController(chatId);

      try {
        await ensureRepositoryInitialized(workingDir);

        const allTools = getCombinedTools(mode);
        const modelMessages = convertToModelMessages(uiMessages);

        const result = await chatAgent(
          {
            model,
            messages: modelMessages,
            mode: mode === "write" ? "write" : "ask",
            workingDir,
            tools: allTools,
            callbacks: {
              onStepFinish: async (stepResult) => {
                logger.debug(`Step completed for chat ${chatId}:`, {
                  text: stepResult?.text,
                  toolCalls: stepResult?.toolCalls?.length || 0,
                });
              },
              onFinish: async () => {
                if (mode === "write") {
                  await handleWriteModeCompletion(
                    model,
                    uiMessages,
                    workingDir
                  );
                }
              },
              onError: async (error: Error) => {
                logger.error(`Chat agent error for chat ${chatId}:`, error);
              },
            },
          },
          { abortSignal: controller.signal }
        );

        return result.toUIMessageStreamResponse({
          headers: CORS_HEADERS,
          originalMessages: uiMessages,
          generateMessageId: () => generateId(),
          onFinish: async ({ messages: finalMessages }) => {
            try {
              await saveChatMessages(chatId, finalMessages);
            } catch (error) {
              logger.error(
                `Failed to handle chat completion for ${chatId}:`,
                error
              );
            } finally {
              cleanupChatController(chatId);
            }
          },
        });
      } catch (error) {
        cleanupChatController(chatId);

        if (controller.signal.aborted) {
          logger.info(`Chat ${chatId} was cancelled`);
          throw new Error("Chat was cancelled");
        }

        logger.error(`Chat error for chat ${chatId}:`, error);

        if (mode === "write") {
          await handleWriteModeCompletion(model, uiMessages, workingDir);
        }

        throw error;
      }
    } catch (error) {
      logger.error("Chat controller error:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return createErrorResponse(errorMessage, "CHAT_ERROR", 500);
    }
  },

  GET: async (req: Request) => {
    try {
      const url = new URL(req.url);
      const chatId = url.searchParams.get("chatId");

      if (!chatId) {
        return createErrorResponse(
          "Missing chatId parameter",
          "VALIDATION_ERROR",
          400
        );
      }

      const response = await trpc.chat.getMessages.query({ chatId });

      return createJsonResponse({
        chatId,
        messages: response.messages,
      });
    } catch (error) {
      logger.error("Failed to load chat messages:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return createErrorResponse(errorMessage, "LOAD_CHAT_ERROR", 500);
    }
  },

  DELETE: async (req: Request) => {
    try {
      const body = await req.json();
      const validation = validateDeleteRequest(body);

      if (!validation.valid) {
        return createErrorResponse(validation.error!, "VALIDATION_ERROR", 400);
      }

      const { messageId, chatId } = body;
      const workingDir = process.cwd();

      try {
        await ensureRepositoryInitialized(workingDir);

        const deleteResult = await trpc.chat.deleteMessages.mutate({
          chatId,
          messageId,
        });

        let rollbackResult = null;
        if (deleteResult.commitToReset) {
          rollbackResult = await rollbackToParentCommit(
            workingDir,
            deleteResult.commitToReset
          );
        }

        logger.info(
          `Successfully deleted ${deleteResult.deletedCount} messages from chat ${chatId} starting from message ${messageId}`
        );

        return createJsonResponse({
          success: true,
          deletedCount: deleteResult.deletedCount,
          deletedMessageIds: deleteResult.deletedMessageIds,
          rollbackResult: rollbackResult?.status || null,
          message: `Deleted ${deleteResult.deletedCount} messages${
            rollbackResult?.status === "success"
              ? ` and rolled back changes`
              : ""
          }`,
        });
      } catch (error) {
        logger.error("Error during message deletion:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return createErrorResponse(errorMessage, "DELETE_MESSAGES_ERROR", 500);
      }
    } catch (error) {
      logger.error("Chat controller DELETE error:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return createErrorResponse(errorMessage, "DELETE_REQUEST_ERROR", 500);
    }
  },
};
