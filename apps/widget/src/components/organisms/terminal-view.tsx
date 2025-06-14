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

const TerminalLine = styled.div<{ $type?: "input" | "output" | "error" }>`
  margin: 2px 0;
  display: flex;
  align-items: flex-start;
  white-space: pre-wrap;
  word-break: break-word;

  ${({ $type }) => {
    switch ($type) {
      case "input":
        return `
          color: #00ff00;
          &::before {
            content: '$ ';
            color: #00ff00;
            font-weight: bold;
          }
        `;
      case "error":
        return `
          color: #ff6b6b;
        `;
      case "output":
      default:
        return `
          color: #ffffff;
        `;
    }
  }}
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

const WelcomeMessage = styled.div`
  color: #888888;
  margin-bottom: 16px;
  border-bottom: 1px solid #3a3a3a;
  padding-bottom: 16px;
`;

export interface TerminalEntry {
  id: string;
  type: "input" | "output" | "error";
  content: string;
  timestamp: Date;
}

interface TerminalViewProps {
  onBack: () => void;
  logs?: TerminalEntry[];
}

const TerminalView: React.FC<TerminalViewProps> = ({ onBack, logs = [] }) => {
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

      <TerminalContent ref={contentRef}>
        <WelcomeMessage>
          Chara Terminal Logs
          <br />
          Execution history and command output
        </WelcomeMessage>

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
            <TerminalLine key={entry.id} $type={entry.type}>
              {entry.content}
            </TerminalLine>
          ))
        )}
      </TerminalContent>
    </TerminalContainer>
  );
};

export default TerminalView;
