import { logger } from "@chara-codes/logger";
import type { CoreMessage } from "ai";
import type { ServerWebSocket } from "bun";
import { chatAgent } from "../agents/chat-agent";
import { gitAgent } from "../agents/git-agent";
import { chatToolsAskMode, chatToolsWriteMode } from "../tools/chat-tools";
import { mapMessages } from "../utils";
import { isoGitService } from "./isogit";
import { trpc } from "./trpc";

interface ChatSubscription {
  ws: ServerWebSocket<unknown>;
  subscriptionId: string;
  subscribedAt: number;
}

interface ChatStatus {
  chatId: number;
  status: "idle" | "in_progress" | "completed" | "error";
  startedAt?: number;
  completedAt?: number;
  error?: string;
  mode?: "ask" | "write";
  model?: string;
}

interface ChatSubscribeEvent {
  event: "chat:subscribe";
  data: {
    chatId: number;
  };
}

interface ChatUnsubscribeEvent {
  event: "chat:unsubscribe";
  data: {
    chatId: number;
  };
}

interface ChatUnsubscribeAllEvent {
  event: "chat:unsubscribe-all";
  data?: {};
}

interface ChatSendEvent {
  event: "chat:send";
  data: {
    chatId: number;
    model: string;
    messages: CoreMessage[];
    userMessageId?: number;
    mode: "write" | "ask";
  };
}

interface ChatCancelEvent {
  event: "chat:cancel";
  data: {
    chatId: number;
  };
}

interface ChatChunkEvent {
  event: "chat:chunk";
  data: {
    chatId: number;
    chunk: string;
    type: "text" | "tool-call" | "tool-result";
  };
}

interface ChatCompleteEvent {
  event: "chat:complete";
  data: {
    chatId: number;
    fullResponse: string;
    usage?: any;
  };
}

interface ChatErrorEvent {
  event: "chat:error";
  data: {
    chatId: number;
    error: string;
    code?: string;
  };
}

interface ChatStatusEvent {
  event: "chat:status";
  data: ChatStatus;
}

export class WebSocketChatService {
  // Map of chatId to list of subscribed WebSocket connections
  private chatSubscriptions = new Map<number, ChatSubscription[]>();
  // Map of chatId to current status
  private chatStatuses = new Map<number, ChatStatus>();
  // Map of WebSocket to subscribed chatIds for cleanup
  private clientSubscriptions = new Map<
    ServerWebSocket<unknown>,
    Set<number>
  >();
  // Map of chatId to AbortController for cancelling ongoing requests
  private chatAbortControllers = new Map<number, AbortController>();
  private mcpTools: Record<string, any> = {};
  private cleanupInterval: Timer;

