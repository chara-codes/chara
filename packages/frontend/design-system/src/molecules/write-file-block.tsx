"use client";

import React from "react";
import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { FileIcon } from "../atoms";
import { CloseIcon } from "../atoms/icons/close-icon";

interface WriteFileBlockProps {
  filePath: string;
  content: string;
  isGenerating?: boolean;
  isVisible?: boolean;
  onClose?: () => void;
  streamingSpeed?: number; // milliseconds between characters
  showLineNumbers?: boolean;
  maxHeight?: number;
}

const typewriter = keyframes`
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
`;

const blink = keyframes`
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
`;

const WriteFileContainer = styled.div<{ isVisible?: boolean }>`
  margin-top: 16px;
  background-color: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow: hidden;
  transition:
    opacity 0.2s ease,
    height 0.2s ease;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  height: ${({ isVisible }) => (isVisible ? "auto" : "0")};
  margin-bottom: ${({ isVisible }) => (isVisible ? "16px" : "0")};
`;

const WriteFileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
`;

const WriteFileTitle = styled.div`
  font-weight: 500;
  font-size: 12px;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const WriteFileActions = styled.div`
  display: flex;
  gap: 8px;
`;

const StyledWriteFileButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  font-size: 11px;
  border-radius: 4px;

  &:hover {
    background-color: #e5e7eb;
    color: #4b5563;
  }
`;

const WriteFileContent = styled.div<{ maxHeight: number }>`
  max-height: ${({ maxHeight }) => maxHeight}px;
  overflow-y: auto;
  padding: 12px;
  background-color: #f9fafb;
`;

const CodeContainer = styled.div<{ showLineNumbers: boolean }>`
  display: flex;
  background-color: #ffffff;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  overflow: hidden;

  ${({ showLineNumbers }) =>
    !showLineNumbers &&
    `
    > div:first-child {
      display: none;
    }
  `}
`;

const LineNumbers = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 8px 12px 8px 8px;
  color: #9ca3af;
  user-select: none;
  border-right: 1px solid #e5e7eb;
  background-color: #f9fafb;
  min-width: 40px;
`;

const LineNumber = styled.div`
  font-size: 12px;
  line-height: 1.5;
`;

const CodeContent = styled.pre<{ isGenerating?: boolean }>`
  margin: 0;
  padding: 8px 12px;
  white-space: pre-wrap;
  word-break: break-word;
  flex: 1;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #374151;
  background-color: #ffffff;
  position: relative;

  &::after {
    content: "${({ isGenerating }) => (isGenerating ? "|" : "")}";
    animation: ${({ isGenerating }) => (isGenerating ? blink : "none")} 1s
      infinite;
    color: #4b5563;
    font-weight: bold;
  }
`;

const StatusBadge = styled.div<{
  $status: "generating" | "complete" | "error";
}>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  margin-left: 8px;

  background-color: ${({ $status }) => {
    switch ($status) {
      case "generating":
        return "#dbeafe";
      case "complete":
        return "#d1fae5";
      case "error":
        return "#fee2e2";
      default:
        return "#f3f4f6";
    }
  }};
  color: ${({ $status }) => {
    switch ($status) {
      case "generating":
        return "#2563eb";
      case "complete":
        return "#10b981";
      case "error":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  }};
`;

const GenerationStats = styled.div`
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
  font-size: 11px;
  color: #6b7280;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const WriteFileBlock: React.FC<WriteFileBlockProps> = ({
  filePath,
  content,
  isGenerating = false,
  isVisible = true,
  onClose = () => {},
  streamingSpeed = 20,
  showLineNumbers = true,
  maxHeight = 500,
}) => {
  // Validate props
  if (!filePath || typeof filePath !== "string") {
    console.warn(
      "WriteFileBlock: filePath prop is required and must be a string",
    );
    return null;
  }

  if (typeof content !== "string") {
    console.warn("WriteFileBlock: content prop must be a string");
    return null;
  }
  const [displayedContent, setDisplayedContent] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isGenerating && currentIndex < content.length) {
      const timer = setTimeout(
        () => {
          setDisplayedContent(content.slice(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        },
        Math.max(1, streamingSpeed),
      ); // Ensure minimum 1ms delay

      return () => clearTimeout(timer);
    } else if (!isGenerating) {
      setDisplayedContent(content);
      setCurrentIndex(content.length);
    }
  }, [content, currentIndex, isGenerating, streamingSpeed]);

  // Reset when content changes completely
  useEffect(() => {
    if (!isGenerating) {
      setDisplayedContent(content);
      setCurrentIndex(content.length);
    } else {
      // If generating and content is completely different, restart
      if (currentIndex > content.length) {
        setCurrentIndex(0);
        setDisplayedContent("");
      }
    }
  }, [content]);

  const lineCount = displayedContent.split("\n").length;
  const characterCount = displayedContent.length;
  const totalLines = content.split("\n").length;
  const totalCharacters = content.length;
  const status = isGenerating ? "generating" : "complete";

  // Get file extension for display
  const getFileExtension = (path: string): string => {
    const parts = path.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  };

  const fileExtension = getFileExtension(filePath);
  const fileName = filePath.split("/").pop() || filePath;

  return (
    <WriteFileContainer isVisible={isVisible}>
      <WriteFileHeader>
        <WriteFileTitle>
          <FileIcon width={12} height={12} />
          {fileName}
          {fileExtension && (
            <span
              style={{ color: "#9ca3af", fontSize: "10px", marginLeft: "4px" }}
            >
              .{fileExtension}
            </span>
          )}
          <StatusBadge $status={status}>
            {isGenerating ? "Generating..." : "Complete"}
          </StatusBadge>
        </WriteFileTitle>
        <WriteFileActions>
          <StyledWriteFileButton onClick={onClose}>
            <CloseIcon size={12} />
          </StyledWriteFileButton>
        </WriteFileActions>
      </WriteFileHeader>

      <GenerationStats>
        <StatItem>
          <span>Lines:</span>
          <span>
            {lineCount}
            {isGenerating && totalLines > lineCount ? `/${totalLines}` : ""}
          </span>
        </StatItem>
        <StatItem>
          <span>Characters:</span>
          <span>
            {characterCount}
            {isGenerating && totalCharacters > characterCount
              ? `/${totalCharacters}`
              : ""}
          </span>
        </StatItem>
        {isGenerating && content.length > 0 && (
          <StatItem>
            <span>Progress:</span>
            <span>{Math.round((currentIndex / content.length) * 100)}%</span>
          </StatItem>
        )}
      </GenerationStats>

      <WriteFileContent maxHeight={maxHeight}>
        <CodeContainer showLineNumbers={showLineNumbers}>
          {showLineNumbers && (
            <LineNumbers>
              {displayedContent.split("\n").map((_, index) => (
                <LineNumber key={`line-${index}`}>{index + 1}</LineNumber>
              ))}
            </LineNumbers>
          )}
          <CodeContent isGenerating={isGenerating}>
            {displayedContent}
          </CodeContent>
        </CodeContainer>
      </WriteFileContent>
    </WriteFileContainer>
  );
};

export default WriteFileBlock;
export { WriteFileBlock };
