"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { TerminalIcon } from "../../../atoms/icons";
import { ExpandableChevronIcon } from "../../../atoms/icons/expandable-chevron-icon";

const ToolCallContainer = styled.div`
  background: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  margin: 8px 0;
  overflow: hidden;
`;

const ToolCallHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(16, 185, 129, 0.08);
  cursor: pointer;
  user-select: none;

  &:hover {
    background: rgba(16, 185, 129, 0.12);
  }
`;

const ToolCallInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToolCallIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: rgba(16, 185, 129, 0.2);
  border-radius: 4px;

  svg {
    width: 12px;
    height: 12px;
    color: #059669;
  }
`;

const ToolCallLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ToolCallName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #059669;
`;

const ToolCallState = styled.span<{ state: string }>`
  font-size: 11px;
  color: ${({ state }) => {
    switch (state) {
      case "pending":
        return "#f59e0b";
      case "streaming":
      case "in-progress":
        return "#3b82f6";
      case "success":
        return "#059669";
      case "error":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  }};
  text-transform: capitalize;
`;

const ToggleButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(16, 185, 129, 0.15);
  }
`;

const ToolCallDetails = styled.div<{ isExpanded: boolean }>`
  max-height: ${({ isExpanded }) => (isExpanded ? "400px" : "0")};
  overflow-y: auto;
  transition: max-height 0.3s ease;
  background: rgba(16, 185, 129, 0.02);
`;

const DetailsSection = styled.div`
  border-top: 1px solid rgba(16, 185, 129, 0.1);
`;

const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #059669;
  padding: 8px 12px 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SectionContent = styled.div`
  padding: 0 12px 8px;
`;

const CodeBlock = styled.pre`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 8px;
  font-size: 12px;
  font-family: "Monaco", "Menlo", "Consolas", monospace;
  overflow-x: auto;
  color: #374151;
  margin: 0;
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 4px;
  padding: 8px;
  font-size: 12px;
  color: #dc2626;
  margin: 0;
`;

const SuccessMessage = styled.div`
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 4px;
  padding: 8px;
  font-size: 12px;
  color: #059669;
  margin: 0;
`;

const EmptyState = styled.div`
  padding: 8px 12px;
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
`;

export interface ToolCallPartProps {
  toolName: string;
  toolCallId: string;
  input?: Record<string, unknown>;
  output?: unknown;
  state?: "pending" | "streaming" | "in-progress" | "success" | "error";
  error?: string;
}

const ToolCallPart: React.FC<ToolCallPartProps> = ({
  toolName,
  toolCallId: _toolCallId,
  input,
  output,
  state = "success",
  error,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const formatJson = (obj: unknown): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const renderOutput = () => {
    if (error) {
      return <ErrorMessage>{error}</ErrorMessage>;
    }

    if (state === "error") {
      return <ErrorMessage>Tool execution failed</ErrorMessage>;
    }

    if (!output) {
      if (
        state === "pending" ||
        state === "streaming" ||
        state === "in-progress"
      ) {
        return <EmptyState>Waiting for result...</EmptyState>;
      }
      return <EmptyState>No output</EmptyState>;
    }

    if (typeof output === "string") {
      return <SuccessMessage>{output}</SuccessMessage>;
    }

    return <CodeBlock>{formatJson(output)}</CodeBlock>;
  };

  return (
    <ToolCallContainer>
      <ToolCallHeader onClick={handleToggle}>
        <ToolCallInfo>
          <ToolCallIcon>
            <TerminalIcon />
          </ToolCallIcon>
          <ToolCallLabel>
            <ToolCallName>{toolName}</ToolCallName>
            <ToolCallState state={state}>{state}</ToolCallState>
          </ToolCallLabel>
        </ToolCallInfo>
        <ToggleButton>
          <ExpandableChevronIcon
            isExpanded={isExpanded}
            ariaLabel={
              isExpanded
                ? "Collapse tool call details"
                : "Expand tool call details"
            }
          />
        </ToggleButton>
      </ToolCallHeader>

      <ToolCallDetails isExpanded={isExpanded}>
        {input && Object.keys(input).length > 0 && (
          <DetailsSection>
            <SectionTitle>Input</SectionTitle>
            <SectionContent>
              <CodeBlock>{formatJson(input)}</CodeBlock>
            </SectionContent>
          </DetailsSection>
        )}

        <DetailsSection>
          <SectionTitle>Output</SectionTitle>
          <SectionContent>{renderOutput()}</SectionContent>
        </DetailsSection>
      </ToolCallDetails>
    </ToolCallContainer>
  );
};

export default ToolCallPart;
