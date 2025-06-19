export interface RunnerEvent {
  event:
    | "runner:started"
    | "runner:stopped"
    | "runner:output"
    | "runner:error"
    | "runner:status"
    | "runner:restarted"
    | "runner:info-updated";
  data: any;
}

export interface RunnerServiceCallbacks {
  onRunnerStarted?: (data: {
    processId: string;
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
      pid: number;
      serverUrl?: string;
      os: string;
      shell: string;
      startTime: Date;
    };
  }) => void;
  onRunnerStopped?: (data: {
    processId: string;
    exitCode: number;
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
      uptime?: number;
    };
  }) => void;
  onRunnerOutput?: (data: {
    processId: string;
    type: "stdout" | "stderr";
    chunk: string;
    command: string;
    cwd: string;
  }) => void;
  onRunnerError?: (data: {
    processId: string;
    error: string;
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
    };
  }) => void;
  onRunnerStatus?: (data: {
    processId: string;
    status: "starting" | "active" | "stopped" | "error";
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
      pid?: number;
      uptime?: number;
      serverUrl?: string;
      host?: string;
      port?: number;
    };
    logs?: Array<{
      id: string;
      timestamp: Date;
      type: "stdout" | "stderr" | "error";
      content: string;
      processId?: string;
    }>;
  }) => void;
  onRunnerRestarted?: (data: {
    processId: string;
    oldCommand: string;
    newCommand: string;
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
      pid?: number;
    };
  }) => void;
  onRunnerInfoUpdated?: (data: {
    processId: string;
    updates: Partial<{
      name: string;
      serverUrl: string;
    }>;
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
      pid?: number;
      serverUrl?: string;
    };
  }) => void;
  onConnectionOpen?: () => void;
  onConnectionClose?: (wasClean: boolean) => void;
  onConnectionError?: (error: Event) => void;
}

export class RunnerService {
  private ws: WebSocket | null = null;
  private callbacks: RunnerServiceCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private reconnectTimer: number | null = null;
  private isConnecting = false;
  private isManuallyDisconnected = false;

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
    const wsUrl = this.baseUrl.endsWith("/")
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;
    return `${wsUrl}/ws`;
  }

  /**
   * Connect to the WebSocket server
   */
  connect(callbacks: RunnerServiceCallbacks = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log("Runner Service: Already connected");
        resolve();
        return;
      }

      if (this.isConnecting) {
        console.log("Runner Service: Connection already in progress");
        return;
      }

      this.isConnecting = true;
      this.isManuallyDisconnected = false;
      this.callbacks = { ...this.callbacks, ...callbacks };

      const wsUrl = this.getWebSocketUrl();
      console.log("Runner Service: Connecting to", wsUrl);

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("Runner Service: Connected to WebSocket");
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;

          if (this.callbacks.onConnectionOpen) {
            this.callbacks.onConnectionOpen();
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const runnerEvent: RunnerEvent = JSON.parse(event.data);
            this.handleRunnerEvent(runnerEvent);
          } catch (error) {
            console.error(
              "Runner Service: Failed to parse message:",
              error,
              event.data,
            );
          }
        };

        this.ws.onclose = (event) => {
          console.log("Runner Service: Connection closed", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });

          this.isConnecting = false;
          this.ws = null;

          if (this.callbacks.onConnectionClose) {
            this.callbacks.onConnectionClose(event.wasClean);
          }

          // Auto-reconnect unless manually disconnected
          if (!this.isManuallyDisconnected && !event.wasClean) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error("Runner Service: WebSocket error:", error);
          this.isConnecting = false;

          if (this.callbacks.onConnectionError) {
            this.callbacks.onConnectionError(error);
          }
          reject(new Error("Failed to connect to WebSocket"));
        };
      } catch (error) {
        this.isConnecting = false;
        console.error("Runner Service: Failed to create WebSocket:", error);
        reject(error);
      }
    });
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

    if (this.ws) {
      console.log("Runner Service: Disconnecting WebSocket");
      this.ws.close(1000, "Manual disconnect");
      this.ws = null;
    }
  }

  /**
   * Send a command to the runner
   */
  sendCommand(
    event: "runner:get-status" | "runner:restart",
    data: any = {},
  ): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn(
        "Runner Service: Cannot send command, WebSocket not connected",
      );
      return;
    }

    const message = {
      event,
      data,
    };

    try {
      this.ws.send(JSON.stringify(message));
      console.log("Runner Service: Sent command:", message);
    } catch (error) {
      console.error("Runner Service: Failed to send command:", error);
    }
  }

  /**
   * Get runner status
   */
  getStatus(processId?: string): void {
    this.sendCommand("runner:get-status", processId ? { processId } : {});
  }

  /**
   * Restart runner process
   */
  restart(processId: string, newCommand?: string): void {
    const data: any = { processId };
    if (newCommand) {
      data.newCommand = newCommand;
    }
    this.sendCommand("runner:restart", data);
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Update callbacks
   */
  updateCallbacks(callbacks: RunnerServiceCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  private handleRunnerEvent(runnerEvent: RunnerEvent): void {
    console.log("Runner Service: Received event:", runnerEvent);

    switch (runnerEvent.event) {
      case "runner:started":
        if (this.callbacks.onRunnerStarted) {
          this.callbacks.onRunnerStarted(runnerEvent.data);
        }
        break;

      case "runner:stopped":
        if (this.callbacks.onRunnerStopped) {
          this.callbacks.onRunnerStopped(runnerEvent.data);
        }
        break;

      case "runner:output":
        if (this.callbacks.onRunnerOutput) {
          this.callbacks.onRunnerOutput(runnerEvent.data);
        }
        break;

      case "runner:error":
        if (this.callbacks.onRunnerError) {
          this.callbacks.onRunnerError(runnerEvent.data);
        }
        break;

      case "runner:status":
        if (this.callbacks.onRunnerStatus) {
          this.callbacks.onRunnerStatus(runnerEvent.data);
        }
        break;

      case "runner:restarted":
        if (this.callbacks.onRunnerRestarted) {
          this.callbacks.onRunnerRestarted(runnerEvent.data);
        }
        break;

      case "runner:info-updated":
        if (this.callbacks.onRunnerInfoUpdated) {
          this.callbacks.onRunnerInfoUpdated(runnerEvent.data);
        }
        break;

      default:
        console.log("Runner Service: Unhandled event:", runnerEvent.event);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Runner Service: Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Runner Service: Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`,
    );

    this.reconnectTimer = window.setTimeout(() => {
      console.log(
        `Runner Service: Attempting to reconnect (attempt ${this.reconnectAttempts})`,
      );

      this.connect(this.callbacks).catch((error) => {
        console.error("Runner Service: Reconnection failed:", error);
        // Exponential backoff with jitter
        this.reconnectDelay = Math.min(
          this.reconnectDelay * 2 + Math.random() * 1000,
          this.maxReconnectDelay,
        );
      });
    }, this.reconnectDelay);
  }
}

// Create a singleton instance
export const runnerService = new RunnerService();

// Export types for external use
export type { RunnerEvent, RunnerServiceCallbacks };
