"use client";

import { ChevronDown, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import type React from "react";
import { memo, useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { FileIcon } from "../../atoms";

interface WriteFileBlockProps {
  filePath: string;
  content: string;
  isGenerating?: boolean;
  isVisible?: boolean;
  streamingSpeed?: number; // milliseconds between characters
  showLineNumbers?: boolean;
  maxHeight?: number;
  toolCallId?: string;
}

type ViewMode = "collapsed" | "limited" | "full";

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
  transition: opacity 0.2s ease, height 0.2s ease;
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
  align-items: center;
`;

const ExpandCollapseButton = styled.button`
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

const WriteFileContent = styled.div<{ maxHeight: number; viewMode: ViewMode }>`
  max-height: ${({ maxHeight, viewMode }) =>
    viewMode === "full" ? "none" : `${maxHeight}px`};
  overflow-y: ${({ viewMode }) => (viewMode === "full" ? "visible" : "auto")};
  padding: 0;
  background-color: #f9fafb;
  border-width: 0;
  display: ${({ viewMode }) => (viewMode === "collapsed" ? "none" : "block")};
`;

const CodeContainer = styled.div<{ showLineNumbers: boolean }>`
  display: flex;
  background-color: #ffffff;
  border-radius: 4px;
  border: 0px solid #e5e7eb;
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
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
`;

const LineNumber = styled.div`
  font-size: 12px;
  line-height: 1.5;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 18px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
`;

const SimpleCodeContainer = styled.div`
  flex: 1;
  padding: 8px 12px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #374151;
  background-color: #ffffff;
  white-space: pre;
  overflow-x: auto;
  position: relative;
`;

const CodeLine = styled.div`
  font-size: 12px;
  line-height: 1.5;
  height: 18px;
  min-height: 18px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  display: flex;
  align-items: center;
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

const GenerationStats = styled.div<{ viewMode: ViewMode }>`
  display: ${({ viewMode }) => (viewMode === "collapsed" ? "none" : "flex")};
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
  font-size: 11px;
  color: #6b7280;
`;

const ViewModeToggle = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 12px;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
`;

const ViewModeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 11px;
  border-radius: 4px;

  &:hover {
    background-color: #e5e7eb;
    color: #4b5563;
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const WriteFileBlockComponent: React.FC<WriteFileBlockProps> = ({
  content,
  filePath,
  isGenerating = false,
  isVisible = true,
  streamingSpeed = 50,
  showLineNumbers = true,
  maxHeight = 500,
  toolCallId: _toolCallId,
}) => {
  // Initialize hooks first
  const [displayedContent, setDisplayedContent] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("collapsed");

  useEffect(() => {
    if (isGenerating && currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, Math.max(1, streamingSpeed)); // Ensure minimum 1ms delay

      return () => clearTimeout(timer);
    }
  }, [isGenerating, currentIndex, content, streamingSpeed]);

  useEffect(() => {
    if (!isGenerating) {
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
  }, [content, currentIndex, isGenerating]);

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

  // Calculate if content fits within limited height
  const contentLines = displayedContent.split("\n").length;
  const estimatedContentHeight = contentLines * 18 + 16; // 18px per line + padding
  const contentFitsInLimitedView = estimatedContentHeight <= maxHeight;

  const toggleCollapse = () => {
    setViewMode(viewMode === "collapsed" ? "limited" : "collapsed");
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "limited" ? "full" : "limited");
  };

  // Validate props and return early if invalid
  if (!filePath || typeof filePath !== "string") {
    console.warn(
      "WriteFileBlock: filePath prop is required and must be a string"
    );
    return null;
  }

  if (typeof content !== "string") {
    console.warn("WriteFileBlock: content prop must be a string");
    return null;
  }

  return (
    <WriteFileContainer isVisible={isVisible}>
      <WriteFileHeader>
        <WriteFileTitle>
          <FileIcon width={12} height={12} />
          {fileName}
          {fileExtension && (
            <span
              style={{
                color: "#9ca3af",
                fontSize: "10px",
                marginLeft: "4px",
              }}
            >
              .{fileExtension}
            </span>
          )}
          <StatusBadge $status={status}>
            {isGenerating ? "Generating..." : "Complete"}
          </StatusBadge>
        </WriteFileTitle>
        <WriteFileActions>
          <ExpandCollapseButton onClick={toggleCollapse}>
            {viewMode === "collapsed" ? (
              <ChevronRight size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
          </ExpandCollapseButton>
        </WriteFileActions>
      </WriteFileHeader>

      <GenerationStats viewMode={viewMode}>
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

      <WriteFileContent maxHeight={maxHeight} viewMode={viewMode}>
        <CodeContainer showLineNumbers={showLineNumbers}>
          {showLineNumbers && (
            <LineNumbers>
              {displayedContent.split("\n").map((_, index) => (
                <LineNumber key={`line-unknown-${index}`}>
                  {index + 1}
                </LineNumber>
              ))}
            </LineNumbers>
          )}
          <SimpleCodeContainer>
            {displayedContent.split("\n").map((line, index, lines) => (
              <CodeLine key={`code-line-unknown-${index}`}>
                <span>{line || "\u00A0"}</span>
                {isGenerating && index === lines.length - 1 && (
                  <span
                    style={{
                      animation: `${blink} 1s infinite`,
                      color: "#4b5563",
                      fontWeight: "bold",
                      marginLeft: "1px",
                    }}
                  >
                    |
                  </span>
                )}
              </CodeLine>
            ))}
          </SimpleCodeContainer>
        </CodeContainer>
      </WriteFileContent>

      {viewMode !== "collapsed" && !contentFitsInLimitedView && (
        <ViewModeToggle>
          <ViewModeButton onClick={toggleViewMode}>
            {viewMode === "limited" ? (
              <>
                <Maximize2 size={12} />
                Show Full File
              </>
            ) : (
              <>
                <Minimize2 size={12} />
                Show Limited
              </>
            )}
          </ViewModeButton>
        </ViewModeToggle>
      )}
    </WriteFileContainer>
  );
};

const WriteFileBlock = memo(
  WriteFileBlockComponent,
  (prevProps: WriteFileBlockProps, nextProps: WriteFileBlockProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.filePath === nextProps.filePath &&
      prevProps.content === nextProps.content &&
      prevProps.isGenerating === nextProps.isGenerating &&
      prevProps.isVisible === nextProps.isVisible &&
      prevProps.streamingSpeed === nextProps.streamingSpeed &&
      prevProps.showLineNumbers === nextProps.showLineNumbers &&
      prevProps.maxHeight === nextProps.maxHeight &&
      prevProps.toolCallId === nextProps.toolCallId
    );
  }
);

WriteFileBlock.displayName = "WriteFileBlock";

export default WriteFileBlock;
export { WriteFileBlock };
