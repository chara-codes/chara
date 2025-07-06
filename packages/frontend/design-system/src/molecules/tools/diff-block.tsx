"use client";

import { ChevronDown, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import type React from "react";
import { memo, useEffect, useMemo, useState } from "react";
import { Diff, Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";
import styled from "styled-components";
import { FileIcon } from "../../atoms";

// Helper function to create unified diff text from old and new content
function createDiffFromContent(
  oldContent: string,
  newContent: string,
  filePath: string,
): string {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  // Create a proper unified diff format
  const diffLines: string[] = [`--- a/${filePath}`, `+++ b/${filePath}`];

  // Handle empty files
  if (oldLines.length === 0 && newLines.length === 0) {
    return diffLines.join("\n");
  }

  // Calculate context for the hunk header
  const oldStart = oldLines.length > 0 ? 1 : 0;
  const oldCount = oldLines.length;
  const newStart = newLines.length > 0 ? 1 : 0;
  const newCount = newLines.length;

  diffLines.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`);

  // Add context lines and changes
  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : undefined;
    const newLine = i < newLines.length ? newLines[i] : undefined;

    if (oldLine !== undefined && newLine !== undefined) {
      if (oldLine === newLine) {
        // Context line (unchanged)
        diffLines.push(` ${oldLine}`);
      } else {
        // Modified line
        diffLines.push(`-${oldLine}`);
        diffLines.push(`+${newLine}`);
      }
    } else if (oldLine !== undefined) {
      // Deleted line
      diffLines.push(`-${oldLine}`);
    } else if (newLine !== undefined) {
      // Added line
      diffLines.push(`+${newLine}`);
    }
  }

  return diffLines.join("\n");
}

interface ToolCallData {
  name?: string;
  status?: string;
  arguments?: {
    path?: string;
    mode?: string;
    content?: string;
    original_content?: string;
    old_content?: string;
    new_content?: string;
  };
  result?: {
    operation?: string;
    diff?: string;
  };
}

interface DiffBlockProps {
  toolCall: ToolCallData;
  toolCallId: string;
  isVisible?: boolean;
  streamingSpeed?: number;
  showLineNumbers?: boolean;
  maxHeight?: number;
  diffMode?: "unified" | "split";
}

type ViewMode = "collapsed" | "limited" | "full";

const DiffContainer = styled.div<{ isVisible?: boolean }>`
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

const DiffHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
`;

const DiffTitle = styled.div`
  font-weight: 500;
  font-size: 12px;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DiffActions = styled.div`
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

const DiffContent = styled.div<{ maxHeight: number; viewMode: ViewMode }>`
  max-height: ${({ maxHeight, viewMode }) =>
    viewMode === "full" ? "none" : `${maxHeight}px`};
  overflow-y: ${({ viewMode }) => (viewMode === "full" ? "visible" : "auto")};
  padding: 0;
  background-color: #ffffff;
  border-width: 0;
  display: ${({ viewMode }) => (viewMode === "collapsed" ? "none" : "block")};
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

const DiffStats = styled.div<{ viewMode: ViewMode }>`
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

const StreamingContainer = styled.div`
  position: relative;
`;

const StreamingCursor = styled.span`
  display: inline-block;
  animation: blink 1s infinite;
  color: #111827;
  font-weight: bold;

  @keyframes blink {
    0%,
    50% {
      opacity: 1;
    }
    51%,
    100% {
      opacity: 0;
    }
  }
`;

const DiffViewWrapper = styled.div`
  /* Custom CSS variables for react-diff-view theme */
  --diff-background-color: #ffffff;
  --diff-text-color: #111827;
  --diff-font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  --diff-selection-background-color: #b3d7ff;
  --diff-selection-text-color: #111827;
  --diff-gutter-insert-background-color: #ecfdf5;
  --diff-gutter-insert-text-color: #111827;
  --diff-gutter-delete-background-color: #fef2f2;
  --diff-gutter-delete-text-color: #111827;
  --diff-gutter-selected-background-color: #fffce0;
  --diff-gutter-selected-text-color: #111827;
  --diff-code-insert-background-color: #f0fff4;
  --diff-code-insert-text-color: #111827;
  --diff-code-delete-background-color: #fef2f2;
  --diff-code-delete-text-color: #111827;
  --diff-code-insert-edit-background-color: #dcfce7;
  --diff-code-insert-edit-text-color: #111827;
  --diff-code-delete-edit-background-color: #fee2e2;
  --diff-code-delete-edit-text-color: #111827;
  --diff-code-selected-background-color: #fffce0;
  --diff-code-selected-text-color: #111827;
  --diff-omit-gutter-line-color: #6b7280;

  /* Additional customizations */
  .diff {
    font-size: 12px;
    line-height: 1.5;
    border: none;
    border-radius: 0;
  }

  .diff-gutter {
    padding: 0 8px;
    min-width: 40px;
    text-align: right;
    font-size: 12px;
    color: #6b7280;
    user-select: none;
  }

  .diff-code {
    padding: 0 8px;
    white-space: pre;
  }

  .diff-code-insert {
    border-left: 3px solid #10b981;
  }

  .diff-code-delete {
    border-left: 3px solid #ef4444;
  }

  .diff-line {
    border: none !important;
    border-top: none !important;
    border-bottom: none !important;
    &:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }
  }

  /* Remove borders from all diff-related elements */
  .diff-gutter,
  .diff-code {
    border: none !important;
    border-top: none !important;
    border-bottom: none !important;
  }

  /* Remove table borders if present */
  .diff table,
  .diff tbody,
  .diff tr,
  .diff td {
    border: none !important;
    border-collapse: collapse;
  }
`;

// Helper function to parse diff string and extract old/new content
function parseDiffContent(diffString: string): {
  oldContent: string;
  newContent: string;
} {
  if (!diffString || diffString === "No changes") {
    return { oldContent: "", newContent: "" };
  }

  const lines = diffString.split("\n");
  const oldLines: string[] = [];
  const newLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("- ")) {
      oldLines.push(line.slice(2));
    } else if (line.startsWith("+ ")) {
      newLines.push(line.slice(2));
    }
  }

  return {
    oldContent: oldLines.join("\n"),
    newContent: newLines.join("\n"),
  };
}

// Helper function to count diff stats
function calculateDiffStats(
  oldContent: string,
  newContent: string,
): {
  addedLines: number;
  removedLines: number;
} {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  // Simple line counting - this could be improved with actual diff calculation
  const maxLines = Math.max(oldLines.length, newLines.length);
  let addedLines = 0;
  let removedLines = 0;

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine && !newLine) {
      removedLines++;
    } else if (!oldLine && newLine) {
      addedLines++;
    } else if (oldLine && newLine && oldLine !== newLine) {
      removedLines++;
      addedLines++;
    }
  }

  return { addedLines, removedLines };
}

const DiffBlock: React.FC<DiffBlockProps> = memo(
  ({
    toolCall,
    toolCallId,
    isVisible = true,
    streamingSpeed = 20,
    showLineNumbers = false,
    maxHeight = 300,
    diffMode = "split",
  }) => {
    // Extract data from toolCall
    const args = toolCall.arguments;
    const result = toolCall.result;

    const filePath = args?.path || "unknown";
    const mode = args?.mode || "unknown";
    const operation = result?.operation || mode;
    const isGenerating = !args?.path || toolCall.status === "generating";

    let oldContent = "";
    let newContent = "";

    if (operation === "edited" && result?.diff) {
      // Parse the diff to reconstruct old and new content
      const { oldContent: parsedOld, newContent: parsedNew } = parseDiffContent(
        result.diff,
      );
      oldContent = parsedOld;
      newContent = parsedNew;
    } else if (operation === "created") {
      // For create mode, old content is empty
      oldContent = "";
      newContent = args?.content || "";
    } else if (operation === "overwritten") {
      // For overwrite mode, show the new content
      oldContent = "";
      newContent = args?.content || "";
    } else {
      // Fallback: try to extract content from arguments
      oldContent = args?.original_content || args?.old_content || "";
      newContent = args?.content || args?.new_content || "";
    }

    // Validate extracted data
    if (!filePath || typeof filePath !== "string") {
      console.warn("DiffBlock: filePath is required and must be a string");
      return null;
    }

    if (typeof newContent !== "string") {
      console.warn("DiffBlock: newContent must be a string");
      return null;
    }

    const [displayedNewContent, setDisplayedNewContent] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewMode, setViewMode] = useState<ViewMode>("collapsed");

    // Streaming animation effect
    useEffect(() => {
      if (isGenerating && currentIndex < newContent.length) {
        const timer = setTimeout(
          () => {
            setDisplayedNewContent(newContent.slice(0, currentIndex + 1));
            setCurrentIndex(currentIndex + 1);
          },
          Math.max(1, streamingSpeed),
        );

        return () => clearTimeout(timer);
      }

      if (!isGenerating) {
        setDisplayedNewContent(newContent);
        setCurrentIndex(newContent.length);
      }
    }, [newContent, currentIndex, isGenerating, streamingSpeed]);

    // Reset when content changes completely
    useEffect(() => {
      if (!isGenerating) {
        setDisplayedNewContent(newContent);
        setCurrentIndex(newContent.length);
      } else {
        if (currentIndex > newContent.length) {
          setCurrentIndex(0);
          setDisplayedNewContent("");
        }
      }
    }, [newContent, currentIndex, isGenerating]);

    const status = isGenerating ? "generating" : "complete";

    // Get file extension for display
    const getFileExtension = (path: string): string => {
      const parts = path.split(".");
      return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
    };

    const fileExtension = getFileExtension(filePath);
    const fileName = filePath.split("/").pop() || filePath;

    // Calculate stats
    const contentToUse = isGenerating ? displayedNewContent : newContent;
    const { addedLines, removedLines } = useMemo(
      () => calculateDiffStats(oldContent, contentToUse),
      [oldContent, contentToUse],
    );

    // Calculate if content fits within limited height
    const estimatedLines = Math.max(
      oldContent.split("\n").length,
      contentToUse.split("\n").length,
    );
    const estimatedContentHeight = estimatedLines * 18 + 32;
    const contentFitsInLimitedView = estimatedContentHeight <= maxHeight;

    const toggleCollapse = () => {
      setViewMode(viewMode === "collapsed" ? "limited" : "collapsed");
    };

    const toggleViewMode = () => {
      setViewMode(viewMode === "limited" ? "full" : "limited");
    };

    // Parse diff content for react-diff-view
    let diffFiles: any[] = [];

    if (result?.diff) {
      // Parse existing diff text
      try {
        diffFiles = parseDiff(result.diff);
      } catch (error) {
        console.warn("Failed to parse diff:", error);
        // Fallback to creating diff from content
        const diffText = createDiffFromContent(
          oldContent,
          contentToUse,
          filePath,
        );
        try {
          diffFiles = parseDiff(diffText);
        } catch (fallbackError) {
          console.error("Failed to create fallback diff:", fallbackError);
          return null;
        }
      }
    } else {
      // Create diff from old and new content
      const diffText = createDiffFromContent(
        oldContent,
        contentToUse,
        filePath,
      );
      try {
        diffFiles = parseDiff(diffText);
      } catch (error) {
        console.error("Failed to create diff from content:", error);
        return null;
      }
    }

    const diffFile = diffFiles[0];
    if (!diffFile || !diffFile.hunks || diffFile.hunks.length === 0) {
      // If no diff file or hunks, create a minimal representation
      if (contentToUse === oldContent) {
        return null; // No changes to display
      }

      // Create a synthetic diff for display
      const syntheticDiff = {
        type: operation === "created" ? "add" : ("modify" as any),
        hunks: [
          {
            oldStart: 1,
            oldLines: oldContent.split("\n").length,
            newStart: 1,
            newLines: contentToUse.split("\n").length,
            content: `@@ -1,${oldContent.split("\n").length} +1,${contentToUse.split("\n").length} @@`,
            changes: [
              ...oldContent.split("\n").map((line, index) => ({
                type: "delete" as const,
                oldLineNumber: index + 1,
                newLineNumber: undefined,
                content: `-${line}`,
                isNormal: false,
                isInsert: false,
                isDelete: true,
              })),
              ...contentToUse.split("\n").map((line, index) => ({
                type: "insert" as const,
                oldLineNumber: undefined,
                newLineNumber: index + 1,
                content: `+${line}`,
                isNormal: false,
                isInsert: true,
                isDelete: false,
              })),
            ] as any[],
          },
        ] as any[],
      };
      return (
        <DiffContainer isVisible={isVisible}>
          <DiffHeader>
            <DiffTitle>
              <FileIcon width={12} height={12} />
              {fileName !== "unknown" ? fileName : ""}
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
            </DiffTitle>
            <DiffActions>
              <ExpandCollapseButton onClick={toggleCollapse}>
                {viewMode === "collapsed" ? (
                  <ChevronRight size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
              </ExpandCollapseButton>
            </DiffActions>
          </DiffHeader>

          <DiffStats viewMode={viewMode}>
            <StatItem>
              <span style={{ color: "#10b981" }}>+{addedLines}</span>
              <span style={{ color: "#ef4444" }}>-{removedLines}</span>
            </StatItem>
            <StatItem>
              <span>Lines changed:</span>
              <span>{addedLines + removedLines}</span>
            </StatItem>
            {isGenerating && newContent.length > 0 && (
              <StatItem>
                <span>Progress:</span>
                <span>
                  {Math.round((currentIndex / newContent.length) * 100)}%
                </span>
              </StatItem>
            )}
          </DiffStats>

          <DiffContent maxHeight={maxHeight} viewMode={viewMode}>
            <StreamingContainer>
              <DiffViewWrapper>
                <Diff
                  viewType={"unified"}
                  diffType={syntheticDiff.type}
                  hunks={syntheticDiff.hunks}
                  gutterType={showLineNumbers ? "default" : "none"}
                >
                  {(hunks) =>
                    hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
                  }
                </Diff>
              </DiffViewWrapper>
              {isGenerating && <StreamingCursor>|</StreamingCursor>}
            </StreamingContainer>
          </DiffContent>

          {viewMode !== "collapsed" && !contentFitsInLimitedView && (
            <ViewModeToggle>
              <ViewModeButton onClick={toggleViewMode}>
                {viewMode === "limited" ? (
                  <>
                    <Maximize2 size={12} />
                    Show Full Diff
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
        </DiffContainer>
      );
    }

    return (
      <DiffContainer isVisible={isVisible}>
        <DiffHeader>
          <DiffTitle>
            <FileIcon width={12} height={12} />
            {fileName !== "unknown" ? fileName : ""}
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
          </DiffTitle>
          <DiffActions>
            <ExpandCollapseButton onClick={toggleCollapse}>
              {viewMode === "collapsed" ? (
                <ChevronRight size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
            </ExpandCollapseButton>
          </DiffActions>
        </DiffHeader>

        <DiffStats viewMode={viewMode}>
          <StatItem>
            <span style={{ color: "#10b981" }}>+{addedLines}</span>
            <span style={{ color: "#ef4444" }}>-{removedLines}</span>
          </StatItem>
          <StatItem>
            <span>Lines changed:</span>
            <span>{addedLines + removedLines}</span>
          </StatItem>
          {isGenerating && newContent.length > 0 && (
            <StatItem>
              <span>Progress:</span>
              <span>
                {Math.round((currentIndex / newContent.length) * 100)}%
              </span>
            </StatItem>
          )}
        </DiffStats>

        <DiffContent maxHeight={maxHeight} viewMode={viewMode}>
          <StreamingContainer>
            <DiffViewWrapper>
              <Diff
                viewType={"unified"}
                diffType={diffFile.type}
                hunks={diffFile.hunks}
                gutterType={showLineNumbers ? "default" : "none"}
              >
                {(hunks) =>
                  hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
                }
              </Diff>
            </DiffViewWrapper>
            {isGenerating && <StreamingCursor>|</StreamingCursor>}
          </StreamingContainer>
        </DiffContent>

        {viewMode !== "collapsed" && !contentFitsInLimitedView && (
          <ViewModeToggle>
            <ViewModeButton onClick={toggleViewMode}>
              {viewMode === "limited" ? (
                <>
                  <Maximize2 size={12} />
                  Show Full Diff
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
      </DiffContainer>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.toolCall === nextProps.toolCall &&
      prevProps.toolCallId === nextProps.toolCallId &&
      prevProps.isVisible === nextProps.isVisible &&
      prevProps.streamingSpeed === nextProps.streamingSpeed &&
      prevProps.showLineNumbers === nextProps.showLineNumbers &&
      prevProps.maxHeight === nextProps.maxHeight &&
      prevProps.diffMode === nextProps.diffMode
    );
  },
);

DiffBlock.displayName = "DiffBlock";

export default DiffBlock;
export { DiffBlock };
