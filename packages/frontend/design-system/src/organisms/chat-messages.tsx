"use client";

import type { UIMessage } from "ai";
import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { ScrollDownIcon } from "../atoms/icons";
import MessageBubble from "../molecules/message-bubble";

// Helper function to ensure message has proper parts structure
const ensureMessageParts = (message: UIMessage): UIMessage => {
  if (message.parts && Array.isArray(message.parts)) {
    return {
      ...message,
      parts: message.parts,
    };
  }

  // If message has content property (legacy format), convert to parts
  if ((message as any).content) {
    const content = (message as any).content;
    const parts: any[] = [];

    if (typeof content === "string") {
      parts.push({
        type: "text",
        text: content,
      });
    } else if (Array.isArray(content)) {
      // Handle array content (legacy MessageContent format)
      content.forEach((item: any) => {
        if (typeof item === "string") {
          parts.push({
            type: "text",
            text: item,
          });
        } else if (item.type === "text") {
          parts.push({
            type: "text",
            text: item.text || "",
          });
        }
      });
    }

    return {
      ...message,
      parts,
    };
  }

  // Fallback: return message with empty parts
  return {
    ...message,
    parts: [],
  };
};

// Helper function to extract text content from UIMessage parts
const getMessageContent = (message: UIMessage): string => {
  const ensuredMessage = ensureMessageParts(message);
  return ensuredMessage.parts.map((part) => part.text || "").join("");
};

// Helper function to extract context items from parts
const getContextItems = (message: UIMessage): any[] => {
  const ensuredMessage = ensureMessageParts(message);
  return ensuredMessage.parts.map((part) => {
    if (part.type === "source-url") {
      return {
        id: part.sourceId || Math.random().toString(),
        name: part.title || part.url || "Unknown",
        type: part.type,
        url: part.url,
        data: part,
      };
    } else if (part.type === "source-document") {
      return {
        id: part.sourceId || Math.random().toString(),
        name: part.title || part.filename || "Unknown",
        type: part.type,
        mediaType: part.mediaType,
        data: part,
      };
    } else if (part.type === "file") {
      return {
        id: Math.random().toString(),
        name: part.filename || "Unknown",
        type: part.type,
        url: part.url,
        mediaType: part.mediaType,
        data: part,
      };
    }
    return {
      id: Math.random().toString(),
      name: "Unknown",
      type: "unknown",
      data: part,
    };
  });
};

// Helper function to extract tool calls from parts
const getToolCalls = (message: UIMessage): Record<string, any> => {
  const toolCalls: Record<string, any> = {};
  const ensuredMessage = ensureMessageParts(message);

  ensuredMessage.parts.forEach((part: any) => {
    if (part.toolCallId) {
      if (!toolCalls[part.toolCallId]) {
        toolCalls[part.toolCallId] = {
          id: part.toolCallId,
          name: "",
          arguments: {},
          status: "pending",
          result: undefined,
        };
      }

      if (part.type?.includes("call") || part.input) {
        toolCalls[part.toolCallId] = {
          ...toolCalls[part.toolCallId],
          name: part.toolName || toolCalls[part.toolCallId].name,
          arguments: part.input || {},
          status: part.state || "pending",
        };
      }

      if (part.type?.includes("result") || part.output !== undefined) {
        toolCalls[part.toolCallId] = {
          ...toolCalls[part.toolCallId],
          result: part.output,
          status: part.state || "success",
        };
      }
    }
  });

  return toolCalls;
};

// Helper function to extract thinking content from reasoning parts
const getThinkingContent = (message: UIMessage): string | undefined => {
  const ensuredMessage = ensureMessageParts(message);
  const reasoningParts = ensuredMessage.parts;
  return reasoningParts.map((part) => part.text).join("\n") || undefined;
};

// Helper function to check if message is currently thinking
const isMessageThinking = (message: UIMessage): boolean => {
  const ensuredMessage = ensureMessageParts(message);
  return ensuredMessage.parts.some(
    (part) => part.type === "reasoning" && part.state === "streaming"
  );
};

// ChatMessagesProps interface
interface ChatMessagesProps {
  messages: UIMessage[];
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
    return scrollTop + clientHeight >= scrollHeight - 300;
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
              message.metadata &&
              typeof message.metadata === "object" &&
              "timestamp" in message.metadata &&
              typeof message.metadata.timestamp === "number"
                ? new Date(message.metadata.timestamp).toLocaleString()
                : undefined
            }
            thinkingContent={getThinkingContent(message)}
            isThinking={isMessageThinking(message)}
            contextItems={getContextItems(message)}
            toolCalls={getToolCalls(message)}
            onDeleteMessage={onDeleteMessage}
            isGenerating={
              isResponding &&
              index === messages.length - 1 &&
              message.role !== "user"
            }
            parts={ensureMessageParts(message).parts}
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
