"use client";

import {
  useChatStore,
  useModelsStore,
  useRunnerConnection,
  webSocketService,
} from "@chara-codes/core";
import type { ConnectionStatus } from "@chara-codes/core";
import React, { useEffect, useState, useCallback } from "react";
import styled from "styled-components";

const DebugContainer = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  width: 320px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-family: "Monaco", "Consolas", monospace;
  font-size: 12px;
  z-index: 9999;
  max-height: 400px;
  overflow-y: auto;
`;

const DebugHeader = styled.div`
  background: #343a40;
  color: white;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
`;

const DebugContent = styled.div`
  padding: 12px;
`;

const DebugSection = styled.div`
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
`;

const DebugTitle = styled.div`
  font-weight: bold;
  color: #495057;
  margin-bottom: 4px;
`;

const DebugItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
`;

const StatusIndicator = styled.span<{
  status: "success" | "loading" | "error";
}>`
  color: ${(props) => {
    switch (props.status) {
      case "success":
        return "#28a745";
      case "loading":
        return "#ffc107";
      case "error":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  }};
  font-weight: bold;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

const ActionButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  margin: 2px;

  &:hover {
    background: #0056b3;
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const LogContainer = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 6px;
  max-height: 80px;
  overflow-y: auto;
  font-size: 10px;
  margin-top: 4px;
`;

const LogEntry = styled.div<{ level: "info" | "warning" | "error" }>`
  color: ${(props) => {
    switch (props.level) {
      case "warning":
        return "#856404";
      case "error":
        return "#721c24";
      default:
        return "#495057";
    }
  }};
  margin-bottom: 1px;
`;

