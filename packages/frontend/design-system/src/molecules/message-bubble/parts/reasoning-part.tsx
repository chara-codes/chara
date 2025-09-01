"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { ExpandableChevronIcon } from "../../../atoms/icons/expandable-chevron-icon";
import { ThinkingIcon } from "../../../atoms/icons/thinking-icon";
import { theme } from "../../../theme/theme";

const ReasoningContainer = styled.div<{ isExpanded: boolean }>`
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
`;

const ReasoningHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  cursor: pointer;
  user-select: none;
`;

const ReasoningLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: ${theme.colors.textSecondary};

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ReasoningToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: ${theme.colors.textSecondary};
  border-radius: 4px;
  transition: background-color 0.2s ease;

  &:hover {
    color: #000;
  }
`;

const ReasoningContent = styled.div<{ isExpanded: boolean }>`
  max-height: ${({ isExpanded }) => (isExpanded ? "300px" : "0")};
  overflow-y: auto;
  transition: max-height 0.3s ease;
`;

const ReasoningText = styled.div`
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: ${theme.colors.textSecondary};
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const StreamingIndicator = styled.span`
  color: ${theme.colors.textSecondary};

  &::after {
    content: "";
    animation: ellipsis 1.5s infinite;
  }

  @keyframes ellipsis {
    0% {
      content: "";
    }
    25% {
      content: ".";
    }
    50% {
      content: "..";
    }
    75% {
      content: "...";
    }
    100% {
      content: "";
    }
  }
`;

export interface ReasoningPartProps {
  text?: string;
  state?: "pending" | "streaming" | "complete" | "error";
  isExpanded?: boolean;
  onToggle?: () => void;
}

const ReasoningPart: React.FC<ReasoningPartProps> = ({
  text,
  state = "complete",
  isExpanded: controlledExpanded,
  onToggle,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Use controlled expansion if provided, otherwise use internal state
  const isExpanded =
    controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = useCallback(() => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  }, [onToggle]);

  // Auto-scroll to bottom when streaming and expanded
  useEffect(() => {
    if (state === "streaming" && isExpanded && contentRef.current) {
      const scrollToBottom = () => {
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
      };

      scrollToBottom();
      const interval = setInterval(scrollToBottom, 100);
      return () => clearInterval(interval);
    }
  }, [state, isExpanded]);

  if (!text && state !== "streaming" && state !== "pending") {
    return null;
  }

  const isStreaming = state === "streaming";
  const isPending = state === "pending";
  const hasContent = text && text.trim().length > 0;

  return (
    <ReasoningContainer isExpanded={isExpanded}>
      <ReasoningHeader onClick={handleToggle}>
        <ReasoningLabel>
          <ThinkingIcon />
          {isStreaming
            ? "Thinking..."
            : isPending
            ? "Processing..."
            : "Thought process"}
        </ReasoningLabel>
        <ReasoningToggle>
          <ExpandableChevronIcon
            isExpanded={isExpanded}
            ariaLabel={
              isExpanded
                ? "Collapse thinking section"
                : "Expand thinking section"
            }
          />
        </ReasoningToggle>
      </ReasoningHeader>

      {(hasContent || isStreaming || isPending) && (
        <ReasoningContent isExpanded={isExpanded} ref={contentRef}>
          <ReasoningText>
            {hasContent ? (
              text
            ) : isStreaming ? (
              <StreamingIndicator>Processing your request</StreamingIndicator>
            ) : (
              "Preparing to think..."
            )}
          </ReasoningText>
        </ReasoningContent>
      )}
    </ReasoningContainer>
  );
};

export default ReasoningPart;
