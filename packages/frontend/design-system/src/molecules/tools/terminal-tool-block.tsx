"use client";

import type React from "react";
import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { ChevronDown, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { TerminalIcon } from "../../atoms/icons";

interface TerminalToolBlockProps {
  command: string;
  workingDirectory?: string;
  output?: string;
  status?: "pending" | "in-progress" | "success" | "error";
  isGenerating?: boolean;
  isVisible?: boolean;
  streamingSpeed?: number; // milliseconds between characters
  maxHeight?: number;
  toolCallError?: string;
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

const TerminalContainer = styled.div<{ isVisible?: boolean }>`
  margin-top: 16px;
  background-color: #1e1e1e;
  border-radius: 6px;
  border: 1px solid #3d3d3d;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
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

const TerminalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #2d2d2d;
  border-bottom: 1px solid #3d3d3d;
`;

const TerminalTitle = styled.div`
  font-weight: 500;
  font-size: 12px;
  color: #e5e7eb;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const TerminalActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ExpandCollapseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  font-size: 11px;
  border-radius: 4px;

  &:hover {
    background-color: #3d3d3d;
    color: #e5e7eb;
  }
`;

const TerminalContent = styled.div<{ maxHeight: number; viewMode: ViewMode }>`
  max-height: ${({ maxHeight, viewMode }) =>
    viewMode === "full" ? "none" : `${maxHeight}px`};
  overflow-y: ${({ viewMode }) => (viewMode === "full" ? "visible" : "auto")};
  padding: 0;
  background-color: #1e1e1e;
  display: ${({ viewMode }) => (viewMode === "collapsed" ? "none" : "block")};
`;

const StatusBadge = styled.div<{
  $status: "pending" | "in-progress" | "success" | "error";
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
      case "pending":
        return "#374151";
      case "in-progress":
        return "#1e40af";
      case "success":
        return "#065f46";
      case "error":
        return "#7f1d1d";
      default:
        return "#374151";
    }
  }};
  color: ${({ $status }) => {
    switch ($status) {
      case "pending":
        return "#d1d5db";
      case "in-progress":
        return "#60a5fa";
      case "success":
        return "#10b981";
      case "error":
        return "#f87171";
      default:
        return "#d1d5db";
    }
  }};
`;

const CommandSection = styled.div`
  padding: 8px 12px;
  border-bottom: 1px solid #3d3d3d;
  background-color: #2d2d2d;
`;

const CommandPrompt = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #10b981;
  font-size: 12px;
`;

const WorkingDirectory = styled.span`
  color: #60a5fa;
`;

const CommandText = styled.span`
  color: #e5e7eb;
  word-break: break-all;
`;

const OutputSection = styled.div<{ viewMode: ViewMode }>`
  display: ${({ viewMode }) => (viewMode === "collapsed" ? "none" : "block")};
  padding: 8px 12px;
  color: #e5e7eb;
  white-space: pre-wrap;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 12px;
  line-height: 1.5;
  background-color: #1e1e1e;
  position: relative;
  min-height: 20px;
`;

const GenerationStats = styled.div<{ viewMode: ViewMode }>`
  display: ${({ viewMode }) => (viewMode === "collapsed" ? "none" : "flex")};
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #3d3d3d;
  background-color: #2d2d2d;
  font-size: 11px;
  color: #9ca3af;
`;

const ViewModeToggle = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 12px;
  background-color: #2d2d2d;
  border-top: 1px solid #3d3d3d;
`;

const ViewModeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 11px;
  border-radius: 4px;

  &:hover {
    background-color: #3d3d3d;
    color: #e5e7eb;
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ErrorBanner = styled.div`
  padding: 8px 12px;
  background-color: #7f1d1d;
  color: #f87171;
  font-size: 11px;
  border-bottom: 1px solid #3d3d3d;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  white-space: pre-wrap;
`;

const LoadingIndicator = styled.span<{ isGenerating: boolean }>`
  display: ${({ isGenerating }) => (isGenerating ? "inline" : "none")};
  animation: ${blink} 1s infinite;
  color: #10b981;
  font-weight: bold;