  constructor() {
    // Clean up stale statuses every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleStatuses();
    }, 5 * 60 * 1000);
  }

  setTools(tools: Record<string, any>) {
    this.mcpTools = tools;
  }

  subscribeToChat(chatId: number, ws: ServerWebSocket<unknown>) {
    const subscriptionId = this.generateSubscriptionId();
    const subscription: ChatSubscription = {
      ws,
      subscriptionId,
      subscribedAt: Date.now(),
    };

    // Add to chat subscriptions
    if (!this.chatSubscriptions.has(chatId)) {
      this.chatSubscriptions.set(chatId, []);
    }
    this.chatSubscriptions.get(chatId)!.push(subscription);

    // Track client subscriptions for cleanup
    if (!this.clientSubscriptions.has(ws)) {
      this.clientSubscriptions.set(ws, new Set());
    }
    this.clientSubscriptions.get(ws)!.add(chatId);

    // Send current status to the new subscriber
    const currentStatus = this.chatStatuses.get(chatId);
    if (currentStatus) {
      this.sendToClient(ws, {
        event: "chat:status",
        data: currentStatus,
      });
    } else {
      // Initialize status if it doesn't exist
      this.updateChatStatus(chatId, {
        chatId,
        status: "idle",
      });
    }

    logger.debug(
      `Client subscribed to chat ${chatId}. Total subscribers: ${
        this.chatSubscriptions.get(chatId)!.length
      }`
    );
  }

  unsubscribeFromChat(chatId: number, ws: ServerWebSocket<unknown>) {
    const subscriptions = this.chatSubscriptions.get(chatId);
    if (subscriptions) {
      const updatedSubscriptions = subscriptions.filter((sub) => sub.ws !== ws);

      if (updatedSubscriptions.length === 0) {
        this.chatSubscriptions.delete(chatId);
        logger.debug(
          `No more subscribers for chat ${chatId}, removed subscription list`
        );
      } else {
        this.chatSubscriptions.set(chatId, updatedSubscriptions);
        logger.debug(
          `Client unsubscribed from chat ${chatId}. Remaining subscribers: ${updatedSubscriptions.length}`
        );
      }
    }

    // Remove from client subscriptions
    const clientSubs = this.clientSubscriptions.get(ws);
    if (clientSubs) {
      clientSubs.delete(chatId);
      if (clientSubs.size === 0) {
        this.clientSubscriptions.delete(ws);
      }
    }
  }

  unsubscribeFromAllChats(ws: ServerWebSocket<unknown>) {
    const subscribedChats = this.clientSubscriptions.get(ws);
    if (subscribedChats) {
      const chatCount = subscribedChats.size;
      // Unsubscribe from each chat individually
      for (const chatId of subscribedChats) {
        this.unsubscribeFromChat(chatId, ws);
      }
      logger.debug(`Client unsubscribed from all ${chatCount} chats`);
    } else {
      logger.debug(`Client had no active chat subscriptions to remove`);
    }
  }

  cleanupClientSubscriptions(ws: ServerWebSocket<unknown>) {
    const subscribedChats = this.clientSubscriptions.get(ws);
    if (subscribedChats) {
      // Unsubscribe from all chats
      for (const chatId of subscribedChats) {
        this.unsubscribeFromChat(chatId, ws);
      }
      this.clientSubscriptions.delete(ws);
      logger.debug(`Cleaned up subscriptions for disconnected client`);
    }
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanupStaleStatuses() {
    const now = Date.now();
    const timeout = 2 * 60 * 60 * 1000; // 2 hours

    for (const [chatId, status] of this.chatStatuses) {
      const lastActivity = status.completedAt || status.startedAt || 0;
      if (now - lastActivity > timeout && status.status !== "in_progress") {
        this.chatStatuses.delete(chatId);
        logger.debug(`Cleaned up stale status for chat ${chatId}`);
      }
    }
  }

  private updateChatStatus(chatId: number, statusUpdate: Partial<ChatStatus>) {
    const currentStatus = this.chatStatuses.get(chatId) || {
      chatId,
      status: "idle" as const,
    };

    const newStatus = { ...currentStatus, ...statusUpdate };
    this.chatStatuses.set(chatId, newStatus);

    // Broadcast status to all subscribers
    this.broadcastToChat(chatId, {
      event: "chat:status",
      data: newStatus,
    });
  }

  private sendToClient(
    ws: ServerWebSocket<unknown>,
    event: ChatChunkEvent | ChatCompleteEvent | ChatErrorEvent | ChatStatusEvent
  ) {
    try {
      ws.send(JSON.stringify(event));
    } catch (error) {
      logger.error(`Failed to send WebSocket event to client:`, error);
      // Clean up this client's subscriptions
      this.cleanupClientSubscriptions(ws);
    }
  }

  private broadcastToChat(
    chatId: number,
    event: ChatChunkEvent | ChatCompleteEvent | ChatErrorEvent | ChatStatusEvent
  ) {
    const subscriptions = this.chatSubscriptions.get(chatId);
    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    const message = JSON.stringify(event);
    const disconnectedClients: ServerWebSocket<unknown>[] = [];

    for (const subscription of subscriptions) {
      try {
        subscription.ws.send(message);
      } catch (error) {
        logger.error(
          `Failed to broadcast to subscriber of chat ${chatId}:`,
          error
        );
        disconnectedClients.push(subscription.ws);
      }
    }

    // Clean up disconnected clients
    for (const ws of disconnectedClients) {
      this.unsubscribeFromChat(chatId, ws);
    }
  }

  async handleChatSend(data: ChatSendEvent["data"]) {
    const { chatId, model, messages, userMessageId, mode } = data;

    // Check if chat is already in progress
    const currentStatus = this.chatStatuses.get(chatId);
    if (currentStatus && currentStatus.status === "in_progress") {
      this.broadcastToChat(chatId, {
        event: "chat:error",
        data: {
          chatId,
          error: "Chat is already in progress",
          code: "CHAT_IN_PROGRESS",
        },
      });
      return;
    }

    // Create abort controller for this chat
    const abortController = new AbortController();
    this.chatAbortControllers.set(chatId, abortController);

    try {
      const workingDir = process.cwd();

      // Update status to in_progress
      this.updateChatStatus(chatId, {
        status: "in_progress",
        startedAt: Date.now(),
        mode,
        model,
      });

      // Initialize repository if needed
      if (!(await isoGitService.isRepositoryInitialized(workingDir))) {
        await isoGitService.initializeRepository(workingDir);
      }

      // Update message with commit info
      const { status, commit } = await isoGitService.getLastCommit(workingDir);
      if (status === "success" && userMessageId) {
        await trpc.chat.updateMessage.mutate({
          messageId: Number(userMessageId),
          commit: commit?.oid,
        });
      }

      // Combine agent-specific tools with MCP tools
      const localChatTools =
        mode === "write" ? chatToolsWriteMode : chatToolsAskMode;
      const allTools = { ...localChatTools, ...this.mcpTools };

      // Start chat agent with abort signal
      const result = await chatAgent(
        {
          model,
          messages: mapMessages(messages),
          mode: mode === "write" ? "write" : "ask",
          workingDir,
          tools: allTools,
          onFinish: async (finishResult) => {
            if (mode === "write") {
              try {
                const commitMessage = await gitAgent({
                  model,
                  messages: mapMessages(messages),
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
        },
        { abortSignal: abortController.signal }
      );

      let fullResponse = "";

      // Process the stream and broadcast chunks
      try {
        for await (const chunk of result.fullStream) {
          // Check if stream was aborted
          if (abortController.signal.aborted) {
            logger.info(
              `Stream for chat ${chatId} was aborted during processing`
            );
            break;
          }

          if (chunk.type === "text-delta") {
            const textChunk = chunk.textDelta;
            fullResponse += textChunk;

            this.broadcastToChat(chatId, {
              event: "chat:chunk",
              data: {
                chatId,
                chunk: textChunk,
                type: "text",
              },
            });
          } else if (chunk.type === "tool-call") {
            this.broadcastToChat(chatId, {
              event: "chat:chunk",
              data: {
                chatId,
                chunk: JSON.stringify(chunk),
                type: "tool-call",
              },
            });
          } else if (chunk.type === "tool-result") {
            this.broadcastToChat(chatId, {
              event: "chat:chunk",
              data: {
                chatId,
                chunk: JSON.stringify(chunk),
                type: "tool-result",
              },
            });
          }
        }
      } catch (streamError) {
        // Check if this was an abort error
        if (abortController.signal.aborted) {
          logger.info(`Stream for chat ${chatId} was cancelled`);
          this.updateChatStatus(chatId, {
            status: "completed",
            completedAt: Date.now(),
          });
          return;
        }

        // Re-throw other stream errors to be handled by outer catch
        throw streamError;
      }

      // Only broadcast completion if not aborted
      if (!abortController.signal.aborted) {
        // Broadcast completion event
        this.broadcastToChat(chatId, {
          event: "chat:complete",
          data: {
            chatId,
            fullResponse,
            usage: result.usage,
          },
        });

        // Update status to completed
        this.updateChatStatus(chatId, {
          status: "completed",
          completedAt: Date.now(),
        });
      }
    } catch (error) {
      // Check if this was a cancellation
      if (abortController.signal.aborted) {
        logger.info(`Chat ${chatId} was cancelled`);
        this.updateChatStatus(chatId, {
          status: "completed",
          completedAt: Date.now(),
        });
        return;
      }
      logger.error(`Chat error for chat ${chatId}:`, error);

      // Try to handle git commit even on error if in write mode
      if (mode === "write") {
        try {
          const commitMessage = await gitAgent({
            model,
            messages: mapMessages(messages),
          });
          await isoGitService.saveToHistory(process.cwd(), commitMessage.text);
        } catch (gitError) {
          logger.error("Failed to save to git history after error:", gitError);
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.broadcastToChat(chatId, {
        event: "chat:error",
        data: {
          chatId,
          error: errorMessage,
          code: "CHAT_ERROR",
        },
      });

      // Update status to error
      this.updateChatStatus(chatId, {
        status: "error",
        error: errorMessage,
        completedAt: Date.now(),
      });
    } finally {
      // Clean up abort controller
      this.chatAbortControllers.delete(chatId);
    }
  }

  handleChatCancel(data: ChatCancelEvent["data"]) {
    const { chatId } = data;

    logger.info(`Cancelling chat ${chatId}`);

    // Get the abort controller for this chat
    const abortController = this.chatAbortControllers.get(chatId);
    if (abortController) {
      // Abort the ongoing stream
      abortController.abort();

      // Broadcast cancellation status
      this.broadcastToChat(chatId, {
        event: "chat:status",
        data: {
          chatId,
          status: "completed",
          completedAt: Date.now(),
        },
      });

      logger.debug(`Successfully cancelled chat ${chatId}`);
    } else {
      logger.warn(`No active stream found for chat ${chatId} to cancel`);

      // Still broadcast status update for UI consistency
      this.broadcastToChat(chatId, {
        event: "chat:status",
        data: {
          chatId,
          status: "idle",
        },
      });
    }
  }

  getChatStatus(chatId: number): ChatStatus | undefined {
    return this.chatStatuses.get(chatId);
  }

  getActiveChats(): number[] {
    return Array.from(this.chatStatuses.keys()).filter(
      (chatId) => this.chatStatuses.get(chatId)?.status === "in_progress"
    );
  }

  getSubscriberCount(chatId: number): number {
    return this.chatSubscriptions.get(chatId)?.length || 0;
  }

  getClientSubscriptions(ws: ServerWebSocket<unknown>): number[] {
    const subscribedChats = this.clientSubscriptions.get(ws);
    return subscribedChats ? Array.from(subscribedChats) : [];
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.chatSubscriptions.clear();
    this.chatStatuses.clear();
    this.clientSubscriptions.clear();
  }
}

export const webSocketChatService = new WebSocketChatService();
