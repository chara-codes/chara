"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { ScrollDownIcon } from "../atoms/icons";
import MessageBubble from "../molecules/message-bubble";

// UIMessage-compatible message format for display
interface DisplayMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts?: Array<{ type: "text"; text: string }>;
  content?: string; // Backward compatibility
  timestamp?: string;
  thinkingContent?: string;
  isThinking?: boolean;
  contextItems?: any[];
  toolCalls?: Record<string, any>;
  metadata?: {
    timestamp?: number;
    context?: unknown;
    toolCalls?: unknown;
    commit?: string;
  };
}

// Helper function to extract content from UIMessage format
const getMessageContent = (message: DisplayMessage): string => {
  if (message.content) {
    return message.content;
  }

  if (message.parts && message.parts.length > 0) {
    // Extract text from all parts and join them
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");
  }

  return "";
};

// ChatMessagesProps interface
interface ChatMessagesProps {
  messages: DisplayMessage[];
  isResponding?: boolean;
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
  isResponding = false,
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
    return scrollTop + clientHeight >= scrollHeight - 150;
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollToBottom is stable
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
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            id={message.id}
            content={getMessageContent(message)}
            isUser={message.role === "user"}
            timestamp={
              message.timestamp ||
              (message.metadata?.timestamp
                ? new Date(message.metadata.timestamp).toLocaleString()
                : undefined)
            }
            thinkingContent={message.thinkingContent}
            isThinking={message.isThinking}
            contextItems={message.contextItems}
            toolCalls={
              (message.toolCalls as Record<string, any>) ||
              (message.metadata?.toolCalls as Record<string, any>)
            }
            onDeleteMessage={onDeleteMessage}
            isGenerating={
              isResponding &&
              index === messages.length - 1 &&
              message.role !== "user"
            }
          />
        ))}
      </MessagesContainer>

      {showScrollButton && (
        <ScrollToBottomButton onClick={scrollToBottom} title="Scroll to bottom">
          <ScrollDownIcon />
        </ScrollToBottomButton>
      )}
    </Container>
  );
};

export default React.memo(ChatMessages);
