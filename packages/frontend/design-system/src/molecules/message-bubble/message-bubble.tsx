"use client";

import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { TrashIcon } from "../../atoms/icons";
import { PartRenderer } from "./parts";
import {
  Bubble,
  BubbleContainer,
  DeleteButton,
  MessageContent,
  Time,
} from "./styles";
import type { MessageBubbleProps } from "./types";

// Animated ellipsis component for generating messages
const GeneratingIndicator = styled.span`
  color: #6b7280;
  font-size: 12px;

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

const MessageBubble: React.FC<MessageBubbleProps> = ({
  id,
  content,
  isUser,
  timestamp,
  thinkingContent,
  isThinking,
  contextItems,
  toolCalls,
  onDeleteMessage,
  isGenerating,
  parts,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedReasoningIndex, setExpandedReasoningIndex] = useState<
    number | undefined
  >();

  // Ensure parts exist and are properly formatted
  const ensuredParts = parts && Array.isArray(parts) ? parts : [];

  // Create fallback parts from legacy props if no parts provided
  const fallbackParts = [];

  // Add content as text part if available
  if (content && !ensuredParts.some((part) => part.type === "text")) {
    fallbackParts.push({
      type: "text",
      text: content,
    });
  }

  // Add thinking content as reasoning part if available
  if (
    thinkingContent &&
    !ensuredParts.some((part) => part.type === "reasoning")
  ) {
    fallbackParts.push({
      type: "reasoning",
      text: thinkingContent,
      state: isThinking ? "streaming" : "complete",
    });
  }

  // Add context items as context parts if available
  if (contextItems && contextItems.length > 0) {
    contextItems.forEach((item) => {
      if (!ensuredParts.some((part: any) => part.sourceId === item.id)) {
        fallbackParts.push({
          type: item.type || "source-document",
          title: item.name,
          filename: item.name,
          url: item.url,
          sourceId: item.id,
          mediaType: item.mediaType,
          ...item.data,
        });
      }
    });
  }

  // Add tool calls as tool parts if available
  if (toolCalls && Object.keys(toolCalls).length > 0) {
    Object.entries(toolCalls).forEach(([toolCallId, toolCall]) => {
      if (!ensuredParts.some((part: any) => part.toolCallId === toolCallId)) {
        // Add tool call part
        fallbackParts.push({
          type: "tool-call",
          toolCallId,
          toolName: toolCall.name,
          input: toolCall.arguments,
          state: toolCall.status,
        });

        // Add tool result part if available
        if (toolCall.result !== undefined) {
          fallbackParts.push({
            type: "tool-result",
            toolCallId,
            toolName: toolCall.name,
            output: toolCall.result,
            state: toolCall.status === "error" ? "error" : "success",
          });
        }
      }
    });
  }

  // Use ensured parts or fallback parts
  const finalParts = ensuredParts.length > 0 ? ensuredParts : fallbackParts;

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (onDeleteMessage && id) {
      onDeleteMessage(id);
    }
    setShowDeleteConfirm(false);
  }, [onDeleteMessage, id]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const handleReasoningToggle = useCallback((index: number) => {
    setExpandedReasoningIndex((prev) => (prev === index ? undefined : index));
  }, []);

  return (
    <BubbleContainer isUser={isUser}>
      <Bubble $isUser={isUser}>
        {isUser && onDeleteMessage && (
          <DeleteButton
            onClick={handleDeleteClick}
            title="Delete message and all subsequent messages"
          >
            <TrashIcon />
          </DeleteButton>
        )}

        {showDeleteConfirm && (
          <div
            style={{
              position: "absolute",
              top: "0",
              right: "40px",
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              padding: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              zIndex: 10,
            }}
          >
            <p style={{ margin: "0 0 8px 0", fontSize: "12px" }}>
              Delete this message and all subsequent messages? All changes will
              roll back.
            </p>
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={handleDeleteCancel}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  border: "1px solid #ef4444",
                  borderRadius: "4px",
                  background: "#ef4444",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}

        <MessageContent>
          <PartRenderer
            parts={finalParts}
            isUser={isUser}
            onReasoningToggle={handleReasoningToggle}
            expandedReasoningIndex={expandedReasoningIndex}
          />
        </MessageContent>
      </Bubble>

      {isGenerating ? (
        <Time>
          <GeneratingIndicator>Generating</GeneratingIndicator>
        </Time>
      ) : (
        timestamp && <Time>{timestamp}</Time>
      )}
    </BubbleContainer>
  );
};

export default React.memo(MessageBubble);
