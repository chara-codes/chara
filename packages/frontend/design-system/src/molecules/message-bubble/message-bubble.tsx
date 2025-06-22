"use client";

import React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown"; // Import ReactMarkdown
import remarkGfm from "remark-gfm"; // Import remark-gfm for GitHub Flavored Markdown
import rehypeHighlight from "rehype-highlight"; // Import rehype-highlight for syntax highlighting
import "highlight.js/styles/github.css"; // Import highlight.js CSS theme for syntax highlighting
import CommandTerminal from "../command-terminal";
import FileDiffComponent from "../file-diff";
import FileChangesList from "../file-changes-list";
import type { MessageContent as MessageContentType } from "@chara/core";
import { InlineMessageContent } from "./inline-message-content";
import type { MessageBubbleProps } from "./types";
import {
  FileIcon,
  LinkIcon,
  TextIcon,
  DocumentationIcon,
  TerminalIcon,
  FilesIcon,
  CommandsIcon,
  TrashIcon,
  ToolIcon,
} from "./icons";
import {
  BubbleContainer,
  Bubble,
  MessageContent, // This styled component will wrap the Markdown output
  Time,
  ContextContainer,
  ContextItemComponent,
  ContextLabel,
  ContextItemWrapper,
  InstructionSection,
  InstructionHeader,
  InstructionList,
  InstructionItem,
  TabsContainer,
  Tab,
  TabContent,
  DeleteButton,
  // Styled components for inline context details
  ContextDetailsPanel,
  ContextDetailHeader,
  ContextDetailTitle,
  ContextDetailType,
  ContextDetailContent,
  CloseButton,
  CloseIcon,
  // Thinking section styled components
  ThinkingContainer,
  ThinkingHeader,
  ThinkingLabel,
  ThinkingToggle,
  ThinkingContent,
  ThinkingIcon,
  ChevronIconSVG,
  // Tool call styled components
  ToolCallsContainer,
  ToolCallItem,
  ToolCallName,
  ToolCallStatus,
  ToolCallArguments,
  ToolCallArgumentsLabel,
  ToolCallArgumentsContent,
  ToolCallResult,
  ToolCallResultLabel,
  ToolCallResultContent,
  ToolCallItemHeader,
} from "./styles";
import { getPreviewContent } from "./utils";
import { cleanThinkingTags, type ToolResult } from "@chara/core";
// Removed styled from "styled-components" as it's not used directly here after style components moved to styles.tsx

// Helper function to get the main message content (first text part)
const getMainMessageContent = (
  content: string | MessageContentType[],
): string => {
  if (typeof content === "string") {
    return content;
  }

  // Find the first text part
  const firstTextPart = content.find((part) => part.type === "text");
  return firstTextPart?.text || "";
};

