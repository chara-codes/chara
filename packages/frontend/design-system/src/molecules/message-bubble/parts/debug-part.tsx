"use client";

import type React from "react";
import { useState } from "react";
import styled from "styled-components";
import type { Part } from "./part-renderer";

const DebugContainer = styled.div`
  margin: 2px 0;
  border: 1px solid #e5e7eb;
  border-radius: 3px;
  background: #f8f9fa;
  overflow: hidden;
  font-size: 10px;
  opacity: 0.7;
`;

const DebugHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: #f1f3f4;
  border-bottom: 1px solid #e5e7eb;
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
`;

const DebugTitle = styled.span`
  font-family: "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 9px;
  padding: 2px 4px;
  border-radius: 2px;
  transition: background-color 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #6b7280;
  }

  &:focus {
    outline: none;
    background: #e5e7eb;
    color: #6b7280;
  }
`;

const DebugContent = styled.div`
  padding: 8px;
  font-family: "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace;
  font-size: 9px;
  line-height: 1.3;
  color: #6b7280;
  background: #ffffff;
  overflow-x: auto;
`;

const DebugJson = styled.pre`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

const TypeBadge = styled.span`
  display: inline-block;
  padding: 1px 4px;
  background: #6b7280;
  color: white;
  font-size: 8px;
  border-radius: 2px;
  margin-left: 6px;
`;

interface DebugPartProps {
  part: Part;
  index: number;
}

const DebugPart: React.FC<DebugPartProps> = ({ part, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // Format the part data for display
  const formatPartData = (partData: Part) => {
    // Create a copy without circular references
    const cleanPart = { ...partData };

    // Sort keys for consistent display
    const sortedKeys = Object.keys(cleanPart).sort();
    const sortedPart: Record<string, unknown> = {};

    for (const key of sortedKeys) {
      sortedPart[key] = cleanPart[key];
    }

    return JSON.stringify(sortedPart, null, 2);
  };

  return (
    <DebugContainer>
      <DebugHeader>
        <DebugTitle>
          #{index}
          <TypeBadge>{part.type}</TypeBadge>
          {part.toolCallId && (
            <TypeBadge style={{ background: "#9ca3af" }}>
              {part.toolCallId.slice(-6)}
            </TypeBadge>
          )}
        </DebugTitle>
        <ToggleButton onClick={handleToggle}>
          {isExpanded ? "Hide" : "Show"}
        </ToggleButton>
      </DebugHeader>

      {isExpanded && (
        <DebugContent>
          <DebugJson>{formatPartData(part)}</DebugJson>
        </DebugContent>
      )}
    </DebugContainer>
  );
};

export default DebugPart;
