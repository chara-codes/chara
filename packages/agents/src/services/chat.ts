import type { ServerWebSocket } from "bun";
import { logger } from "../utils/logger";
import { chatProcessor } from "./chat/chat-processor";
import { chatHooksManager } from "./chat/hooks";
import { subscriptionManager } from "./chat/subscription-manager";
import type {
  ChatCancelEvent,
  ChatHooks,
  ChatSendEvent,
  ChatStatus,
  ChatSubscribeEvent,
  ChatUnsubscribeEvent,
} from "./chat/types";

export class ChatService {
  // Hook management
  registerHooks(hooks: Partial<ChatHooks>) {
    chatHooksManager.registerHooks(hooks);
  }

  // Tool management
  setTools(tools: Record<string, unknown>) {
    chatProcessor.setTools(tools);
  }

  // Subscription management
  subscribeToChat(chatId: number, ws: ServerWebSocket<unknown>): string {
    const subscriptionId = subscriptionManager.subscribeToChat(chatId, ws);

    // Send current status to the new subscriber
    const isProcessing = chatProcessor.isProcessing(chatId);
    subscriptionManager.sendToClient(ws, {
      event: "chat:status",
      data: {
        status: isProcessing ? "in_progress" : "idle",
        chatId,
      },
    });

    return subscriptionId;
  }

  unsubscribeFromChat(chatId: number, ws: ServerWebSocket<unknown>): boolean {
    return subscriptionManager.unsubscribeFromChat(chatId, ws);
  }

  unsubscribeFromAllChats(ws: ServerWebSocket<unknown>): number {
    return subscriptionManager.unsubscribeFromAllChats(ws);
  }

  cleanupClientSubscriptions(ws: ServerWebSocket<unknown>): void {
    subscriptionManager.cleanupClientSubscriptions(ws);
  }

  // Chat processing
  async handleChatSend(data: ChatSendEvent["data"]): Promise<void> {
    return chatProcessor.handleChatSend(data);
  }

  handleChatCancel(data: ChatCancelEvent["data"]): void {
    chatProcessor.handleChatCancel(data.chatId);
  }

  /**
   * Handle all chat:* events by routing them to appropriate methods
   */
  handleEvent(
    event: string,
    data: unknown,
    ws: ServerWebSocket<unknown>
  ): void {
    logger.debug(`Handling chat event: ${event}`, { data });

    try {
      switch (event) {
        case "chat:send":
          this.validateAndHandleChatSend(data, ws);
          break;

        case "chat:cancel":
          this.validateAndHandleChatCancel(data, ws);
          break;

        case "chat:subscribe":
          this.validateAndHandleChatSubscribe(data, ws);
          break;

        case "chat:unsubscribe":
          this.validateAndHandleChatUnsubscribe(data, ws);
          break;

        case "chat:unsubscribe-all":
          this.unsubscribeFromAllChats(ws);
          break;

        default:
          logger.warn(`Unknown chat event: ${event}`);
          this.sendErrorToClient(
            ws,
            `Unknown event: ${event}`,
            "UNKNOWN_EVENT"
          );
          break;
      }
    } catch (error) {
      logger.error(`Error handling chat event ${event}:`, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to handle event: ${event}`;
      this.sendErrorToClient(ws, errorMessage, "EVENT_HANDLER_ERROR");
    }
  }

  private validateAndHandleChatSend(
    data: unknown,
    _ws: ServerWebSocket<unknown>
  ): void {
    if (!this.isValidChatSendData(data)) {
      throw new Error("Invalid chat:send data structure");
    }
    this.handleChatSend(data);
  }

  private validateAndHandleChatCancel(
    data: unknown,
    _ws: ServerWebSocket<unknown>
  ): void {
    if (!this.isValidChatCancelData(data)) {
      throw new Error("Invalid chat:cancel data structure");
    }
    this.handleChatCancel(data);
  }

  private validateAndHandleChatSubscribe(
    data: unknown,
    ws: ServerWebSocket<unknown>
  ): void {
    if (!this.isValidChatSubscribeData(data)) {
      throw new Error("Invalid chat:subscribe data structure");
    }
    this.subscribeToChat(data.chatId, ws);
  }

  private validateAndHandleChatUnsubscribe(
    data: unknown,
    ws: ServerWebSocket<unknown>
  ): void {
    if (!this.isValidChatUnsubscribeData(data)) {
      throw new Error("Invalid chat:unsubscribe data structure");
    }
    this.unsubscribeFromChat(data.chatId, ws);
  }

  private isValidChatSendData(data: unknown): data is ChatSendEvent["data"] {
    if (typeof data !== "object" || data === null) return false;
    const obj = data as Record<string, unknown>;
    return (
      "chatId" in obj &&
      "model" in obj &&
      "messages" in obj &&
      "mode" in obj &&
      typeof obj.chatId === "number" &&
      typeof obj.model === "string" &&
      Array.isArray(obj.messages) &&
      ["ask", "write"].includes(obj.mode as string)
    );
  }

  private isValidChatCancelData(
    data: unknown
  ): data is ChatCancelEvent["data"] {
    if (typeof data !== "object" || data === null) return false;
    const obj = data as Record<string, unknown>;
    return "chatId" in obj && typeof obj.chatId === "number";
  }

  private isValidChatSubscribeData(
    data: unknown
  ): data is ChatSubscribeEvent["data"] {
    if (typeof data !== "object" || data === null) return false;
    const obj = data as Record<string, unknown>;
    return "chatId" in obj && typeof obj.chatId === "number";
  }

  private isValidChatUnsubscribeData(
    data: unknown
  ): data is ChatUnsubscribeEvent["data"] {
    if (typeof data !== "object" || data === null) return false;
    const obj = data as Record<string, unknown>;
    return "chatId" in obj && typeof obj.chatId === "number";
  }

  private sendErrorToClient(
    ws: ServerWebSocket<unknown>,
    error: string,
    code: string
  ): void {
    try {
      subscriptionManager.sendToClient(ws, {
        event: "chat:error",
        data: {
          chatId: 0, // We don't know the chatId in this context
          error,
          code,
        },
      });
    } catch (sendError) {
      logger.error("Failed to send error response to client:", sendError);
    }
  }

  // Status queries
  getChatStatus(chatId: number): ChatStatus | undefined {
    const isProcessing = chatProcessor.isProcessing(chatId);
    return {
      chatId,
      status: isProcessing ? "in_progress" : "idle",
    } as ChatStatus;
  }

  getActiveChats(): number[] {
    return chatProcessor.getActiveChats();
  }

  getSubscriberCount(chatId: number): number {
    return subscriptionManager.getSubscriberCount(chatId);
  }

  getClientSubscriptions(ws: ServerWebSocket<unknown>): number[] {
    return subscriptionManager.getClientSubscriptions(ws);
  }

  // Service statistics
  getServiceStats() {
    const activeChats = chatProcessor.getActiveChats();
    return {
      activeChats,
      processingChats: activeChats,
      subscribedChats: subscriptionManager.getAllSubscribedChats(),
    };
  }

  // Lifecycle management
  destroy(): void {
    logger.info("Shutting down chat service...");

    // Cancel all ongoing chats
    chatProcessor.destroy();

    // Clear subscriptions
    subscriptionManager.clear();

    logger.info("Chat service shutdown complete");
  }
}

export const chatService = new ChatService();