// Helper function to render main message content
const renderMainMessageContent = (
  content: string | MessageContentType[],
  isUser = false,
) => {
  const mainContent = getMainMessageContent(content);

  if (isUser) {
    return mainContent; // Render user content as plain text
  }

  // Render AI content as Markdown with syntax highlighting, cleaned of thinking tags
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
    >
      {cleanThinkingTags(mainContent)}
    </ReactMarkdown>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  id,
  content,
  isUser,
  timestamp,
  thinkingContent,
  isThinking,
  contextItems,
  toolCalls,
  segments,
  onDeleteMessage,
}) => {
  const [expandedContextId, setExpandedContextId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"commands" | "diffs">("diffs");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  const contextPanelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const thinkingContentRef = useRef<HTMLDivElement>(null);

  const hasContext = contextItems && contextItems.length > 0;
  const hasToolCalls = toolCalls !== undefined && toolCalls.length > 0;
  const hasThinkingContent = !isUser && (thinkingContent || isThinking);

  // Auto-expand when thinking starts, auto-collapse when thinking ends
  useEffect(() => {
    if (isThinking && isThinkingExpanded && thinkingContentRef.current) {
      const scrollToBottom = () => {
        if (thinkingContentRef.current) {
          thinkingContentRef.current.scrollTop =
            thinkingContentRef.current.scrollHeight;
        }
      };

      // Scroll immediately
      scrollToBottom();

      // Set up interval to continuously scroll during thinking
      const interval = setInterval(scrollToBottom, 100);

      return () => clearInterval(interval);
    }
  }, [isThinking, isThinkingExpanded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextPanelRef.current &&
        !contextPanelRef.current.contains(event.target as Node) &&
        expandedContextId !== null
      ) {
        let clickedOnContextItem = false;
        for (const itemEl of itemRefs.current.values()) {
          if (itemEl.contains(event.target as Node)) {
            clickedOnContextItem = true;
            break;
          }
        }
        if (!clickedOnContextItem) {
          setExpandedContextId(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expandedContextId]);

  const handleContextItemClick = (itemId: string) => {
    setExpandedContextId((prevId) => (prevId === itemId ? null : itemId));
  };

  const handleCloseContextDetails = () => {
    setExpandedContextId(null);
  };

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

  const handleThinkingToggle = useCallback(() => {
    setIsThinkingExpanded((prev) => !prev);
  }, []);

  const formatToolCallResult = useCallback((result: ToolResult | unknown) => {
    console.log("formatToolCallResult: received result", result);

    if (!result) return "No result";

    const resultObj = result as Record<string, unknown>;

    // Handle error case
    if (typeof result === "object" && result !== null && "error" in result) {
      console.log("formatToolCallResult: using error", resultObj.error);
      return String(resultObj.error);
    }

    // Handle content case
    if (typeof result === "object" && result !== null && "content" in result) {
      console.log("formatToolCallResult: using content", resultObj.content);
      return String(resultObj.content);
    }

    // Handle data case
    if (typeof result === "object" && result !== null && "data" in result) {
      console.log("formatToolCallResult: using data", resultObj.data);
      return JSON.stringify(resultObj.data, null, 2);
    }

    // Handle direct result object
    console.log("formatToolCallResult: using direct result", result);
    return JSON.stringify(result, null, 2);
  }, []);

  const getIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case "file":
        return <FileIcon />;
      case "link":
        return <LinkIcon />;
      case "text":
        return <TextIcon />;
      case "documentation":
        return <DocumentationIcon />;
      case "terminal":
        return <TerminalIcon />;
      default:
        return null;
    }
  };

  const expandedContextItem = expandedContextId
    ? contextItems?.find((item) => item.id === expandedContextId)
    : null;

  return (
    <BubbleContainer isUser={isUser}>
      <Bubble isUser={isUser}>
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

        {hasThinkingContent && (
          <ThinkingContainer isExpanded={isThinkingExpanded}>
            <ThinkingHeader
              style={{
                cursor: "pointer",
                opacity: 1,
              }}
            >
              <ThinkingLabel onClick={handleThinkingToggle}>
                <ThinkingIcon />
                {isThinking ? "Thinking..." : "Thought process"}
              </ThinkingLabel>
              <ThinkingToggle onClick={handleThinkingToggle}>
                <ChevronIconSVG isExpanded={isThinkingExpanded} />
              </ThinkingToggle>
            </ThinkingHeader>
            {(thinkingContent || isThinking) && (
              <ThinkingContent
                ref={thinkingContentRef}
                isExpanded={isThinkingExpanded}
              >
                {thinkingContent || "Processing your request..."}
              </ThinkingContent>
            )}
          </ThinkingContainer>
        )}

        <MessageContent>
          {segments && segments.length > 0 ? (
            // Render message with inline tool calls
            <InlineMessageContent segments={segments} isUser={isUser} />
          ) : (
            // Render only the main message content
            renderMainMessageContent(content, isUser)
          )}
        </MessageContent>

        {hasContext && (
          <>
            <ContextContainer isUser={isUser}>
              <ContextLabel isUser={isUser}>Using context:</ContextLabel>
              {contextItems.map((item) => (
                <ContextItemWrapper key={item.id}>
                  <ContextItemComponent
                    ref={(el) => {
                      if (el) itemRefs.current.set(item.id, el);
                    }}
                    isUser={isUser}
                    onClick={() => handleContextItemClick(item.id)}
                    style={{
                      backgroundColor:
                        expandedContextId === item.id
                          ? isUser
                            ? "#e5e7eb"
                            : "#d1d5db"
                          : undefined,
                    }}
                  >
                    {getIcon(item.type)}
                    {item.name}
                  </ContextItemComponent>
                </ContextItemWrapper>
              ))}
            </ContextContainer>

            {expandedContextItem && (
              <ContextDetailsPanel ref={contextPanelRef}>
                <ContextDetailHeader>
                  <ContextDetailTitle>
                    {getIcon(expandedContextItem.type)}
                    {expandedContextItem.name}
                    <ContextDetailType>
                      {expandedContextItem.type}
                    </ContextDetailType>
                  </ContextDetailTitle>
                  <CloseButton
                    onClick={handleCloseContextDetails}
                    title="Close"
                  >
                    <CloseIcon />
                  </CloseButton>
                </ContextDetailHeader>
                <ContextDetailContent>
                  {getPreviewContent(expandedContextItem)}
                </ContextDetailContent>
              </ContextDetailsPanel>
            )}
          </>
        )}
      </Bubble>

      {timestamp && <Time>{timestamp}</Time>}
    </BubbleContainer>
  );
};

export default React.memo(MessageBubble);
