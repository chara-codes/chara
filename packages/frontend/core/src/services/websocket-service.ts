import type {
  ChatEvent,
  ConnectionStatus,
  RunnerEvent,
  SharedWebSocketCallbacks,
} from "../types/websocket-types";

/**
 * Shared WebSocket service that manages a single connection for both chat and runner services.
 * This eliminates the need for multiple WebSocket connections and provides better resource management.
 *
 * Architecture:
 * - Single WebSocket connection shared across all services
 * - Service registration system for callbacks
 * - Automatic reconnection with exponential backoff
 * - Connection status monitoring
 *
 * Usage:
 * 1. Use ChatService for chat functionality
 * 2. Use RunnerService for runner functionality
 * 3. Both services automatically use this shared connection
 * 4. Use ConnectionStatus components to monitor connection state
 *
 * Service Architecture:
 * - websocket-service.ts: Core WebSocket communication
 * - chat-service.ts: Chat-specific event handling
 * - runner-service.ts: Dev-server operations
 * - All services share the same connection automatically
 */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private callbacks = new Map<string, SharedWebSocketCallbacks>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private reconnectTimer: number | null = null;
  private isConnecting = false;
  private isManuallyDisconnected = false;
  private subscribedChats = new Set<number>();
  private lastConnectedAt: number | null = null;
  private connectionPromise: Promise<void> | null = null;

  // Connection status observers
  private statusObservers = new Set<(status: ConnectionStatus) => void>();

  constructor(private baseUrl?: string) {
    this.baseUrl = baseUrl || this.getDefaultBaseUrl();
  }

  private getDefaultBaseUrl(): string {
    const agentsUrl =
      import.meta.env?.VITE_AGENTS_BASE_URL || "http://localhost:3031";
    // Convert HTTP URL to WebSocket URL
    return agentsUrl.replace(/^https?:\/\//, "ws://");
  }

  private getWebSocketUrl(): string {
    if (!this.baseUrl) {
      throw new Error("Base URL not configured");
    }
    const wsUrl = this.baseUrl.endsWith("/")
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;
    return `${wsUrl}/ws`;
  }

  /**
   * Register callbacks for a specific service
   */
  registerCallbacks(
    serviceId: string,
    callbacks: SharedWebSocketCallbacks
  ): void {
    this.callbacks.set(serviceId, callbacks);
    console.log(
      `Shared WebSocket: Registered callbacks for service ${serviceId}`
    );
  }

  /**
   * Unregister callbacks for a specific service
   */
  unregisterCallbacks(serviceId: string): void {
    this.callbacks.delete(serviceId);
    console.log(
      `Shared WebSocket: Unregistered callbacks for service ${serviceId}`
    );
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(observer: (status: ConnectionStatus) => void): () => void {
    this.statusObservers.add(observer);

    // Immediately send current status
    observer(this.getConnectionStatus());

    // Return unsubscribe function
    return () => {
      this.statusObservers.delete(observer);
    };
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return {
      connected: this.isConnected(),
      reconnecting: this.isConnecting,
      error: null, // TODO: Add error tracking
      lastConnectedAt: this.lastConnectedAt,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Notify all status observers
   */
  private notifyStatusObservers(): void {
    const status = this.getConnectionStatus();
    this.statusObservers.forEach((observer) => {
      try {
        observer(status);
      } catch (error) {
        console.error("Error in status observer:", error);
      }
    });
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<void> {
    // If already connected, return resolved promise
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log("Shared WebSocket: Already connected");
      return Promise.resolve();
    }

    // If connection is in progress, return the existing promise
    if (this.connectionPromise) {
      console.log(
        "Shared WebSocket: Connection already in progress, returning existing promise"
      );
      return this.connectionPromise;
    }

    // Start new connection
    this.connectionPromise = new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error("Connection state inconsistent"));
        return;
      }

      this.isConnecting = true;
      this.isManuallyDisconnected = false;
      this.notifyStatusObservers();

      const wsUrl = this.getWebSocketUrl();
      console.log("Shared WebSocket: Connecting to", wsUrl);

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("Shared WebSocket: Connected successfully");
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.lastConnectedAt = Date.now();
          this.connectionPromise = null;

          // Notify all registered callbacks
          this.callbacks.forEach((callbacks) => {
            if (callbacks.onConnectionOpen) {
              callbacks.onConnectionOpen();
            }
          });

          this.notifyStatusObservers();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error(
              "Shared WebSocket: Failed to parse message:",
              error,
              event.data
            );
          }
        };

        this.ws.onclose = (event) => {
          console.log("Shared WebSocket: Connection closed", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });

          this.isConnecting = false;
          this.ws = null;
          this.connectionPromise = null;

          // Notify all registered callbacks
          this.callbacks.forEach((callbacks) => {
            if (callbacks.onConnectionClose) {
              callbacks.onConnectionClose(event.wasClean);
            }
          });

          this.notifyStatusObservers();

          // Auto-reconnect unless manually disconnected
          if (!this.isManuallyDisconnected && !event.wasClean) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error("Shared WebSocket: Connection error:", error);
          this.isConnecting = false;
          this.connectionPromise = null;

          // Notify all registered callbacks
          this.callbacks.forEach((callbacks) => {
            if (callbacks.onConnectionError) {
              callbacks.onConnectionError(error);
            }
          });

          this.notifyStatusObservers();
          reject(new Error("Failed to connect to WebSocket"));
        };
      } catch (error) {
        this.isConnecting = false;
        this.connectionPromise = null;
        console.error("Shared WebSocket: Failed to create WebSocket:", error);
        this.notifyStatusObservers();
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.isManuallyDisconnected = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Unsubscribe from all chats before disconnecting
    if (this.subscribedChats.size > 0) {
      this.unsubscribeFromAllChats();
    }

    if (this.ws) {
      console.log("Shared WebSocket: Disconnecting");
      this.ws.close(1000, "Manual disconnect");
      this.ws = null;
    }

    this.connectionPromise = null;
    this.notifyStatusObservers();
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Send a message to the WebSocket server
   */
  private send(event: string, data: unknown = {}): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("Shared WebSocket: Cannot send message, not connected");
      throw new Error("WebSocket not connected");
    }

    const message = { event, data };

    try {
      this.ws.send(JSON.stringify(message));
      console.log("Shared WebSocket: Sent message:", message);
    } catch (error) {
      console.error("Shared WebSocket: Failed to send message:", error);
      throw error;
    }
  }

  // Chat-related methods
  /**
   * Subscribe to a chat
   */
  subscribeToChat(chatId: number): void {
    this.send("chat:subscribe", { chatId });
    this.subscribedChats.add(chatId);
    console.log(`Shared WebSocket: Subscribed to chat ${chatId}`);
  }

  /**
   * Unsubscribe from a chat
   */
  unsubscribeFromChat(chatId: number): void {
    this.send("chat:unsubscribe", { chatId });
    this.subscribedChats.delete(chatId);
    console.log(`Shared WebSocket: Unsubscribed from chat ${chatId}`);
  }

  /**
   * Unsubscribe from all chats
   */
  unsubscribeFromAllChats(): void {
    this.send("chat:unsubscribe-all", {});
    this.subscribedChats.clear();
    console.log("Shared WebSocket: Unsubscribed from all chats");
  }

  /**
   * Send a message to a chat
   */
  sendChatMessage(data: {
    chatId: number;
    model: string;
    messages: unknown[];
    userMessageId?: string;
    mode: "write" | "ask";
  }): void {
    this.send("chat:send", data);

    // Ensure we're subscribed to this chat
    if (!this.subscribedChats.has(data.chatId)) {
      this.subscribeToChat(data.chatId);
    }
  }

  /**
   * Cancel a chat message
   */
  cancelChatMessage(chatId: number): void {
    this.send("chat:cancel", { chatId });
  }

  /**
   * Get list of subscribed chats
   */
  getSubscribedChats(): number[] {
    return Array.from(this.subscribedChats);
  }

  // Runner-related methods
  /**
   * Send a command to the runner
   */
  sendRunnerCommand(
    event: "runner:get-status" | "runner:restart" | "runner:clear-logs",
    data: unknown = {}
  ): void {
    this.send(event, data);
  }

  /**
   * Get runner status
   */
  getRunnerStatus(processId?: string): void {
    this.sendRunnerCommand("runner:get-status", processId ? { processId } : {});
  }

  /**
   * Restart runner process
   */
  restartRunner(processId: string, newCommand?: string): void {
    const data: Record<string, unknown> = { processId };
    if (newCommand) {
      data.newCommand = newCommand;
    }
    this.sendRunnerCommand("runner:restart", data);
  }

  /**
   * Clear logs for a process
   */
  clearRunnerLogs(processId: string): void {
    this.sendRunnerCommand("runner:clear-logs", { processId });
  }

  /**
   * Force reconnection (useful for manual retry)
   */
  async reconnect(): Promise<void> {
    console.log("Shared WebSocket: Manual reconnection requested");
    this.disconnect();

    // Small delay to ensure clean disconnect
    await new Promise((resolve) => setTimeout(resolve, 100));

    return this.connect();
  }

  private handleMessage(message: ChatEvent | RunnerEvent): void {
    // Handle chat events
    if (message.event.startsWith("chat:")) {
      this.handleChatEvent(message as ChatEvent);
    }
    // Handle runner events
    else if (message.event.startsWith("runner:")) {
      this.handleRunnerEvent(message as RunnerEvent);
    } else {
      console.log("Shared WebSocket: Unhandled event:", message.event);
    }
  }

  private handleChatEvent(event: ChatEvent): void {
    console.log("Shared WebSocket: Received chat event:", event);

    // Broadcast to all registered callbacks
    this.callbacks.forEach((callbacks) => {
      switch (event.event) {
        case "chat:status":
          if (callbacks.onChatStatus) {
            callbacks.onChatStatus(event.data as any);
          }
          break;

        case "chat:chunk":
          if (callbacks.onChatChunk) {
            callbacks.onChatChunk(event.data as any);
          }
          break;

        case "chat:complete":
          if (callbacks.onChatComplete) {
            callbacks.onChatComplete(event.data as any);
          }
          break;

        case "chat:error":
          if (callbacks.onChatError) {
            callbacks.onChatError(event.data as any);
          }
          break;

        default:
          console.log("Shared WebSocket: Unhandled chat event:", event.event);
      }
    });
  }

  private handleRunnerEvent(runnerEvent: RunnerEvent): void {
    console.log("Shared WebSocket: Received runner event:", runnerEvent);

    // Broadcast to all registered callbacks
    this.callbacks.forEach((callbacks) => {
      switch (runnerEvent.event) {
        case "runner:started":
          if (callbacks.onRunnerStarted) {
            callbacks.onRunnerStarted(runnerEvent.data as any);
          }
          break;

        case "runner:stopped":
          if (callbacks.onRunnerStopped) {
            callbacks.onRunnerStopped(runnerEvent.data as any);
          }
          break;

        case "runner:output":
          if (callbacks.onRunnerOutput) {
            callbacks.onRunnerOutput(runnerEvent.data as any);
          }
          break;

        case "runner:error":
          if (callbacks.onRunnerError) {
            callbacks.onRunnerError(runnerEvent.data as any);
          }
          break;

        case "runner:status":
          if (callbacks.onRunnerStatus) {
            callbacks.onRunnerStatus(runnerEvent.data as any);
          }
          break;

        case "runner:restarted":
          if (callbacks.onRunnerRestarted) {
            callbacks.onRunnerRestarted(runnerEvent.data as any);
          }
          break;

        case "runner:info-updated":
          if (callbacks.onRunnerInfoUpdated) {
            callbacks.onRunnerInfoUpdated(runnerEvent.data as any);
          }
          break;

        default:
          console.log(
            "Shared WebSocket: Unhandled runner event:",
            runnerEvent.event
          );
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Shared WebSocket: Max reconnection attempts reached");
      this.notifyStatusObservers();
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Shared WebSocket: Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`
    );

    this.reconnectTimer = window.setTimeout(() => {
      console.log(
        `Shared WebSocket: Attempting to reconnect (attempt ${this.reconnectAttempts})`
      );

      this.connect().catch((error) => {
        console.error("Shared WebSocket: Reconnection failed:", error);
        // Exponential backoff with jitter
        this.reconnectDelay = Math.min(
          this.reconnectDelay * 2 + Math.random() * 1000,
          this.maxReconnectDelay
        );
        this.notifyStatusObservers();
      });
    }, this.reconnectDelay);
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();
