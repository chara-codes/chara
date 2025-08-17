import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  generateId,
  UIMessage,
} from "ai";
import { chatAgent } from "../../agents/chat-agent";
import { gitAgent } from "../../agents/git-agent";
import { chatToolsAskMode, chatToolsWriteMode } from "../../tools/chat-tools";
import { logger } from "../../utils/logger";
import { isoGitService } from "../isogit";
import { trpc } from "../trpc";
import { chatHooksManager } from "./hooks";
import { subscriptionManager } from "./subscription-manager";

export interface ChatProcessorOptions {
  chatId: string;
  messages: UIMessage[];
  model: string;
  mode: "ask" | "write";
  workingDir?: string;
  abortSignal?: AbortSignal;
}

export interface ChatStore {
  saveChat: (chatId: string, messages: UIMessage[]) => Promise<void>;
  loadChat: (chatId: string) => Promise<UIMessage[]>;
}

// Global state for managing active chats
const activeChats = new Map<string, AbortController>();
let mcpTools: Record<string, unknown> = {};

// Chat store implementation
const chatStore: ChatStore = {
  async saveChat(chatId: string, messages: UIMessage[]): Promise<void> {
    try {
      await trpc.chat.saveMessages.mutate({
        chatId,
        messages,
      });
    } catch (error) {
      logger.error("Failed to save chat:", error);
      throw error;
    }
  },

  async loadChat(chatId: string): Promise<UIMessage[]> {
    try {
      const response = await trpc.chat.getMessages.query({
        chatId,
      });

      return response.messages;
    } catch (error) {
      logger.error("Failed to load chat:", error);
      throw error;
    }
  },
};

export function setMcpTools(tools: Record<string, unknown>): void {
  mcpTools = { ...tools };
}

export function getActiveChats(): string[] {
  return Array.from(activeChats.keys());
}

export function isProcessing(chatId: string): boolean {
  return activeChats.has(chatId);
}

export function cancelChat(chatId: string): void {
  logger.info(`Cancelling chat ${chatId}`);

  const abortController = activeChats.get(chatId);
  if (abortController) {
    abortController.abort();
    activeChats.delete(chatId);
    logger.debug(`Successfully signaled cancellation for chat ${chatId}`);

    subscriptionManager.broadcastToChat(Number(chatId), {
      event: "chat:status",
      data: { status: "idle", chatId: Number(chatId) },
    });
  } else {
    logger.warn(`No active stream found for chat ${chatId} to cancel`);
  }
}

export function destroyAllChats(): void {
  for (const [chatId, controller] of activeChats) {
    logger.info(`Cancelling chat ${chatId} during shutdown`);
    controller.abort();
  }
  activeChats.clear();
}

export function clearAllChats(): void {
  activeChats.clear();
}

async function broadcastChatUpdate(
  chatId: string,
  messages: UIMessage[]
): Promise<void> {
  try {
    await chatStore.saveChat(chatId, messages);
  } catch (error) {
    logger.error(`Failed to save chat ${chatId}:`, error);
  }
}

