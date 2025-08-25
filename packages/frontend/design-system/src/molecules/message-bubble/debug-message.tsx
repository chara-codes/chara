"use client";

import type React from "react";
import { useState } from "react";
import styled from "styled-components";
import type { Part } from "./parts/part-renderer";

const DebugMessageContainer = styled.div`
  margin: 4px 0;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #f8f9fa;
  overflow: hidden;
  font-size: 11px;
  opacity: 0.8;
`;

const DebugMessageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: #f1f3f4;
  border-bottom: 1px solid #e5e7eb;
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
`;

const DebugTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DebugIcon = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  background: #9ca3af;
  color: white;
  border-radius: 50%;
  text-align: center;
  line-height: 14px;
  font-size: 8px;
  font-weight: bold;
`;

const PartCount = styled.span`
  display: inline-block;
  padding: 1px 6px;
  background: #6b7280;
  color: white;
  font-size: 9px;
  border-radius: 8px;
  margin-left: 6px;
`;

const ToggleButton = styled.button`
  background: #6b7280;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 3px;
  transition: background-color 0.2s;

  &:hover {
    background: #4b5563;
  }

  &:focus {
    outline: none;
    background: #4b5563;
  }
`;

const DebugContent = styled.div`
  padding: 10px;
  background: #ffffff;
`;

const PartsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PartItem = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
`;

const PartHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 10px;
`;

const PartInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PartIndex = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  background: #6b7280;
  color: white;
  border-radius: 50%;
  text-align: center;
  line-height: 16px;
  font-size: 8px;
  font-weight: bold;
`;

const PartType = styled.span`
  font-family: "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace;
  font-weight: 500;
  color: #374151;
`;

const PartBadge = styled.span<{ color?: string }>`
  display: inline-block;
  padding: 1px 4px;
  background: ${(props) => props.color || "#6b7280"};
  color: white;
  font-size: 8px;
  border-radius: 2px;
  margin-left: 3px;
`;

const PartToggle = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 9px;
  padding: 2px 4px;
  border-radius: 2px;
  transition: background-color 0.2s;

  &:hover {
    background: #e5e7eb;
  }

  &:focus {
    outline: none;
    background: #e5e7eb;
  }
`;

const PartSource = styled.div`
  padding: 8px;
  font-family: "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace;
  font-size: 9px;
  line-height: 1.3;
  color: #374151;
  background: #ffffff;
  overflow-x: auto;
`;

const PartJson = styled.pre`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 16px;
  color: #6b7280;
  font-style: italic;
  font-size: 10px;
`;

interface DebugMessageProps {
  parts: Part[];
  messageId?: string;
}

const DebugMessage: React.FC<DebugMessageProps> = ({ parts, messageId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedParts, setExpandedParts] = useState<Set<number>>(new Set());

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handlePartToggle = (index: number) => {
    const newExpandedParts = new Set(expandedParts);
    if (newExpandedParts.has(index)) {
      newExpandedParts.delete(index);
    } else {
      newExpandedParts.add(index);
    }
    setExpandedParts(newExpandedParts);
  };

  const formatPartData = (part: Part) => {
    // Create a copy without circular references
    const cleanPart = { ...part };

    // Sort keys for consistent display
    const sortedKeys = Object.keys(cleanPart).sort();
    const sortedPart: Record<string, unknown> = {};

    for (const key of sortedKeys) {
      sortedPart[key] = cleanPart[key];
    }

    return JSON.stringify(sortedPart, null, 2);
  };

  const getBadgeColor = (type: string): string => {
    switch (type) {
      case "text":
        return "#3b82f6";
      case "reasoning":
        return "#8b5cf6";
      case "tool-call":
      case "tool-result":
        return "#10b981";
      case "source-url":
      case "source-document":
      case "file":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  // In debug mode, show all parts including step-start
  const allParts = parts || [];
  const stepStartParts = allParts.filter((part) => part.type === "step-start");
  const regularParts = allParts.filter((part) => part.type !== "step-start");

  return (
    <DebugMessageContainer>
      <DebugMessageHeader>
        <DebugTitle>
          <DebugIcon>D</DebugIcon>
          <span>Parts</span>
          <PartCount>{allParts.length}</PartCount>
          {regularParts.length > 0 && (
            <PartCount style={{ background: "#6b7280" }}>
              {regularParts.length}
            </PartCount>
          )}
          {stepStartParts.length > 0 && (
            <PartCount style={{ background: "#9ca3af" }}>
              {stepStartParts.length}
            </PartCount>
          )}
          {messageId && (
            <span
              style={{ fontSize: "9px", color: "#9ca3af", marginLeft: "6px" }}
            >
              {messageId.slice(-8)}
            </span>
          )}
        </DebugTitle>
        <ToggleButton onClick={handleToggle}>
          {isExpanded ? "Hide" : "Show"}
        </ToggleButton>
      </DebugMessageHeader>

      {isExpanded && (
        <DebugContent>
          {allParts.length === 0 ? (
            <EmptyState>No parts found in this message</EmptyState>
          ) : (
            <PartsList>
              {allParts.map((part, index) => (
                <PartItem
                  key={`debug-part-${index}-${part.type}-${
                    part.toolCallId || ""
                  }`}
                >
                  <PartHeader>
                    <PartInfo>
                      <PartIndex>{index}</PartIndex>
                      <PartType>{part.type}</PartType>
                      <PartBadge color={getBadgeColor(part.type)}>
                        {part.type}
                      </PartBadge>
                      {part.toolCallId && (
                        <PartBadge color="#10b981">{part.toolCallId}</PartBadge>
                      )}
                      {part.type === "step-start" && (
                        <PartBadge color="#f59e0b">STEP-START</PartBadge>
                      )}
                      {part.toolName && (
                        <PartBadge color="#8b5cf6">{part.toolName}</PartBadge>
                      )}
                      {part.state && (
                        <PartBadge color="#6b7280">{part.state}</PartBadge>
                      )}
                    </PartInfo>
                    <PartToggle onClick={() => handlePartToggle(index)}>
                      {expandedParts.has(index) ? "Hide" : "Show"} Source
                    </PartToggle>
                  </PartHeader>

                  {expandedParts.has(index) && (
                    <PartSource>
                      <PartJson>{formatPartData(part)}</PartJson>
                    </PartSource>
                  )}
                </PartItem>
              ))}
            </PartsList>
          )}
        </DebugContent>
      )}
    </DebugMessageContainer>
  );
};

export default DebugMessage;
