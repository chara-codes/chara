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

export const chatController = {
  setTools: (tools: Record<string, unknown>) => {
    mcpTools = { ...tools };
  },

  OPTIONS: () => new Response("", { headers: CORS_HEADERS }),

  POST: async (req: Request) => {
    try {
      const { messages, chatId, model, mode } = await req.json();
      if (!chatId || !messages || !model || !mode) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields: chatId, messages, model, mode",
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

      // Convert simple message format to UIMessage format
      const uiMessages: UIMessage[] = messages.map((msg: any) => {
        if (msg.parts) {
          // Already in UIMessage format
          return msg;
        } else {
          // Convert from simple {role, content} format to UIMessage format
          return {
            id: msg.id || generateId(),
            role: msg.role,
            parts: [{ type: "text" as const, text: msg.content || "" }],
            createdAt: new Date(),
          };
        }
      });

      const workingDir = process.cwd();

      // Create abort controller for this chat
      const controller = new AbortController();
      activeChats.set(chatId, controller);

      try {
        // Initialize repository if needed
        if (!(await isoGitService.isRepositoryInitialized(workingDir))) {
          await isoGitService.initializeRepository(workingDir);
        }

        // Initialize git repository for this working directory
        await isoGitService.getLastCommit(workingDir);

        // Save chat messages to database
        const saveChatMessages = async (
          chatId: string,
          messages: UIMessage[]
        ): Promise<void> => {
          try {
            await trpc.chat.saveMessages.mutate({
              chatId,
              messages: messages as any,
            });
          } catch (error) {
            logger.error("Failed to save chat:", error);
            throw error;
          }
        };

        // Combine tools
        const localChatTools =
          mode === "write" ? chatToolsWriteMode : chatToolsAskMode;
        const allTools = { ...localChatTools, ...mcpTools };

        const modelMessages = convertToModelMessages(uiMessages);

        // Start chat agent
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
                  try {
                    const commitMessage = await gitAgent({
                      model,
                      messages: convertToModelMessages(uiMessages),
                    });
                    const { commitSha } = await isoGitService.saveToHistory(
                      workingDir,
                      commitMessage.text
                    );
                    const { id } = uiMessages[uiMessages.length - 1];
                    const res = await trpc.chat.updateMessage.mutate({
                      messageId: id,
                      commit: commitSha,
                    });
                  } catch (error) {
                    logger.error("Failed to save to git history:", error);
                  }
                }
              },
              onError: async (error: Error) => {
                logger.error(`Chat agent error for chat ${chatId}:`, error);
              },
            },
          },
          { abortSignal: controller.signal }
        );

        // Return the streaming response using AI SDK's toUIMessageStreamResponse
        return result.toUIMessageStreamResponse({
          headers: CORS_HEADERS,
          originalMessages: uiMessages,
          generateMessageId: () => generateId(),
          onFinish: async ({ messages: finalMessages }) => {
            try {
              // Save the complete conversation
              await saveChatMessages(chatId, finalMessages);
            } catch (error) {
              logger.error(
                `Failed to handle chat completion for ${chatId}:`,
                error
              );

              logger.error(
                `Chat completion error for ${chatId}:`,
                error instanceof Error ? error.message : String(error)
              );
            } finally {
              activeChats.delete(chatId);
            }
          },
        });
      } catch (error) {
        activeChats.delete(chatId);

        if (controller.signal.aborted) {
          logger.info(`Chat ${chatId} was cancelled`);
          throw new Error("Chat was cancelled");
        }

        logger.error(`Chat error for chat ${chatId}:`, error);

        // Handle git commit even on error if in write mode
        if (mode === "write") {
          try {
            const commitMessage = await gitAgent({
              model,
              messages: convertToModelMessages(uiMessages),
            });
            const { commitSha } = await isoGitService.saveToHistory(
              workingDir,
              commitMessage.text
            );

            const { id } = uiMessages[uiMessages.length - 1];
            const res = await trpc.chat.updateMessage.mutate({
              messageId: id,
              commit: commitSha,
            });
          } catch (gitError) {
            logger.error(
              "Failed to save to git history after error:",
              gitError
            );
          }
        }

        throw error;
      }
    } catch (error) {
      logger.error("Chat controller error:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return new Response(
        JSON.stringify({
          error: errorMessage,
          code: "CHAT_ERROR",
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

  // GET handler for loading chat messages
  GET: async (req: Request) => {
    try {
      const url = new URL(req.url);
      const chatId = url.searchParams.get("chatId");

      if (!chatId) {
        return new Response(
          JSON.stringify({ error: "Missing chatId parameter" }),
          {
            status: 400,
            headers: {
              ...CORS_HEADERS,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const response = await trpc.chat.getMessages.query({ chatId });

      return new Response(
        JSON.stringify({
          chatId,
          messages: response.messages,
        }),
        {
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      logger.error("Failed to load chat messages:", error);

      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          code: "LOAD_CHAT_ERROR",
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

  // DELETE handler for removing messages and rolling back git state
  DELETE: async (req: Request) => {
    try {
      const { messageId, chatId } = await req.json();

      if (!messageId || !chatId) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields: messageId, chatId",
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

      const workingDir = process.cwd();

      try {
        // Initialize repository if needed
        if (!(await isoGitService.isRepositoryInitialized(workingDir))) {
          await isoGitService.initializeRepository(workingDir);
        }

        // Delete messages from database
        const deleteResult = await trpc.chat.deleteMessages.mutate({
          chatId,
          messageId,
        });

        // If the message has a commit, rollback to it
        let rollbackResult = null;
        if (deleteResult.commitToReset) {
          try {
            rollbackResult = await isoGitService.resetToCommit(
              workingDir,
              deleteResult.commitToReset
            );

            if (rollbackResult.status !== "success") {
              logger.warn(
                `Failed to rollback git to commit ${deleteResult.commitToReset}: ${rollbackResult.message}`
              );
            }
          } catch (error) {
            logger.error(
              `Error during git rollback to commit ${deleteResult.commitToReset}:`,
              error
            );
          }
        }

        logger.info(
          `Successfully deleted ${deleteResult.deletedCount} messages from chat ${chatId} starting from message ${messageId}`
        );

        return new Response(
          JSON.stringify({
            success: true,
            deletedCount: deleteResult.deletedCount,
            deletedMessageIds: deleteResult.deletedMessageIds,
            commitToReset: deleteResult.commitToReset,
            rollbackResult: rollbackResult?.status || null,
            message: `Deleted ${deleteResult.deletedCount} messages${
              rollbackResult?.status === "success"
                ? ` and rolled back to commit ${deleteResult.commitToReset}`
                : ""
            }`,
          }),
          {
            headers: {
              ...CORS_HEADERS,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        logger.error("Error during message deletion:", error);

        const errorMessage =
          error instanceof Error ? error.message : String(error);

        return new Response(
          JSON.stringify({
            error: errorMessage,
            code: "DELETE_MESSAGES_ERROR",
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
    } catch (error) {
      logger.error("Chat controller DELETE error:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return new Response(
        JSON.stringify({
          error: errorMessage,
          code: "DELETE_REQUEST_ERROR",
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
