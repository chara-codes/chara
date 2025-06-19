"use client";

import type React from "react";
import { useRef, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import ViewNavigation from "../molecules/view-navigation";
import {
  useActiveRunnerProcess,
  useRunnerConnection,
  useRunnerConnect,
  useRunnerClearOutput,
  useRunnerRestart,
  useRunnerGetStatus,
} from "@chara/core/stores";
import Button from "../atoms/button";

const TerminalContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #1a1a1a;
`;

const ServerInfoWrapper = styled.div`
  background-color: #2a2a2a;
  border-bottom: 1px solid #3a3a3a;
  padding: 12px 16px;
`;

const TerminalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 13px;
  line-height: 1.4;
  color: #ffffff;
  background-color: #1a1a1a;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #2a2a2a;
  }

  &::-webkit-scrollbar-thumb {
    background: #4a4a4a;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #5a5a5a;
  }
`;

const TerminalLine = styled.div<{
  $type?: "stdout" | "stderr" | "error";
  $exitCode?: number;
}>`
  margin: 2px 0;
  display: flex;
  align-items: flex-start;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 13px;
  line-height: 1.4;

  ${({ $type, $exitCode }) => {
    if (
      $type === "stderr" ||
      $type === "error" ||
      ($exitCode !== undefined && $exitCode !== 0)
    ) {
      return `
        color: #ff6b6b;
        background-color: rgba(255, 107, 107, 0.1);
        padding: 2px 4px;
        border-left: 3px solid #ff6b6b;
        margin-left: 4px;
      `;
    }
    if ($type === "stdout") {
      return `
        color: #ffffff;
      `;
    }
    return `
      color: #ffffff;
    `;
  }}
`;

const ServerInfoBlock = styled.div`
  font-size: 12px;
  line-height: 1.5;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
`;

const ServerInfoTitle = styled.div`
  color: #00ff00;
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 13px;
`;

const ServerInfoRow = styled.div`
  display: flex;
  margin-bottom: 4px;

  .label {
    color: #888888;
    min-width: 80px;
    margin-right: 8px;
  }

  .value {
    color: #ffffff;
    word-break: break-all;
  }

  .url-link {
    color: #00bfff;
    text-decoration: underline;
    cursor: pointer;

    &:hover {
      color: #87ceeb;
    }
  }
`;

const StatusIndicator = styled.span<{ $status: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  background-color: ${({ $status }) => {
    switch ($status.toLowerCase()) {
      case "active":
      case "running":
      case "online":
        return "#00ff00";
      case "inactive":
      case "stopped":
      case "offline":
        return "#ff6b6b";
      case "pending":
      case "starting":
        return "#ffff00";
      default:
        return "#888888";
    }
  }};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666666;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 13px;
  text-align: center;

  .icon {
    font-size: 24px;
    margin-bottom: 12px;
  }
`;

export interface TerminalEntry {
  id: string;
  type: "stdout" | "stderr" | "error";
  content: string;
  timestamp: Date;
  exitCode?: number;
  processId?: string;
}

export interface ServerInfo {
  serverUrl?: string;
  name: string;
  status: string;
  os?: string;
  shell?: string;
  cwd: string;
  command: string;
}

interface TerminalViewProps {
  onBack: () => void;
  // Optional props for fallback when runner store is not available
  logs?: TerminalEntry[];
  serverInfo?: ServerInfo;
}

const TerminalView: React.FC<TerminalViewProps> = ({
  onBack,
  logs: fallbackLogs = [],
  serverInfo: fallbackServerInfo,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Runner store hooks
  const activeProcess = useActiveRunnerProcess();
  const { isConnected, isConnecting, connectionError } = useRunnerConnection();
  const connect = useRunnerConnect();
  const clearOutput = useRunnerClearOutput();
  const restart = useRunnerRestart();
  const getStatus = useRunnerGetStatus();

  // Use runner store data if available, otherwise use fallback props
  const logs = useMemo(() => {
    if (activeProcess?.output) {
      return activeProcess.output.map((log) => ({
        id: log.id,
        type: log.type,
        content: log.content,
        timestamp: log.timestamp,
        processId: activeProcess.processId,
      }));
    }
    return fallbackLogs;
  }, [activeProcess?.output, activeProcess?.processId, fallbackLogs]);

  // Add error messages to logs if there are any
  const enhancedLogs = useMemo(() => {
    const baseLogs = [...logs];

    // Add error as a log entry if process has an error and it's not already in logs
    if (activeProcess?.error) {
      const errorEntry: TerminalEntry = {
        id: `process-error-${activeProcess.processId}`,
        type: "error",
        content: `ERROR: ${activeProcess.error}`,
        timestamp: new Date(),
        processId: activeProcess.processId,
      };

      // Only add if not already present
      const hasError = baseLogs.some((log) => log.id === errorEntry.id);
      if (!hasError) {
        baseLogs.push(errorEntry);
      }
    }

    return baseLogs.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
  }, [logs, activeProcess?.error, activeProcess?.processId]);

  const serverInfo = activeProcess
    ? {
        serverUrl: activeProcess.serverInfo.serverUrl,
        name: activeProcess.serverInfo.name,
        status: activeProcess.status,
        os: activeProcess.serverInfo.os,
        shell: activeProcess.serverInfo.shell,
        cwd: activeProcess.serverInfo.cwd,
        command: activeProcess.serverInfo.command,
      }
    : fallbackServerInfo;

  // Connect to runner service on mount
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      connect().catch(console.error);
    }
  }, [isConnected, isConnecting]);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (contentRef.current && enhancedLogs.length > 0) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [enhancedLogs.length]);

  // Handlers for terminal actions
  const handleClearOutput = useCallback(() => {
    if (activeProcess) {
      clearOutput(activeProcess.processId);
    }
  }, [activeProcess, clearOutput]);

  const handleRestart = useCallback(() => {
    if (activeProcess) {
      restart(activeProcess.processId);
    }
  }, [activeProcess, restart]);

  const handleRefresh = useCallback(() => {
    if (activeProcess) {
      getStatus(activeProcess.processId);
    } else {
      getStatus();
    }
  }, [activeProcess, getStatus]);

  // Show connection status if not connected
  const showConnectionStatus =
    !isConnected && (isConnecting || connectionError);

  return (
    <TerminalContainer>
      <ViewNavigation
        onBack={onBack}
        searchQuery=""
        onSearchChange={() => {}}
        placeholder=""
        showSearch={false}
      />

      {showConnectionStatus && (
        <ServerInfoWrapper>
          <ServerInfoBlock>
            <ServerInfoTitle>
              {isConnecting
                ? "🔄 Connecting to Runner..."
                : "❌ Connection Failed"}
            </ServerInfoTitle>
            {connectionError && (
              <ServerInfoRow>
                <span className="label">Error:</span>
                <span className="value" style={{ color: "#ff6b6b" }}>
                  {connectionError}
                </span>
              </ServerInfoRow>
            )}
            <ServerInfoRow>
              <Button
                onClick={handleRefresh}
                style={{
                  background: "#2a2a2a",
                  border: "1px solid #4a4a4a",
                  color: "#ffffff",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Retry Connection
              </Button>
            </ServerInfoRow>
          </ServerInfoBlock>
        </ServerInfoWrapper>
      )}

      {serverInfo && (
        <ServerInfoWrapper>
          <ServerInfoBlock>
            <ServerInfoTitle>
              🚀 Server Information
              <div style={{ float: "right", display: "flex", gap: "8px" }}>
                <Button
                  onClick={handleClearOutput}
                  style={{
                    background: "#2a2a2a",
                    border: "1px solid #4a4a4a",
                    color: "#ffffff",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                  title="Clear output"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleRestart}
                  style={{
                    background: "#2a2a2a",
                    border: "1px solid #4a4a4a",
                    color: "#ffffff",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                  title="Restart process"
                >
                  Restart
                </Button>
              </div>
            </ServerInfoTitle>
            <ServerInfoRow>
              <span className="label">Status:</span>
              <span className="value">
                <StatusIndicator $status={serverInfo.status} />
                {serverInfo.status}
              </span>
            </ServerInfoRow>
            <ServerInfoRow>
              <span className="label">Process ID:</span>
              <span className="value">{activeProcess?.processId}</span>
            </ServerInfoRow>
            <ServerInfoRow>
              <span className="label">Name:</span>
              <span className="value">{serverInfo.name}</span>
            </ServerInfoRow>
            {serverInfo.serverUrl && (
              <ServerInfoRow>
                <span className="label">URL:</span>
                <span className="value">
                  <a
                    href={serverInfo.serverUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="url-link"
                  >
                    {serverInfo.serverUrl}
                  </a>
                </span>
              </ServerInfoRow>
            )}
            <ServerInfoRow>
              <span className="label">Command:</span>
              <span className="value">{serverInfo.command}</span>
            </ServerInfoRow>
            {serverInfo.os && (
              <ServerInfoRow>
                <span className="label">OS:</span>
                <span className="value">{serverInfo.os}</span>
              </ServerInfoRow>
            )}
            {serverInfo.shell && (
              <ServerInfoRow>
                <span className="label">Shell:</span>
                <span className="value">{serverInfo.shell}</span>
              </ServerInfoRow>
            )}
            <ServerInfoRow>
              <span className="label">CWD:</span>
              <span className="value">{serverInfo.cwd}</span>
            </ServerInfoRow>
          </ServerInfoBlock>
        </ServerInfoWrapper>
      )}

      <TerminalContent ref={contentRef}>
        {enhancedLogs.length === 0 ? (
          <EmptyState>
            <div className="icon">📋</div>
            <div>
              {isConnected
                ? "No execution logs available"
                : "Waiting for connection..."}
            </div>
            <div style={{ fontSize: "12px", marginTop: "4px" }}>
              {isConnected
                ? "Command logs will appear here when available"
                : "Terminal output will appear here once connected"}
            </div>
          </EmptyState>
        ) : (
          enhancedLogs.map((entry) => (
            <TerminalLine
              key={entry.id}
              $type={entry.type}
              $exitCode={entry.exitCode}
            >
              <span
                style={{
                  color: entry.type === "error" ? "#ff6b6b" : "#666",
                  fontSize: "11px",
                  marginRight: "8px",
                  fontWeight: entry.type === "error" ? "bold" : "normal",
                }}
              >
                {entry.timestamp.toLocaleTimeString()}
                {entry.type === "error" && " [ERROR]"}
                {entry.type === "stderr" && " [STDERR]"}
                {entry.type === "stdout" && " [STDOUT]"}
              </span>
              <span style={{ flex: 1 }}>{entry.content}</span>
              {entry.exitCode !== undefined && entry.exitCode !== 0 && (
                <span
                  style={{
                    color: "#ff6b6b",
                    marginLeft: "8px",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  [exit: {entry.exitCode}]
                </span>
              )}
            </TerminalLine>
          ))
        )}
      </TerminalContent>
    </TerminalContainer>
  );
};

export default TerminalView;
