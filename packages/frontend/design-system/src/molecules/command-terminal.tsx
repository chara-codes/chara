"use client";

import type React from "react";
import styled from "styled-components";
import type { ExecutedCommand } from "@chara/core";

interface CommandTerminalProps {
  commands: ExecutedCommand[];
}

const TerminalContainer = styled.div`
  margin-top: 8px;
  background-color: #1e1e1e;
  border-radius: 6px;
  overflow: hidden;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
`;

const TerminalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  font-weight: 500;
  font-size: 12px;
  color: #e5e7eb;
  background-color: #2d2d2d;
  border-bottom: 1px solid #3d3d3d;
`;

const TerminalContent = styled.div`
  padding: 8px 12px;
  max-height: 300px;
  overflow-y: auto;
  color: #e5e7eb;
`;

const CommandItem = styled.div`
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CommandPrompt = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  color: #10b981;
`;

const CommandText = styled.span`
  color: #e5e7eb;
  word-break: break-all;
`;

const CommandOutput = styled.div<{ $status: string }>`
  padding: 4px 0 4px 16px;
  color: ${(props) => (props.$status === "error" ? "#ef4444" : "#e5e7eb")};
  border-left: 2px solid
    ${(props) => {
      switch (props.$status) {
        case "success":
          return "#10b981";
        case "error":
          return "#ef4444";
        case "pending":
          return "#f59e0b";
        default:
          return "#6b7280";
      }
    }};
  white-space: pre-wrap;
  font-size: 11px;
`;

const TerminalIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Terminal Icon</title>
    <path
      d="M4 17L10 11L4 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 19H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CommandTerminal: React.FC<CommandTerminalProps> = ({ commands }) => {
  return (
    <TerminalContainer>
      <TerminalHeader>
        <TerminalIcon />
        Executed Commands
      </TerminalHeader>
      <TerminalContent>
        {commands.map((cmd) => (
          <CommandItem key={cmd.id}>
            <CommandPrompt>
              $ <CommandText>{cmd.command}</CommandText>
            </CommandPrompt>
            {cmd.output && (
              <CommandOutput $status={cmd.status}>{cmd.output}</CommandOutput>
            )}
          </CommandItem>
        ))}
      </TerminalContent>
    </TerminalContainer>
  );
};

export default CommandTerminal;
