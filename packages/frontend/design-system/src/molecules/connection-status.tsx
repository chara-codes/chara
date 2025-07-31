"use client";

import { webSocketService } from "@chara-codes/core";
import type { ConnectionStatus } from "@chara-codes/core";
import { useEffect, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

// Animations
const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Styled components
const StatusContainer = styled.div<{
  status: "connected" | "reconnecting" | "disconnected";
}>`
  border-radius: 0.5rem;
  border: 1px solid;
  padding: 0.75rem;

  ${(props) => {
    switch (props.status) {
      case "connected":
        return `
          border-color: #bbf7d0;
          background-color: #f0fdf4;
        `;
      case "reconnecting":
        return `
          border-color: #fef3c7;
          background-color: #fffbeb;
        `;
      default:
        return `
          border-color: #fecaca;
          background-color: #fef2f2;
        `;
    }
  }}
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatusIndicatorContainer = styled.div`
  display: flex;
  align-items: center;
`;

const StatusDot = styled.div<{
  status: "connected" | "reconnecting" | "disconnected";
}>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;

  ${(props) => {
    switch (props.status) {
      case "connected":
        return css`
          background-color: #22c55e;
          animation: ${pulse} 2s infinite;
        `;
      case "reconnecting":
        return css`
          background-color: #eab308;
          animation: ${spin} 1s linear infinite;
        `;
      default:
        return css`
          background-color: #ef4444;
        `;
    }
  }}
`;

const StatusText = styled.span<{
  status: "connected" | "reconnecting" | "disconnected";
}>`
  margin-left: 0.5rem;
  font-size: 0.875rem;

  ${(props) => {
    switch (props.status) {
      case "connected":
        return `color: #16a34a;`;
      case "reconnecting":
        return `color: #ca8a04;`;
      default:
        return `color: #dc2626;`;
    }
  }}
`;

const RetryButton = styled.button<{ disabled: boolean }>`
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background-color: #2563eb;
  }

  ${(props) =>
    props.disabled &&
    `
    opacity: 0.5;
    cursor: not-allowed;
  `}
`;

const DetailsContainer = styled.div`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #4b5563;

  > div {
    margin-bottom: 0.25rem;
  }
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ErrorText = styled.div`
  color: #dc2626;
  margin-top: 0.25rem;

  .font-medium {
    font-weight: 500;
  }
`;

const DisconnectedWarning = styled.div`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
`;

const Tooltip = styled.div<{ $position: "top" | "bottom"; $visible: boolean }>`
  position: absolute;
  padding: 0.5rem 0.75rem;
  background-color: #1f2937;
  color: white;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  white-space: nowrap;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 1000;
  max-width: 300px;
  left: 50%;
  opacity: ${(props) => (props.$visible ? 1 : 0)};

  ${(props) =>
    props.$position === "top"
      ? css`
          bottom: 100%;
          margin-bottom: 0.5rem;
          transform: translateX(-50%);

          &::after {
            content: "";
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 0.25rem solid transparent;
            border-top-color: #1f2937;
          }
        `
      : css`
          top: 100%;
          margin-top: 0.5rem;
          transform: translateX(-50%);

          &::after {
            content: "";
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 0.25rem solid transparent;
            border-bottom-color: #1f2937;
          }
        `}
`;

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;

  &:hover ${Tooltip} {
    opacity: 1;
  }
`;

const CompactIndicator = styled.div<{
  status: "connected" | "reconnecting" | "disconnected";
}>`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;

  ${(props) => {
    switch (props.status) {
      case "connected":
        return css`
          background-color: #22c55e;
        `;
      case "reconnecting":
        return css`
          background-color: #eab308;
          animation: ${pulse} 2s infinite;
        `;
      default:
        return css`
          background-color: #ef4444;
        `;
    }
  }}
