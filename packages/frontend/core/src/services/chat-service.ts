import type { MessageContent, ToolCall } from "../types";
import type {
  ConnectionStatus,
  SharedWebSocketCallbacks,
} from "../types/websocket-types";
import { webSocketService } from "./websocket-service";

export interface WebSocketChatCallbacks {
  onChatStatus?: (status: {
    chatId: number;
    status: string;
    error?: string;
  }) => void;
  onTextDelta?: (delta: string) => void;
  onThinkingDelta?: (delta: string) => void;
  onToolCall?: (toolCall: ToolCall) => void;
  onChatComplete?: (data: {
    chatId: number;
    fullResponse: string;
    usage?: Record<string, unknown>;
  }) => void;
  onChatError?: (error: string, code?: string) => void;
  onConnectionOpen?: () => void;
  onConnectionClose?: (wasClean: boolean) => void;
  onConnectionError?: (error: Event) => void;
}

export class ChatService {
  private static readonly SERVICE_ID = "chat-service";
  private activeChatCallbacks = new Map<number, WebSocketChatCallbacks>();
  private connectionStatusCallbacks = new Set<
    (status: ConnectionStatus) => void
  >();

  constructor() {
    this.setupSharedCallbacks();
  }

  private setupSharedCallbacks() {
    const sharedCallbacks: SharedWebSocketCallbacks = {
      onChatStatus: (status) => {
        const callbacks = this.activeChatCallbacks.get(status.chatId);
        if (callbacks?.onChatStatus) {
          callbacks.onChatStatus(status);
        }
      },
      onChatChunk: (data) => {
        const callbacks = this.activeChatCallbacks.get(data.chatId);
        if (!callbacks) return;

        if (data.type === "text") {
          if (callbacks.onTextDelta) {
            callbacks.onTextDelta(data.chunk);
          }
        } else if (data.type === "tool-call") {
          try {
            console.log("WebSocket: Received tool-call chunk:", data.chunk);
            const parsedChunk = JSON.parse(data.chunk);
            if (parsedChunk.type === "tool-call") {
              const toolCall: ToolCall = {
                id: parsedChunk.toolCallId,
                name: parsedChunk.toolName,
                arguments: parsedChunk.args || {},
                status: "in-progress",
                timestamp: new Date().toISOString(),
              };
              console.log("WebSocket: Parsed tool call:", toolCall);
              if (callbacks.onToolCall) {
                callbacks.onToolCall(toolCall);
              }
            }
          } catch (error) {
            console.error("Failed to parse tool call:", error, data.chunk);
          }
        } else if (data.type === "tool-result") {
          try {
            console.log("WebSocket: Received tool-result chunk:", data.chunk);
            const parsedChunk = JSON.parse(data.chunk);
            if (parsedChunk.type === "tool-result") {
              const toolResult: ToolCall = {
                id: parsedChunk.toolCallId,
                name: parsedChunk.toolName,
                arguments: parsedChunk.args || {},
                status:
                  parsedChunk.result?.error ||
                  parsedChunk.result?.status === "error"
                    ? "error"
                    : "success",
                result: {
                  content: parsedChunk.result?.message || "",
                  data: parsedChunk.result,
                  error:
                    parsedChunk.result?.status !== "success"
                      ? parsedChunk.result?.error
                      : undefined,
                },
                timestamp: new Date().toISOString(),
              };
              console.log("WebSocket: Parsed tool result:", toolResult);
              if (callbacks.onToolCall) {
                callbacks.onToolCall(toolResult);
              }
            }
          } catch (error) {
            console.error("Failed to parse tool result:", error, data.chunk);
          }
        }
      },
      onChatComplete: (data) => {
        const callbacks = this.activeChatCallbacks.get(data.chatId);
        if (callbacks?.onChatComplete) {
          callbacks.onChatComplete(data);
        }
      },
      onChatError: (data) => {
        const callbacks = this.activeChatCallbacks.get(data.chatId);
        if (callbacks?.onChatError) {
          callbacks.onChatError(data.error, data.code);
        }
      },
      onConnectionOpen: () => {
        // Notify all active callbacks
        for (const callbacks of this.activeChatCallbacks.values()) {
          if (callbacks.onConnectionOpen) {
            callbacks.onConnectionOpen();
          }
        }
      },
      onConnectionClose: (wasClean) => {
        // Notify all active callbacks
        for (const callbacks of this.activeChatCallbacks.values()) {
          if (callbacks.onConnectionClose) {
            callbacks.onConnectionClose(wasClean);
          }
        }
      },
      onConnectionError: (error) => {
        // Notify all active callbacks
        for (const callbacks of this.activeChatCallbacks.values()) {
          if (callbacks.onConnectionError) {
            callbacks.onConnectionError(error);
          }
        }
      },
    };

    webSocketService.registerCallbacks(ChatService.SERVICE_ID, sharedCallbacks);

    // Subscribe to connection status changes
    webSocketService.onStatusChange((status) => {
      this.connectionStatusCallbacks.forEach((callback) => {
        try {
          callback(status);
        } catch (error) {
          console.error("Error in connection status callback:", error);
        }
      });
    });
  }

