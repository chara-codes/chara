"use client";

import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { TrashIcon } from "../../atoms/icons";
import { isDebugMode } from "../../utils/debug";
import DebugMessage from "./debug-message";
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
  color: ${props => props.theme.colors.textSecondary};
  font-size: 12px;
  transition: color ${props => props.theme.transitions.theme};

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

const DeleteConfirmDialog = styled.div`
  position: absolute;
  top: 0;
  right: 40px;
  background: ${props => props.theme.colors.backgroundSecondary};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  padding: 8px;
  box-shadow: ${props => props.theme.shadows.md};
  z-index: 10;
  transition: background-color ${props => props.theme.transitions.theme},
              border-color ${props => props.theme.transitions.theme};
`;

const DeleteConfirmText = styled.p`
  margin: 0 0 8px 0;
  font-size: 12px;
  color: ${props => props.theme.colors.text};
  transition: color ${props => props.theme.transitions.theme};
`;

const DeleteConfirmButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  transition: background-color ${props => props.theme.transitions.theme},
              border-color ${props => props.theme.transitions.theme},
              color ${props => props.theme.transitions.theme};

  &:hover {
    background: ${props => props.theme.colors.highlight};
  }
`;

const ConfirmDeleteButton = styled.button`
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid ${props => props.theme.colors.error};
  border-radius: 4px;
  background: ${props => props.theme.colors.error};
  color: ${props => props.theme.colors.background};
  cursor: pointer;
  transition: background-color ${props => props.theme.transitions.theme},
              border-color ${props => props.theme.transitions.theme};

  &:hover {
    background: ${props => props.theme.colors.errorHover};
    border-color: ${props => props.theme.colors.errorHover};
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

  // Create fallback parts from legacy props only if no parts provided
  const fallbackParts = [];

  // Only add fallback parts if we have no parts at all
  if (ensuredParts.length === 0) {
    // Add content as text part if available
    if (content) {
      fallbackParts.push({
        type: "text",
        text: content,
      });
    }

    // Add thinking content as reasoning part if available
    if (thinkingContent) {
      fallbackParts.push({
        type: "reasoning",
        text: thinkingContent,
        state: isThinking ? "streaming" : "complete",
      });
    }

    // Add context items as context parts if available
    if (contextItems && contextItems.length > 0) {
      contextItems.forEach((item) => {
        fallbackParts.push({
          type: item.type || "source-document",
          title: item.name,
          filename: item.name,
          url: item.url,
          sourceId: item.id,
          mediaType: item.mediaType,
          content: item.content,
          ...item.data,
        });
      });
    }
  }

  // Add tool calls as tool parts if available
  if (toolCalls && Object.keys(toolCalls).length > 0) {
    Object.entries(toolCalls).forEach(([toolCallId, toolCall]) => {
      if (!ensuredParts.some((part: { toolCallId?: string }) => part.toolCallId === toolCallId)) {
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

  // Use ensured parts if available, otherwise use fallback parts
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
          <DeleteConfirmDialog>
            <DeleteConfirmText>
              Delete this message and all subsequent messages? All changes will
              roll back.
            </DeleteConfirmText>
            <DeleteConfirmButtons>
              <CancelButton
                type="button"
                onClick={handleDeleteCancel}
              >
                Cancel
              </CancelButton>
              <ConfirmDeleteButton
                type="button"
                onClick={handleDeleteConfirm}
              >
                Delete
              </ConfirmDeleteButton>
            </DeleteConfirmButtons>
          </DeleteConfirmDialog>
        )}

        <MessageContent>
          {isDebugMode() && <DebugMessage parts={finalParts} messageId={id} />}
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