export async function processChatMessage(
  options: ChatProcessorOptions
): Promise<Response> {
  const {
    chatId,
    messages,
    model,
    mode,
    workingDir = process.cwd(),
    abortSignal,
  } = options;

  // Create abort controller for this chat if not provided
  let controller: AbortController;
  if (abortSignal) {
    controller = { abort: () => abortSignal.abort() } as AbortController;
  } else {
    controller = new AbortController();
    activeChats.set(chatId, controller);
  }

  try {
    // Trigger chat start hook
    await chatHooksManager.onChatStart(Number(chatId), {
      chatId: Number(chatId),
      model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.parts
          .filter((part) => part.type === "text")
          .map((part) => (part as any).text)
          .join(""),
      })),
      mode: mode as "ask" | "write",
    });

    // Broadcast initial status
    subscriptionManager.broadcastToChat(Number(chatId), {
      event: "chat:status",
      data: { status: "in_progress", chatId: Number(chatId), mode, model },
    });

    // Initialize repository if needed
    if (!(await isoGitService.isRepositoryInitialized(workingDir))) {
      await isoGitService.initializeRepository(workingDir);
    }

    // Update message with commit info for user message
    const { status, commit } = await isoGitService.getLastCommit(workingDir);
    if (status === "success" && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        // Note: In the new system, we might need to handle commit tracking differently
        await chatHooksManager.onMessageUpdate(
          Number(lastMessage.id),
          commit?.oid
        );
      }
    }

    // Combine tools
    const localChatTools =
      mode === "write" ? chatToolsWriteMode : chatToolsAskMode;
    const allTools = { ...localChatTools, ...mcpTools };

    // Start chat agent
    const result = await chatAgent(
      {
        model,
        messages: convertToModelMessages(messages),
        mode: mode === "write" ? "write" : "ask",
        workingDir,
        tools: allTools,
        callbacks: {
          onStepFinish: async (stepResult) => {
            logger.debug(`Step completed for chat ${chatId}:`, {
              text: stepResult.text,
              toolCalls: stepResult.toolCalls?.length || 0,
            });
          },
          onFinish: async () => {
            if (mode === "write") {
              try {
                const commitMessage = await gitAgent({
                  model,
                  messages: convertToModelMessages(messages),
                });
                await isoGitService.saveToHistory(
                  workingDir,
                  commitMessage.text
                );
              } catch (error) {
                logger.error("Failed to save to git history:", error);
              }
            }
          },
          onError: async (error: Error) => {
            logger.error(`Chat agent error for chat ${chatId}:`, error);
            subscriptionManager.broadcastToChat(Number(chatId), {
              event: "chat:error",
              data: {
                chatId: Number(chatId),
                assistantMessageId: null,
                error: error.message,
                code: "CHAT_AGENT_ERROR",
              },
            });
          },
        },
      },
      { abortSignal: controller.signal }
    );

    // Return the streaming response using AI SDK's toUIMessageStreamResponse
    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      generateMessageId: () => generateId(),
      onFinish: async ({ messages: finalMessages }) => {
        try {
          // Save the complete conversation
          await broadcastChatUpdate(chatId, finalMessages);

          // Broadcast completion status
          subscriptionManager.broadcastToChat(Number(chatId), {
            event: "chat:status",
            data: { status: "completed", chatId: Number(chatId) },
          });

          // Trigger completion hook
          const assistantMessage = finalMessages[finalMessages.length - 1];
          const content =
            assistantMessage?.parts
              .filter((part) => part.type === "text")
              .map((part) => (part as any).text)
              .join("") || "";

          await chatHooksManager.onChatComplete(
            Number(chatId),
            content,
            (await result.usage) || undefined
          );
        } catch (error) {
          logger.error(
            `Failed to handle chat completion for ${chatId}:`,
            error
          );

          subscriptionManager.broadcastToChat(Number(chatId), {
            event: "chat:error",
            data: {
              chatId: Number(chatId),
              assistantMessageId: null,
              error: error instanceof Error ? error.message : String(error),
              code: "CHAT_COMPLETION_ERROR",
            },
          });
        } finally {
          activeChats.delete(chatId);
        }
      },
    });
  } catch (error) {
    activeChats.delete(chatId);

    if (controller.signal.aborted) {
      logger.info(`Chat ${chatId} was cancelled`);

      subscriptionManager.broadcastToChat(Number(chatId), {
        event: "chat:status",
        data: { status: "error", chatId: Number(chatId) },
      });

      await chatHooksManager.onChatCancel(Number(chatId));

      // Return a cancelled response
      throw new Error("Chat was cancelled");
    }

    logger.error(`Chat error for chat ${chatId}:`, error);

    // Handle git commit even on error if in write mode
    if (mode === "write") {
      try {
        const commitMessage = await gitAgent({
          model,
          messages: convertToModelMessages(messages),
        });
        await isoGitService.saveToHistory(workingDir, commitMessage.text);
      } catch (gitError) {
        logger.error("Failed to save to git history after error:", gitError);
      }
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    subscriptionManager.broadcastToChat(Number(chatId), {
      event: "chat:error",
      data: {
        chatId: Number(chatId),
        assistantMessageId: null,
        error: errorMessage,
        code: "CHAT_ERROR",
      },
    });

    subscriptionManager.broadcastToChat(Number(chatId), {
      event: "chat:status",
      data: { status: "error", chatId: Number(chatId), error: errorMessage },
    });

    await chatHooksManager.onChatError(Number(chatId), errorMessage);

    throw error;
  }
}

// Utility function to create a new chat and return its ID
export async function createNewChat(title?: string): Promise<string> {
  try {
    const chat = await trpc.chat.createChat.mutate({
      title: title || "New Chat",
    });
    return chat.id;
  } catch (error) {
    logger.error("Failed to create new chat:", error);
    throw error;
  }
}

// Utility function to load existing chat messages
export async function loadChatMessages(chatId: string): Promise<UIMessage[]> {
  return chatStore.loadChat(chatId);
}

// Utility function to append a user message to existing chat
export async function appendUserMessage(
  chatId: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<UIMessage[]> {
  const existingMessages = await loadChatMessages(chatId);

  const userMessage: UIMessage = {
    id: generateId(),
    role: "user",
    parts: [{ type: "text", text: message }],
    createdAt: new Date(),
    ...(metadata && { metadata }),
  };

  const updatedMessages = [...existingMessages, userMessage];
  await chatStore.saveChat(chatId, updatedMessages);

  return updatedMessages;
}

// Backward compatibility object for tests and existing code
export const chatProcessor = {
  setTools: (tools: Record<string, unknown>) => {
    // Store tools globally if needed for compatibility
    // In the new functional approach, tools are passed directly to processChatMessage
  },

  handleChatSend: async (data: any) => {
    const { chatId, messages, model, mode, workingDir } = data;
    return await processChatMessage({
      chatId: String(chatId),
      messages,
      model,
      mode,
      workingDir,
    });
  },

  handleChatCancel: (chatId: number) => {
    const controller = activeChats.get(String(chatId));
    if (controller) {
      controller.abort();
      return true;
    }
    return false;
  },

  getActiveChats: () => {
    return Array.from(activeChats.keys()).map((id) => parseInt(id, 10));
  },

  isProcessing: (chatId: number) => {
    return activeChats.has(String(chatId));
  },

  destroy: () => {
    // Cancel all active chats
    for (const controller of activeChats.values()) {
      controller.abort();
    }
    activeChats.clear();
  },

  clear: () => {
    // Cancel all active chats and clear state
    for (const controller of activeChats.values()) {
      controller.abort();
    }
    activeChats.clear();
  },
};