  /**
   * Connect to WebSocket server (delegates to shared service)
   */
  async connect(): Promise<void> {
    return webSocketService.connect();
  }

  /**
   * Disconnect from WebSocket server (delegates to shared service)
   */
  disconnect(): void {
    // Unregister our callbacks but don't disconnect the shared service
    // as other services might be using it
    webSocketService.unregisterCallbacks(ChatService.SERVICE_ID);
    this.activeChatCallbacks.clear();
    this.connectionStatusCallbacks.clear();
  }

  /**
   * Check if connected
   */
  isWebSocketConnected(): boolean {
    return webSocketService.isConnected();
  }

  /**
   * Subscribe to a chat and register callbacks
   */
  subscribeToChat(chatId: number, callbacks: WebSocketChatCallbacks): void {
    this.activeChatCallbacks.set(chatId, callbacks);
    webSocketService.subscribeToChat(chatId);
  }

  /**
   * Unsubscribe from a chat
   */
  unsubscribeFromChat(chatId: number): void {
    this.activeChatCallbacks.delete(chatId);
    webSocketService.unsubscribeFromChat(chatId);
  }

  /**
   * Unsubscribe from all chats
   */
  unsubscribeFromAllChats(): void {
    this.activeChatCallbacks.clear();
    webSocketService.unsubscribeFromAllChats();
  }

  /**
   * Cancel an ongoing chat message/response
   *
   * Sends a 'chat:cancel' event to the WebSocket server to abort the current
   * chat agent execution. This is used when the user clicks the "Stop response"
   * button during an active chat response.
   *
   * @param chatId - The ID of the chat to cancel
   * @throws Will throw an error if the WebSocket is not connected or if the cancel message fails to send
   *
   * @example
   * ```typescript
   * // Cancel the active chat response
   * try {
   *   chatService.cancelMessage(123);
   * } catch (error) {
   *   console.error('Failed to cancel chat:', error);
   * }
   * ```
   */
  cancelMessage(chatId: number): void {
    try {
      webSocketService.cancelChatMessage(chatId);
    } catch (error) {
      console.error("Failed to cancel message via WebSocket:", error);

      // Notify error to chat callbacks
      const callbacks = this.activeChatCallbacks.get(chatId);
      if (callbacks?.onChatError) {
        callbacks.onChatError(
          error instanceof Error ? error.message : "Failed to cancel message",
          "CANCEL_ERROR"
        );
      }

      throw error;
    }
  }

  /**
   * Send a message to a chat
   */
  sendMessage(data: {
    chatId: number;
    model: string;
    messages: Array<{
      role: "user" | "assistant";
      content: string | MessageContent[];
      toolCalls?: unknown[];
    }>;
    userMessageId?: string;
    mode: "write" | "ask";
  }): void {
    const { chatId, model, messages, userMessageId, mode } = data;

    // Ensure we're subscribed to this chat
    if (!this.activeChatCallbacks.has(chatId)) {
      console.warn(
        `Not subscribed to chat ${chatId}, subscribing automatically`
      );
      this.subscribeToChat(chatId, {});
    }

    try {
      // Send the message via websocket service
      webSocketService.sendChatMessage({
        chatId,
        model,
        messages,
        userMessageId,
        mode,
      });
    } catch (error) {
      console.error("Failed to send message via WebSocket:", error);

      // Notify error to chat callbacks
      const callbacks = this.activeChatCallbacks.get(chatId);
      if (callbacks?.onChatError) {
        callbacks.onChatError(
          error instanceof Error ? error.message : "Failed to send message",
          "SEND_ERROR"
        );
      }

      throw error;
    }
  }

  /**
   * Get list of subscribed chats
   */
  getSubscribedChats(): number[] {
    return Array.from(this.activeChatCallbacks.keys());
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionStatusChange(
    callback: (status: ConnectionStatus) => void
  ): () => void {
    this.connectionStatusCallbacks.add(callback);

    // Immediately call with current status
    callback(webSocketService.getConnectionStatus());

    // Return unsubscribe function
    return () => {
      this.connectionStatusCallbacks.delete(callback);
    };
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return webSocketService.getConnectionStatus();
  }

  /**
   * Force reconnection
   */
  async reconnect(): Promise<void> {
    return webSocketService.reconnect();
  }

  /**
   * Update callbacks for a specific chat
   */
  updateChatCallbacks(chatId: number, callbacks: WebSocketChatCallbacks): void {
    if (this.activeChatCallbacks.has(chatId)) {
      this.activeChatCallbacks.set(chatId, {
        ...this.activeChatCallbacks.get(chatId),
        ...callbacks,
      });
    }
  }
}

// Create singleton instance
export const chatService = new ChatService();
