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
 * - Automatic reconnection with exponential backoff and proper debouncing
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

  // Reconnection state
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private reconnectTimer: number | null = null;

  // Connection state
  private isConnecting = false;
  private isManuallyDisconnected = false;
  private connectionPromise: Promise<void> | null = null;
  private lastConnectionAttempt = 0;
  private minConnectionInterval = 1000; // Minimum 1 second between connection attempts

  // Chat subscriptions
  private subscribedChats = new Set<number>();
  private lastConnectedAt: number | null = null;

  // Connection status observers
  private statusObservers = new Set<(status: ConnectionStatus) => void>();

  // Error tracking
  private lastError: string | null = null;

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
      error: this.lastError,
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
   * Connect to the WebSocket server with proper debouncing
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

    // Debounce connection attempts to prevent rapid reconnections
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastConnectionAttempt;
    if (timeSinceLastAttempt < this.minConnectionInterval) {
      const waitTime = this.minConnectionInterval - timeSinceLastAttempt;
      console.log(
        `Shared WebSocket: Debouncing connection attempt, waiting ${waitTime}ms`
      );

      this.connectionPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          this.connectionPromise = null;
          this.connect().then(resolve).catch(reject);
        }, waitTime);
      });

      return this.connectionPromise;
    }

    this.lastConnectionAttempt = now;

    // Start new connection
    this.connectionPromise = new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error("Connection state inconsistent"));
        return;
      }

      this.isConnecting = true;
      this.isManuallyDisconnected = false;
      this.lastError = null;
      this.notifyStatusObservers();

      const wsUrl = this.getWebSocketUrl();
      console.log("Shared WebSocket: Connecting to", wsUrl);

      try {
        this.ws = new WebSocket(wsUrl);

        // Set up connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.error(
              "Shared WebSocket: Connection timeout after 10 seconds"
            );
            this.lastError = "Connection timeout";
            this.ws.close(4001, "Connection timeout");
          }
        }, 10000); // 10 second timeout

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log("Shared WebSocket: Connected successfully");

          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.lastConnectedAt = Date.now();
          this.lastError = null;
          this.connectionPromise = null;

          // Notify all registered callbacks
          this.callbacks.forEach((callbacks) => {
            if (callbacks.onConnectionOpen) {
              try {
                callbacks.onConnectionOpen();
              } catch (error) {
                console.error("Error in onConnectionOpen callback:", error);
              }
            }
          });

          // Re-subscribe to chats if we have any
          if (this.subscribedChats.size > 0) {
            console.log(
              "Shared WebSocket: Re-subscribing to chats after reconnection"
            );
            const chatsToResubscribe = Array.from(this.subscribedChats);
            this.subscribedChats.clear();
            chatsToResubscribe.forEach((chatId) => {
              this.subscribeToChat(chatId);
            });
          }

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
          clearTimeout(connectionTimeout);
          console.log("Shared WebSocket: Connection closed", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            wasConnecting: this.isConnecting,
            isManuallyDisconnected: this.isManuallyDisconnected,
            hasConnectionPromise: !!this.connectionPromise,
          });

          const wasConnecting = this.isConnecting;
          this.isConnecting = false;
          this.ws = null;

          // Set error state for status tracking
          if (!event.wasClean && !this.isManuallyDisconnected) {
            this.lastError = `Connection closed unexpectedly (code: ${event.code})`;
          } else if (event.wasClean || this.isManuallyDisconnected) {
            this.lastError = null;
          }

          // Handle connection promise
          if (this.connectionPromise) {
            this.connectionPromise = null;

            if (wasConnecting && !this.isManuallyDisconnected) {
              // Connection failed during initial connect
              const errorMessage =
                event.reason || `Connection failed (code: ${event.code})`;
              console.log(
                "Shared WebSocket: Rejecting connection promise:",
                errorMessage
              );
              reject(new Error(errorMessage));
            } else {
              console.log(
                "Shared WebSocket: Connection was already established or manually disconnected"
              );
            }
          }

          // Notify all registered callbacks
          this.callbacks.forEach((callbacks) => {
            if (callbacks.onConnectionClose) {
              try {
                callbacks.onConnectionClose(event.wasClean);
              } catch (error) {
                console.error("Error in onConnectionClose callback:", error);
              }
            }
          });

          this.notifyStatusObservers();

          // Auto-reconnect unless manually disconnected or clean close
          if (!this.isManuallyDisconnected && !event.wasClean) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error("Shared WebSocket: Connection error occurred", {
            error,
            readyState: this.ws?.readyState,
            isConnecting: this.isConnecting,
            hasConnectionPromise: !!this.connectionPromise,
          });

          // Set error state
          this.lastError = "WebSocket connection error";

          // Notify callbacks about the error
          this.callbacks.forEach((callbacks) => {
            if (callbacks.onConnectionError) {
              try {
                callbacks.onConnectionError(error);
              } catch (callbackError) {
                console.error(
                  "Error in onConnectionError callback:",
                  callbackError
                );
              }
            }
          });

          // Note: Don't reject here, let onclose handle it
        };
      } catch (error) {
        console.error("Shared WebSocket: Failed to create WebSocket:", error);
        this.isConnecting = false;
        this.connectionPromise = null;
        this.lastError =
          error instanceof Error ? error.message : "Failed to create WebSocket";
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
    console.log("Shared WebSocket: Manual disconnect requested");

    this.isManuallyDisconnected = true;
    this.clearReconnectTimer();

    // Unsubscribe from all chats before disconnecting
    if (this.subscribedChats.size > 0) {
      this.unsubscribeFromAllChats();
    }

    if (this.ws) {
      console.log("Shared WebSocket: Closing connection");
      this.ws.close(1000, "Manual disconnect");
      this.ws = null;
    }

    // Clean up connection state
    if (this.connectionPromise) {
      this.connectionPromise = null;
    }
    this.isConnecting = false;
    this.lastError = null;
    this.notifyStatusObservers();
  }

  /**
   * Clear reconnection timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
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

    // Clear any pending reconnection
    this.clearReconnectTimer();
    this.reconnectAttempts = 0;

    // Disconnect cleanly
    this.disconnect();

    // Small delay to ensure clean disconnect
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Reset manual disconnect flag and connect
    this.isManuallyDisconnected = false;
    return this.connect();
  }

  /**
   * Schedule reconnection with exponential backoff and jitter
   */
  private scheduleReconnect(): void {
    // Clear any existing timer
    this.clearReconnectTimer();

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Shared WebSocket: Max reconnection attempts reached");
      this.lastError = `Failed to reconnect after ${this.maxReconnectAttempts} attempts`;
      this.notifyStatusObservers();
      return;
    }

    if (this.isManuallyDisconnected) {
      console.log("Shared WebSocket: Manual disconnect, skipping reconnection");
      return;
    }

    this.reconnectAttempts++;

    // Calculate delay with exponential backoff and jitter
    const baseDelay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    // Add jitter (±25% of the base delay)
    const jitter = baseDelay * 0.25 * (Math.random() * 2 - 1);
    const delay = Math.max(baseDelay + jitter, this.baseReconnectDelay);

    console.log(
      `Shared WebSocket: Scheduling reconnection attempt ${
        this.reconnectAttempts
      }/${this.maxReconnectAttempts} in ${Math.round(delay)}ms`
    );

    this.reconnectTimer = window.setTimeout(() => {
      console.log(
        `Shared WebSocket: Attempting to reconnect (attempt ${this.reconnectAttempts})`
      );

      this.connect().catch((error) => {
        console.error("Shared WebSocket: Reconnection failed:", error);
        this.lastError = `Reconnection attempt ${this.reconnectAttempts} failed: ${error.message}`;
        this.notifyStatusObservers();

        // Only schedule next reconnection if we haven't exceeded max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log("Shared WebSocket: Scheduling next reconnection attempt");
          this.scheduleReconnect();
        } else {
          console.error(
            "Shared WebSocket: Max reconnection attempts reached, giving up"
          );
        }
      });
    }, delay);
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
      try {
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
      } catch (error) {
        console.error("Error in chat event callback:", error);
      }
    });
  }

  private handleRunnerEvent(runnerEvent: RunnerEvent): void {
    console.log("Shared WebSocket: Received runner event:", runnerEvent);

    // Broadcast to all registered callbacks
    this.callbacks.forEach((callbacks) => {
      try {
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
      } catch (error) {
        console.error("Error in runner event callback:", error);
      }
    });
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();