`;

const TerminalToolBlock: React.FC<TerminalToolBlockProps> = ({
  command,
  output = "",
  status = "pending",
  isGenerating = false,
  isVisible = true,
  streamingSpeed = 20,
  maxHeight = 300,
  toolCallError,
}) => {
  // Validate props
  if (!command || typeof command !== "string") {
    console.warn(
      "TerminalToolBlock: command prop is required and must be a string",
    );
    return null;
  }

  const [displayedOutput, setDisplayedOutput] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("collapsed");

  useEffect(() => {
    if (isGenerating && currentIndex < output.length) {
      const timer = setTimeout(
        () => {
          setDisplayedOutput(output.slice(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        },
        Math.max(1, streamingSpeed),
      );

      return () => clearTimeout(timer);
    }

    if (!isGenerating) {
      setDisplayedOutput(output);
      setCurrentIndex(output.length);
    }
  }, [output, currentIndex, isGenerating, streamingSpeed]);

  // Reset when output changes completely
  useEffect(() => {
    if (!isGenerating) {
      setDisplayedOutput(output);
      setCurrentIndex(output.length);
    } else {
      // If generating and output is completely different, restart
      if (currentIndex > output.length) {
        setCurrentIndex(0);
        setDisplayedOutput("");
      }
    }
  }, [output, currentIndex, isGenerating]);

  const outputLines = displayedOutput.split("\n").length;
  const totalOutputLines = output.split("\n").length;
  const characterCount = displayedOutput.length;
  const totalCharacters = output.length;

  // Calculate if content fits within limited height
  const estimatedContentHeight = outputLines * 18 + 60; // 18px per line + padding
  const contentFitsInLimitedView = estimatedContentHeight <= maxHeight;

  const toggleCollapse = () => {
    setViewMode(viewMode === "collapsed" ? "limited" : "collapsed");
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "limited" ? "full" : "limited");
  };

  const getStatusText = () => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in-progress":
        return "Running...";
      case "success":
        return "Complete";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  return (
    <TerminalContainer isVisible={isVisible}>
      <TerminalHeader>
        <TerminalTitle>
          <TerminalIcon />
          Terminal
          <StatusBadge $status={status}>{getStatusText()}</StatusBadge>
        </TerminalTitle>
        <TerminalActions>
          <ExpandCollapseButton onClick={toggleCollapse}>
            {viewMode === "collapsed" ? (
              <ChevronRight size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
          </ExpandCollapseButton>
        </TerminalActions>
      </TerminalHeader>

      {toolCallError && viewMode !== "collapsed" && (
        <ErrorBanner>
          <strong>Tool Call Error:</strong> {toolCallError}
        </ErrorBanner>
      )}

      <CommandSection>
        <CommandPrompt>
          <span>$</span>
          <CommandText>{command}</CommandText>
        </CommandPrompt>
      </CommandSection>

      <GenerationStats viewMode={viewMode}>
        <StatItem>
          <span>Output Lines:</span>
          <span>
            {outputLines}
            {isGenerating && totalOutputLines > outputLines
              ? `/${totalOutputLines}`
              : ""}
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
        {isGenerating && output.length > 0 && (
          <StatItem>
            <span>Progress:</span>
            <span>{Math.round((currentIndex / output.length) * 100)}%</span>
          </StatItem>
        )}
      </GenerationStats>

      <TerminalContent maxHeight={maxHeight} viewMode={viewMode}>
        <OutputSection viewMode={viewMode}>
          {displayedOutput ||
            (status === "pending" ? "Waiting to execute..." : "No output")}
          <LoadingIndicator
            isGenerating={isGenerating && status === "in-progress"}
          >
            |
          </LoadingIndicator>
        </OutputSection>
      </TerminalContent>

      {viewMode !== "collapsed" && !contentFitsInLimitedView && (
        <ViewModeToggle>
          <ViewModeButton onClick={toggleViewMode}>
            {viewMode === "limited" ? (
              <>
                <Maximize2 size={12} />
                Show Full Output
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
    </TerminalContainer>
  );
};

export default TerminalToolBlock;
export { TerminalToolBlock };
export type { TerminalToolBlockProps };