interface DebugPanelProps {
  visible?: boolean;
  onClose?: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  visible = false,
  onClose,
}) => {
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false,
    error: null,
    lastConnectedAt: null,
    reconnectAttempts: 0,
  });
  const [logs, setLogs] = useState<
    Array<{
      timestamp: Date;
      level: "info" | "warning" | "error";
      message: string;
    }>
  >([]);

  // Chat store state
  const isChatsLoading = useChatStore((state) => state.isLoading);
  const chatsLoadError = useChatStore((state) => state.loadError);
  const chatsCount = useChatStore((state) => state.chats.length);
  const wsConnected = useChatStore((state) => state.wsConnected);
  const wsReconnecting = useChatStore((state) => state.wsReconnecting);
  const wsError = useChatStore((state) => state.wsError);

  // Models store state
  const isModelsLoading = useModelsStore((state) => state.isLoading);
  const modelsLoadError = useModelsStore((state) => state.loadError);
  const modelsCount = useModelsStore((state) => state.models.length);

  // Runner state
  const { isConnected: runnerConnected, isConnecting: runnerConnecting } =
    useRunnerConnection();

  const addLog = useCallback((level: "info" | "warning" | "error", message: string) => {
    setLogs((prev) => [
      ...prev.slice(-9),
      {
        timestamp: new Date(),
        level,
        message,
      },
    ]);
  }, []);

  useEffect(() => {
    const unsubscribe = webSocketService.onStatusChange((status) => {
      setWsStatus(status);
      addLog(
        "info",
        `WebSocket status: ${status.connected ? "connected" : "disconnected"}`
      );
    });

    return unsubscribe;
  }, [addLog]);

  const getStatus = (
    loading: boolean,
    error: string | null,
    connected?: boolean
  ) => {
    if (error) return "error";
    if (loading) return "loading";
    if (connected === false) return "error";
    return "success";
  };

  const getStatusText = (
    loading: boolean,
    error: string | null,
    connected?: boolean
  ) => {
    if (error) return "ERROR";
    if (loading) return "LOADING";
    if (connected === false) return "DISCONNECTED";
    return "OK";
  };

  const handleTestConnection = async () => {
    try {
      addLog("info", "Testing WebSocket connection...");
      await webSocketService.reconnect();
      addLog("info", "Connection test completed");
    } catch (error) {
      addLog("error", `Connection test failed: ${error}`);
    }
  };

  const handleRetryStores = async () => {
    try {
      addLog("info", "Retrying store initialization...");
      const chatStore = useChatStore.getState();
      const modelsStore = useModelsStore.getState();

      await Promise.all([
        chatStore.initializeStore(),
        modelsStore.initializeStore(),
      ]);

      addLog("info", "Store retry completed");
    } catch (error) {
      addLog("error", `Store retry failed: ${error}`);
    }
  };

  if (!visible) return null;

  return (
    <DebugContainer>
      <DebugHeader>
        🔧 Debug Panel
        <CloseButton onClick={onClose}>×</CloseButton>
      </DebugHeader>

      <DebugContent>
        <DebugSection>
          <DebugTitle>WebSocket Connection</DebugTitle>
          <DebugItem>
            <span>Shared Service:</span>
            <StatusIndicator
              status={
                wsStatus.connected
                  ? "success"
                  : wsStatus.reconnecting
                  ? "loading"
                  : "error"
              }
            >
              {wsStatus.connected
                ? "CONNECTED"
                : wsStatus.reconnecting
                ? "CONNECTING"
                : "DISCONNECTED"}
            </StatusIndicator>
          </DebugItem>
          <DebugItem>
            <span>Chat WS:</span>
            <StatusIndicator
              status={getStatus(wsReconnecting, wsError, wsConnected)}
            >
              {getStatusText(wsReconnecting, wsError, wsConnected)}
            </StatusIndicator>
          </DebugItem>
          <DebugItem>
            <span>Reconnect Attempts:</span>
            <span>{wsStatus.reconnectAttempts}</span>
          </DebugItem>
          <ActionButton onClick={handleTestConnection}>
            Test Connection
          </ActionButton>
        </DebugSection>

        <DebugSection>
          <DebugTitle>Store Status</DebugTitle>
          <DebugItem>
            <span>Chat Store:</span>
            <StatusIndicator status={getStatus(isChatsLoading, chatsLoadError)}>
              {getStatusText(isChatsLoading, chatsLoadError)}
            </StatusIndicator>
          </DebugItem>
          <DebugItem>
            <span>Chats Loaded:</span>
            <span>{chatsCount}</span>
          </DebugItem>
          <DebugItem>
            <span>Models Store:</span>
            <StatusIndicator
              status={getStatus(isModelsLoading, modelsLoadError)}
            >
              {getStatusText(isModelsLoading, modelsLoadError)}
            </StatusIndicator>
          </DebugItem>
          <DebugItem>
            <span>Models Loaded:</span>
            <span>{modelsCount}</span>
          </DebugItem>
          <ActionButton onClick={handleRetryStores}>Retry Stores</ActionButton>
        </DebugSection>

        <DebugSection>
          <DebugTitle>Runner Service</DebugTitle>
          <DebugItem>
            <span>Status:</span>
            <StatusIndicator
              status={
                runnerConnected
                  ? "success"
                  : runnerConnecting
                  ? "loading"
                  : "error"
              }
            >
              {runnerConnected
                ? "CONNECTED"
                : runnerConnecting
                ? "CONNECTING"
                : "DISCONNECTED"}
            </StatusIndicator>
          </DebugItem>
        </DebugSection>

        <DebugSection>
          <DebugTitle>Error Messages</DebugTitle>
          {chatsLoadError && (
            <LogEntry level="error">Chat: {chatsLoadError}</LogEntry>
          )}
          {modelsLoadError && (
            <LogEntry level="error">Models: {modelsLoadError}</LogEntry>
          )}
          {wsError && <LogEntry level="error">WebSocket: {wsError}</LogEntry>}
          {!chatsLoadError && !modelsLoadError && !wsError && (
            <LogEntry level="info">No errors</LogEntry>
          )}
        </DebugSection>

        <DebugSection>
          <DebugTitle>Recent Logs</DebugTitle>
          <LogContainer>
            {logs.length === 0 ? (
              <LogEntry level="info">No logs yet...</LogEntry>
            ) : (
              logs.map((log, index) => (
                <LogEntry key={index} level={log.level}>
                  {log.timestamp.toLocaleTimeString()}: {log.message}
                </LogEntry>
              ))
            )}
          </LogContainer>
        </DebugSection>

        <DebugSection>
          <DebugTitle>Actions</DebugTitle>
          <ActionButton
            onClick={() => {
              console.log("Environment:", {
                NODE_ENV: process.env.NODE_ENV,
                VITE_AGENTS_BASE_URL: import.meta.env?.VITE_AGENTS_BASE_URL,
                location: window.location.href,
                userAgent: navigator.userAgent,
              });
              addLog("info", "Environment logged to console");
            }}
          >
            Log Environment
          </ActionButton>
          <ActionButton
            onClick={() => {
              setLogs([]);
            }}
          >
            Clear Logs
          </ActionButton>
          <ActionButton
            onClick={() => {
              window.location.reload();
            }}
          >
            Reload Page
          </ActionButton>
        </DebugSection>
      </DebugContent>
    </DebugContainer>
  );
};

export default DebugPanel;
