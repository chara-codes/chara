import type {
  ConnectionStatus,
  RunnerEvent,
  RunnerServiceCallbacks,
  SharedWebSocketCallbacks,
} from "../types/websocket-types";
import { webSocketService } from "./websocket-service";

export class RunnerService {
  private static readonly SERVICE_ID = "runner-service";
  private connectionStatusCallbacks = new Set<
    (status: ConnectionStatus) => void
  >();

  constructor() {
    this.setupSharedCallbacks();
  }

  private setupSharedCallbacks() {
    const sharedCallbacks: SharedWebSocketCallbacks = {
      onRunnerStarted: (_data) => {
        // All runner callbacks are handled through the registered callbacks
        // This is a placeholder - actual callbacks are managed per connection
      },
      onRunnerStopped: (_data) => {
        // Handled through registered callbacks
      },
      onRunnerOutput: (_data) => {
        // Handled through registered callbacks
      },
      onRunnerError: (_data) => {
        // Handled through registered callbacks
      },
      onRunnerStatus: (_data) => {
        // Handled through registered callbacks
      },
      onRunnerRestarted: (_data) => {
        // Handled through registered callbacks
      },
      onRunnerInfoUpdated: (_data) => {
        // Handled through registered callbacks
      },
      onConnectionOpen: () => {
        // Handled through registered callbacks
      },
      onConnectionClose: (_wasClean) => {
        // Handled through registered callbacks
      },
      onConnectionError: (_error) => {
        // Handled through registered callbacks
      },
    };

    webSocketService.registerCallbacks(
      RunnerService.SERVICE_ID,
      sharedCallbacks
    );

    // Subscribe to connection status changes
    webSocketService.onStatusChange((status) => {
      this.connectionStatusCallbacks.forEach((callback) => {
        try {
          callback(status);
        } catch (error) {
          console.error("Error in runner connection status callback:", error);
        }
      });
    });
  }

  /**
   * Connect to the WebSocket server (delegates to shared service)
   */
  connect(callbacks: RunnerServiceCallbacks = {}): Promise<void> {
    // Update the shared callbacks to include the provided callbacks
    const sharedCallbacks: SharedWebSocketCallbacks = {
      onRunnerStarted: callbacks.onRunnerStarted,
      onRunnerStopped: callbacks.onRunnerStopped,
      onRunnerOutput: callbacks.onRunnerOutput,
      onRunnerError: callbacks.onRunnerError,
      onRunnerStatus: callbacks.onRunnerStatus,
      onRunnerRestarted: callbacks.onRunnerRestarted,
      onRunnerInfoUpdated: callbacks.onRunnerInfoUpdated,
      onConnectionOpen: callbacks.onConnectionOpen,
      onConnectionClose: callbacks.onConnectionClose,
      onConnectionError: callbacks.onConnectionError,
    };

    webSocketService.registerCallbacks(
      RunnerService.SERVICE_ID,
      sharedCallbacks
    );

    return webSocketService.connect();
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    // Unregister our callbacks but don't disconnect the websocket service
    // as other services might be using it
    webSocketService.unregisterCallbacks(RunnerService.SERVICE_ID);
    this.connectionStatusCallbacks.clear();
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return webSocketService.isConnected();
  }

  /**
   * Send a command to the runner
   */
  sendCommand(
    event: "runner:get-status" | "runner:restart" | "runner:clear-logs",
    data: unknown = {}
  ): void {
    try {
      webSocketService.sendRunnerCommand(event, data);
    } catch (error) {
      console.error("Failed to send runner command:", error);
      throw error;
    }
  }

  /**
   * Get runner status
   */
  getStatus(processId?: string): void {
    webSocketService.getRunnerStatus(processId);
  }

  /**
   * Restart runner process
   */
  restart(processId: string, newCommand?: string): void {
    webSocketService.restartRunner(processId, newCommand);
  }

  /**
   * Clear logs for a process
   */
  clearLogs(processId: string): void {
    webSocketService.clearRunnerLogs(processId);
  }

  /**
   * Update callbacks
   */
  updateCallbacks(callbacks: RunnerServiceCallbacks): void {
    const sharedCallbacks: SharedWebSocketCallbacks = {
      onRunnerStarted: callbacks.onRunnerStarted,
      onRunnerStopped: callbacks.onRunnerStopped,
      onRunnerOutput: callbacks.onRunnerOutput,
      onRunnerError: callbacks.onRunnerError,
      onRunnerStatus: callbacks.onRunnerStatus,
      onRunnerRestarted: callbacks.onRunnerRestarted,
      onRunnerInfoUpdated: callbacks.onRunnerInfoUpdated,
      onConnectionOpen: callbacks.onConnectionOpen,
      onConnectionClose: callbacks.onConnectionClose,
      onConnectionError: callbacks.onConnectionError,
    };

    webSocketService.registerCallbacks(
      RunnerService.SERVICE_ID,
      sharedCallbacks
    );
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
}

// Create a singleton instance
export const runnerService = new RunnerService();

// Export types for external use
export type { RunnerEvent, RunnerServiceCallbacks };
