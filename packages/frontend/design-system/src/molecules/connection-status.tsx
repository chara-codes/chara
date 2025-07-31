"use client";

import { webSocketService } from "@chara-codes/core";
import type { ConnectionStatus } from "@chara-codes/core";
import { useEffect, useState } from "react";

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function WebSocketConnectionStatus({
  className = "",
  showDetails = false,
}: ConnectionStatusProps) {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false,
    error: null,
    lastConnectedAt: null,
    reconnectAttempts: 0,
  });

  useEffect(() => {
    // Subscribe to connection status changes
    const unsubscribe = webSocketService.onStatusChange(setStatus);

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  const handleRetryConnection = async () => {
    try {
      await webSocketService.reconnect();
    } catch (error) {
      console.error("Manual reconnection failed:", error);
    }
  };

  const getStatusIcon = () => {
    if (status.connected) {
      return (
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="ml-2 text-green-600 text-sm">Connected</span>
        </div>
      );
    }

    if (status.reconnecting) {
      return (
        <div className="flex items-center">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-spin"></div>
          <span className="ml-2 text-yellow-600 text-sm">Reconnecting...</span>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="ml-2 text-red-600 text-sm">Disconnected</span>
      </div>
    );
  };

  const getStatusColor = () => {
    if (status.connected) return "border-green-200 bg-green-50";
    if (status.reconnecting) return "border-yellow-200 bg-yellow-50";
    return "border-red-200 bg-red-50";
  };

  const formatLastConnected = () => {
    if (!status.lastConnectedAt) return "Never";

    const date = new Date(status.lastConnectedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!showDetails && status.connected) {
    return null; // Don't show anything when connected and details not requested
  }

  return (
    <div className={`rounded-lg border p-3 ${getStatusColor()} ${className}`}>
      <div className="flex items-center justify-between">
        {getStatusIcon()}

        {!status.connected && (
          <button
            type="button"
            onClick={handleRetryConnection}
            disabled={status.reconnecting}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status.reconnecting ? "Retrying..." : "Retry"}
          </button>
        )}
      </div>

      {showDetails && (
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Last connected:</span>
            <span>{formatLastConnected()}</span>
          </div>

          {status.reconnectAttempts > 0 && (
            <div className="flex justify-between">
              <span>Retry attempts:</span>
              <span>{status.reconnectAttempts}</span>
            </div>
          )}

          {status.error && (
            <div className="text-red-600 mt-1">
              <span className="font-medium">Error:</span> {status.error}
            </div>
          )}
        </div>
      )}

      {!status.connected && !status.reconnecting && (
        <div className="mt-2 text-xs text-gray-500">
          Some features may not work properly while disconnected.
        </div>
      )}
    </div>
  );
}

// Compact version for use in headers or toolbars
export function ConnectionStatusIndicator({
  className = "",
}: {
  className?: string;
}) {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false,
    error: null,
    lastConnectedAt: null,
    reconnectAttempts: 0,
  });

  useEffect(() => {
    const unsubscribe = webSocketService.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  const getIndicatorClass = () => {
    if (status.connected) return "bg-green-500";
    if (status.reconnecting) return "bg-yellow-500 animate-pulse";
    return "bg-red-500";
  };

  const getTooltipText = () => {
    if (status.connected) return "WebSocket connected";
    if (status.reconnecting)
      return `Reconnecting... (attempt ${status.reconnectAttempts})`;
    return "WebSocket disconnected";
  };

  return (
    <div
      className={`w-3 h-3 rounded-full ${getIndicatorClass()} ${className}`}
      title={getTooltipText()}
    />
  );
}

export default WebSocketConnectionStatus;