`;

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
  const [tooltipPosition, setTooltipPosition] = useState<"top" | "bottom">(
    "top"
  );
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to connection status changes
    const unsubscribe = webSocketService.onStatusChange(setStatus);

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // If there's not enough space above, show tooltip below
      const spaceAbove = rect.top;
      const spaceBelow = windowHeight - rect.bottom;

      if (spaceAbove < 60 && spaceBelow > 60) {
        setTooltipPosition("bottom");
      } else {
        setTooltipPosition("top");
      }
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const getTooltipText = () => {
    if (status.connected) return "Connected";
    if (status.reconnecting)
      return `Reconnecting... (attempt ${status.reconnectAttempts})`;
    return "Disconnected";
  };

  const handleRetryConnection = async () => {
    try {
      await webSocketService.reconnect();
    } catch (error) {
      console.error("Manual reconnection failed:", error);
    }
  };

  const getStatusType = (): "connected" | "reconnecting" | "disconnected" => {
    if (status.connected) return "connected";
    if (status.reconnecting) return "reconnecting";
    return "disconnected";
  };

  const getStatusText = () => {
    if (status.connected) return "Connected";
    if (status.reconnecting) return "Reconnecting...";
    return "Disconnected";
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

  const statusType = getStatusType();

  return (
    <StatusContainer status={statusType} className={className}>
      <StatusHeader>
        <TooltipContainer
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <StatusIndicatorContainer>
            <StatusDot status={statusType} />
            <StatusText status={statusType}>{getStatusText()}</StatusText>
          </StatusIndicatorContainer>
          <Tooltip $position={tooltipPosition} $visible={showTooltip}>
            {getTooltipText()}
            {status.reconnectAttempts > 0 &&
              ` (${status.reconnectAttempts} attempts)`}
            {status.lastConnectedAt && ` - Last: ${formatLastConnected()}`}
          </Tooltip>
        </TooltipContainer>

        {!status.connected && (
          <RetryButton
            type="button"
            onClick={handleRetryConnection}
            disabled={status.reconnecting}
          >
            {status.reconnecting ? "Retrying..." : "Retry"}
          </RetryButton>
        )}
      </StatusHeader>

      {showDetails && (
        <DetailsContainer>
          <DetailRow>
            <span>Last connected:</span>
            <span>{formatLastConnected()}</span>
          </DetailRow>

          {status.reconnectAttempts > 0 && (
            <DetailRow>
              <span>Retry attempts:</span>
              <span>{status.reconnectAttempts}</span>
            </DetailRow>
          )}

          {status.error && (
            <ErrorText>
              <span className="font-medium">Error:</span> {status.error}
            </ErrorText>
          )}
        </DetailsContainer>
      )}

      {!status.connected && !status.reconnecting && (
        <DisconnectedWarning>
          Some features may not work properly while disconnected.
        </DisconnectedWarning>
      )}
    </StatusContainer>
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
  const [tooltipPosition, setTooltipPosition] = useState<"top" | "bottom">(
    "top"
  );
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = webSocketService.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // If there's not enough space above, show tooltip below
      const spaceAbove = rect.top;
      const spaceBelow = windowHeight - rect.bottom;

      if (spaceAbove < 60 && spaceBelow > 60) {
        setTooltipPosition("bottom");
      } else {
        setTooltipPosition("top");
      }
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleClick = async () => {
    if (!status.connected && !status.reconnecting) {
      try {
        await webSocketService.reconnect();
      } catch (error) {
        console.error("Manual reconnection failed:", error);
      }
    }
  };

  const getStatusType = (): "connected" | "reconnecting" | "disconnected" => {
    if (status.connected) return "connected";
    if (status.reconnecting) return "reconnecting";
    return "disconnected";
  };

  const getTooltipText = () => {
    if (status.connected) return "WebSocket connected";
    if (status.reconnecting)
      return `Reconnecting... (attempt ${status.reconnectAttempts})`;
    return "WebSocket disconnected";
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

  return (
    <TooltipContainer
      ref={containerRef}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        cursor:
          !status.connected && !status.reconnecting ? "pointer" : "default",
      }}
    >
      <CompactIndicator status={getStatusType()} />
      <Tooltip $position={tooltipPosition} $visible={showTooltip}>
        {getTooltipText()}
        {status.reconnectAttempts > 0 &&
          ` (${status.reconnectAttempts} attempts)`}
        {status.lastConnectedAt && ` - Last: ${formatLastConnected()}`}
        {!status.connected && !status.reconnecting && (
          <div style={{ marginTop: "4px", fontSize: "11px", color: "#9ca3af" }}>
            Click to reconnect
          </div>
        )}
      </Tooltip>
    </TooltipContainer>
  );
}

export default WebSocketConnectionStatus;
