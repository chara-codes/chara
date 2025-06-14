"use client";

import type React from "react";
import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { ChevronDown, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { FileIcon } from "../../atoms/icons";

interface EditOperation {
  oldText: string;
  newText: string;
  status?: "pending" | "applying" | "complete" | "error";
  error?: string;
}

interface EditFileBlockProps {
  filePath: string;
  edits: EditOperation[];
  isGenerating?: boolean;
  isVisible?: boolean;
  showLineNumbers?: boolean;
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

const EditFileContainer = styled.div<{ isVisible?: boolean }>`
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

const EditFileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
`;

const EditFileTitle = styled.div`
  font-weight: 500;
  font-size: 12px;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const EditFileActions = styled.div`
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

const EditFileContent = styled.div<{ maxHeight: number; viewMode: ViewMode }>`
  max-height: ${({ maxHeight, viewMode }) =>
    viewMode === "full" ? "none" : `${maxHeight}px`};
  overflow-y: ${({ viewMode }) => (viewMode === "full" ? "visible" : "auto")};
  padding: 0;
  background-color: #f9fafb;
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

const EditBlock = styled.div<{
  status?: "pending" | "applying" | "complete" | "error";
}>`
  margin: 0;
  padding: 0;
  border: 0px solid
    ${({ status }) => {
      switch (status) {
        case "complete":
          return "#10b981";
        case "error":
          return "#ef4444";
        case "applying":
          return "#2563eb";
        default:
          return "#e5e7eb";
      }
    }};
  border-radius: 0px;
  overflow: hidden;
  background-color: #ffffff;
`;

const EditHeader = styled.div<{
  status?: "pending" | "applying" | "complete" | "error";
}>`
  padding: 8px 12px;
  background-color: ${({ status }) => {
    switch (status) {
      case "complete":
        return "#d1fae5";
      case "error":
        return "#fee2e2";
      case "applying":
        return "#dbeafe";
      default:
        return "#f9fafb";
    }
  }};
  border-bottom: 1px solid #e5e7eb;
  font-size: 11px;
  font-weight: 500;
  color: ${({ status }) => {
    switch (status) {
      case "complete":
        return "#10b981";
      case "error":
        return "#ef4444";
      case "applying":
        return "#2563eb";
      default:
        return "#6b7280";
    }
  }};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EditContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const EditSection = styled.div<{ type: "old" | "new" }>`
  padding: 8px 12px;
  background-color: ${({ type }) => (type === "old" ? "#fef2f2" : "#f0fdf4")};
  border-left: 3px solid
    ${({ type }) => (type === "old" ? "#ef4444" : "#10b981")};
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-x: auto;
  position: relative;
`;

const EditLabel = styled.div<{ type: "old" | "new" }>`
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 600;
  color: ${({ type }) => (type === "old" ? "#ef4444" : "#10b981")};
  margin-bottom: 4px;
  letter-spacing: 0.5px;
`;

const EditsList = styled.div`
  padding: 0;
`;

const ErrorBanner = styled.div`
  padding: 8px 12px;
  background-color: #fee2e2;
  color: #ef4444;
  font-size: 11px;
  border-bottom: 1px solid #e5e7eb;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  white-space: pre-wrap;
`;

const LoadingIndicator = styled.span<{ isGenerating: boolean }>`
  display: ${({ isGenerating }) => (isGenerating ? "inline" : "none")};
  animation: ${blink} 1s infinite;
  color: #4b5563;
  font-weight: bold;
  margin-left: 4px;
`;

const EditFileBlock: React.FC<EditFileBlockProps> = ({
  filePath,
  edits = [],
  isGenerating = false,
  isVisible = true,
  maxHeight = 500,
  toolCallError,
}) => {
  // Validate props
  if (!filePath || typeof filePath !== "string") {
    console.warn(
      "EditFileBlock: filePath prop is required and must be a string",
    );
    return null;
  }

  if (!Array.isArray(edits)) {
    console.warn("EditFileBlock: edits prop must be an array");
    return null;
  }

  const [viewMode, setViewMode] = useState<ViewMode>("limited");

  const completedEdits = edits.filter(
    (edit) => edit.status === "complete",
  ).length;
  const totalEdits = edits.length;

  const status = toolCallError
    ? "error"
    : isGenerating
      ? "generating"
      : "complete";

  // Get file extension for display
  const getFileExtension = (path: string): string => {
    const parts = path.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  };

  const fileExtension = getFileExtension(filePath);
  const fileName = filePath.split("/").pop() || filePath;

  // Calculate if content fits within limited height
  const estimatedContentHeight = edits.length * 120 + 16; // Estimate height for edit blocks
  const contentFitsInLimitedView = estimatedContentHeight <= maxHeight;

  const toggleCollapse = () => {
    setViewMode(viewMode === "collapsed" ? "limited" : "collapsed");
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "limited" ? "full" : "limited");
  };

  return (
    <EditFileContainer isVisible={isVisible}>
      <EditFileHeader>
        <EditFileTitle>
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
            {toolCallError ? "Error" : isGenerating ? "Editing..." : "Complete"}
          </StatusBadge>
        </EditFileTitle>
        <EditFileActions>
          <ExpandCollapseButton onClick={toggleCollapse}>
            {viewMode === "collapsed" ? (
              <ChevronRight size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
          </ExpandCollapseButton>
        </EditFileActions>
      </EditFileHeader>

      {toolCallError && viewMode !== "collapsed" && (
        <ErrorBanner>
          <strong>Tool Call Error:</strong> {toolCallError}
        </ErrorBanner>
      )}

      <GenerationStats viewMode={viewMode}>
        <StatItem>
          <span>Edits Applied:</span>
          <span>
            {completedEdits}
            {isGenerating && totalEdits > completedEdits
              ? `/${totalEdits}`
              : totalEdits > 0
                ? `/${totalEdits}`
                : ""}
          </span>
        </StatItem>
        <StatItem>
          <span>Total Edits:</span>
          <span>{totalEdits}</span>
        </StatItem>
        {isGenerating && totalEdits > 0 && (
          <StatItem>
            <span>Progress:</span>
            <span>{Math.round((completedEdits / totalEdits) * 100)}%</span>
          </StatItem>
        )}
      </GenerationStats>

      <EditFileContent maxHeight={maxHeight} viewMode={viewMode}>
        <EditsList>
          {edits.map((edit, index) => (
            <EditBlock
              key={`edit-${edit.oldText.slice(0, 50)}-${index}`}
              status={edit.status}
            >
              <EditContent>
                <EditSection type="old">
                  <EditLabel type="old">Remove</EditLabel>
                  {edit.oldText}
                </EditSection>
                <EditSection type="new">
                  <EditLabel type="new">Add</EditLabel>
                  {edit.newText}
                </EditSection>
                {edit.error && (
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#fee2e2",
                      color: "#ef4444",
                      fontSize: "11px",
                      borderTop: "1px solid #e5e7eb",
                      fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
                    }}
                  >
                    <strong>Error:</strong> {edit.error}
                  </div>
                )}
              </EditContent>
            </EditBlock>
          ))}
          {edits.length === 0 && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "12px",
              }}
            >
              {isGenerating ? "Loading edits..." : "No edits to display"}
            </div>
          )}
        </EditsList>
      </EditFileContent>

      {viewMode !== "collapsed" && !contentFitsInLimitedView && (
        <ViewModeToggle>
          <ViewModeButton onClick={toggleViewMode}>
            {viewMode === "limited" ? (
              <>
                <Maximize2 size={12} />
                Show All Edits
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
    </EditFileContainer>
  );
};

export default EditFileBlock;
export { EditFileBlock };
export type { EditOperation, EditFileBlockProps };
