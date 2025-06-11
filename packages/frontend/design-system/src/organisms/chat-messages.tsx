"use client";

import React from "react";
import styled from "styled-components";
import MessageBubble from "../molecules/message-bubble";
import type { Message } from "@chara/core";
import { useCallback, useEffect, useRef, useState } from "react";

// Update the ChatMessagesProps interface to include handlers for the new buttons
interface ChatMessagesProps {
  messages: Message[];
  isResponding?: boolean;
  onKeepAllDiffs?: (messageId: string) => void;
  onRevertAllDiffs?: (messageId: string) => void;
  onKeepDiff?: (messageId: string, diffId: string) => void;
  onRevertDiff?: (messageId: string, diffId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
`;

const ScrollToBottomButton = styled.button`
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(107, 114, 128, 0.1);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: rgba(75, 85, 99, 0.9);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.3);
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: translateY(-1px);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  text-align: center;
  padding: 0 24px;
`;

const EmptyStateTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
`;

const EmptyStateText = styled.p`
  font-size: 12px;
  line-height: 1.4;
`;

// Update the ChatMessages component to pass the handlers to MessageBubble
const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  onKeepAllDiffs,
  onRevertAllDiffs,
  onKeepDiff,
  onRevertDiff,
  onDeleteMessage,
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Check if user is near bottom of scroll
  const isNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 100;
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
      setShouldAutoScroll(true);
      setUserScrolledUp(false);
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const nearBottom = isNearBottom();
    setShowScrollButton(!nearBottom);

    // If user scrolls up manually, disable auto-scroll
    if (!nearBottom) {
      setUserScrolledUp(true);
      setShouldAutoScroll(false);
    } else {
      // If user scrolls back to bottom manually, re-enable auto-scroll
      setUserScrolledUp(false);
      setShouldAutoScroll(true);
    }
  }, [isNearBottom]);

  // Auto-scroll when new messages arrive or when responding (but not if user scrolled up)
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (shouldAutoScroll && !userScrolledUp) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll, userScrolledUp, scrollToBottom]);

  // Add scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Add handlers for individual diff updates
  const handleKeepDiff = useCallback(
    (messageId: string, diffId: string) => {
      console.log(`Keeping diff ${diffId} in message ${messageId}`);
      if (onKeepDiff) {
        onKeepDiff(messageId, diffId);
      }
    },
    [onKeepDiff],
  );

  const handleRevertDiff = useCallback(
    (messageId: string, diffId: string) => {
      console.log(`Reverting diff ${diffId} in message ${messageId}`);
      if (onRevertDiff) {
        onRevertDiff(messageId, diffId);
      }
    },
    [onRevertDiff],
  );

  if (messages.length === 0) {
    return (
      <EmptyState>
        <EmptyStateTitle>No messages yet</EmptyStateTitle>
        <EmptyStateText>
          Start a conversation by typing a message below.
        </EmptyStateText>
      </EmptyState>
    );
  }

  return (
    <Container>
      <MessagesContainer ref={messagesContainerRef}>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            id={message.id}
            content={message.content}
            isUser={message.isUser}
            timestamp={message.timestamp}
            thinkingContent={message.thinkingContent}
            isThinking={message.isThinking}
            contextItems={message.contextItems}
            filesToChange={message.filesToChange}
            commandsToExecute={message.commandsToExecute}
            executedCommands={message.executedCommands}
            fileDiffs={message.fileDiffs}
            toolCalls={message.toolCalls}
            segments={message.segments}
            onKeepAllDiffs={() => onKeepAllDiffs?.(message.id)}
            onRevertAllDiffs={() => onRevertAllDiffs?.(message.id)}
            onKeepDiff={(diffId) => handleKeepDiff(message.id, diffId)}
            onRevertDiff={(diffId) => handleRevertDiff(message.id, diffId)}
            onDeleteMessage={onDeleteMessage}
          />
        ))}
      </MessagesContainer>

      {showScrollButton && (
        <ScrollToBottomButton onClick={scrollToBottom} title="Scroll to bottom">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Scroll Down</title>
            <path
              d="M7 10L12 15L17 10"
              stroke-width="2"
              stroke="#c0c0c0"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </ScrollToBottomButton>
      )}
    </Container>
  );
};

export default React.memo(ChatMessages);
