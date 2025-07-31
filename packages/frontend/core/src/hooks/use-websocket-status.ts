import { useEffect, useState } from "react";
import { webSocketService, type ConnectionStatus } from "../services";

/**
 * React hook for monitoring WebSocket connection status
 * Provides real-time updates on connection state, reconnection attempts, and errors
 */
export function useWebSocketStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(() =>
    webSocketService.getConnectionStatus()
  );

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = webSocketService.onStatusChange(setStatus);

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const reconnect = async () => {
    try {
      await webSocketService.reconnect();
    } catch (error) {
      console.error("Manual reconnection failed:", error);
    }
  };

  return {
    ...status,
    reconnect,
    // Computed properties for easier use
    isOffline: !status.connected && !status.reconnecting,
    hasError: status.error !== null,
    canRetry: !status.connected && !status.reconnecting,
  };
}

/**
 * React hook for simplified WebSocket connection status
 * Returns only the essential connection state
 */
export function useWebSocketConnection() {
  const status = useWebSocketStatus();

  return {
    connected: status.connected,
    reconnecting: status.reconnecting,
    error: status.error,
    reconnect: status.reconnect,
  };
}
