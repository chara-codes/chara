"use client";

import type React from "react";
import { useRef, useEffect } from "react";
import styled from "styled-components";
import ViewNavigation from "../molecules/view-navigation";

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
  $type?: "stdout" | "stderr";
  $exitCode?: number;
}>`
  margin: 2px 0;
  display: flex;
  align-items: flex-start;
  white-space: pre-wrap;
  word-break: break-word;

  ${({ $type, $exitCode }) => {
    if ($type === "stderr" || ($exitCode !== undefined && $exitCode !== 0)) {
      return `
        color: #ff6b6b;
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
  type: "stdout" | "stderr";
  content: string;
  timestamp: Date;
  exitCode?: number;
}

export interface ServerInfo {
  serverUrl: string;
  name: string;
  status: string;
  os: string;
  shell: string;
  cwd: string;
  command: string;
}

interface TerminalViewProps {
  onBack: () => void;
  logs?: TerminalEntry[];
  serverInfo?: ServerInfo;
}

const TerminalView: React.FC<TerminalViewProps> = ({
  onBack,
  logs = [],
  serverInfo,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <TerminalContainer>
      <ViewNavigation
        onBack={onBack}
        searchQuery=""
        onSearchChange={() => {}}
        placeholder=""
        showSearch={false}
      />

      {serverInfo && (
        <ServerInfoWrapper>
          <ServerInfoBlock>
            <ServerInfoRow>
              <span className="label">Status:</span>
              <span className="value">
                <StatusIndicator $status={serverInfo.status} />
                {serverInfo.status}
              </span>
            </ServerInfoRow>
            <ServerInfoRow>
              <span className="label">Name:</span>
              <span className="value">{serverInfo.name}</span>
            </ServerInfoRow>
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
            <ServerInfoRow>
              <span className="label">Command:</span>
              <span className="value">{serverInfo.command}</span>
            </ServerInfoRow>
            <ServerInfoRow>
              <span className="label">OS:</span>
              <span className="value">{serverInfo.os}</span>
            </ServerInfoRow>
            <ServerInfoRow>
              <span className="label">Shell:</span>
              <span className="value">{serverInfo.shell}</span>
            </ServerInfoRow>
            <ServerInfoRow>
              <span className="label">CWD:</span>
              <span className="value">{serverInfo.cwd}</span>
            </ServerInfoRow>
          </ServerInfoBlock>
        </ServerInfoWrapper>
      )}

      <TerminalContent ref={contentRef}>
        {logs.length === 0 ? (
          <EmptyState>
            <div className="icon">📋</div>
            <div>No execution logs available</div>
            <div style={{ fontSize: "12px", marginTop: "4px" }}>
              Command logs will appear here when available
            </div>
          </EmptyState>
        ) : (
          logs.map((entry) => (
            <TerminalLine
              key={entry.id}
              $type={entry.type}
              $exitCode={entry.exitCode}
            >
              {entry.content}
              {entry.exitCode !== undefined && entry.exitCode !== 0 && (
                <span
                  style={{
                    color: "#ff6b6b",
                    marginLeft: "8px",
                    fontSize: "11px",
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
