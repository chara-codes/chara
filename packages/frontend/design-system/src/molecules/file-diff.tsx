"use client";

import React from "react";
import { useState, useEffect } from "react";
import styled from "styled-components";
import type { FileDiff as FileDiffType } from "@apk/core";
import { CloseIcon } from "../atoms/icons/close-icon";
import { ArrowLeftIcon } from "../atoms/icons/arrow-left-icon";
import { UndoIcon, FileIcon } from "../atoms";
import CheckIcon from "../atoms/icons/check-icon";

interface FileDiffProps {
  diff: FileDiffType;
  isVisible?: boolean;
  onClose?: () => void;
  onKeep?: (diffId: string) => void;
  onRevert?: (diffId: string) => void;
}

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
`;

const StyledDiffButton = styled.button`
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

const DiffContent = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const DiffTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
`;

const LineNumber = styled.td`
  text-align: right;
  padding: 0 8px;
  color: #9ca3af;
  user-select: none;
  width: 40px;
  border-right: 1px solid #e5e7eb;
  background-color: #f9fafb;
`;

const LineContent = styled.td<{ $type: "addition" | "deletion" | "context" }>`
  padding: 0 8px;
  white-space: pre;
  overflow-x: auto;

  ${({ $type }) => {
    switch ($type) {
      case "addition":
        return "background-color: #d1fae5; &::before { content: '+'; color: #10b981; margin-right: 4px; }";
      case "deletion":
        return "background-color: #fee2e2; &::before { content: '-'; color: #ef4444; margin-right: 4px; }";
      default:
        return "";
    }
  }}
`;

const DiffRow = styled.tr<{ $type: "addition" | "deletion" | "context" }>`
  &:hover {
    ${({ $type }) => {
      switch ($type) {
        case "addition":
          return "background-color: #a7f3d0;";
        case "deletion":
          return "background-color: #fecaca;";
        default:
          return "background-color: #f3f4f6;";
      }
    }}
  }
`;

const HunkHeader = styled.tr`
  background-color: #e5e7eb;

  td {
    padding: 2px 8px;
    color: #6b7280;
    font-style: italic;
    border-top: 1px solid #d1d5db;
    border-bottom: 1px solid #d1d5db;
  }
`;

const EmptyCell = styled.td`
  width: 40px;
  background-color: #f9fafb;
  border-right: 1px solid #e5e7eb;
`;

const DiffStats = styled.div`
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
  font-size: 11px;
`;

const StatItem = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 4px;

  &::before {
    content: "";
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${({ $color }) => $color};
  }
`;

const StatusBadge = styled.div<{ $status: "kept" | "reverted" }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  margin-left: 8px;

  background-color: ${({ $status }) =>
    $status === "kept" ? "#d1fae5" : "#fee2e2"};
  color: ${({ $status }) => ($status === "kept" ? "#10b981" : "#ef4444")};
`;

const FullFileContainer = styled.div`
  padding: 12px;
  max-height: 500px;
  overflow-y: auto;
  background-color: #f9fafb;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
`;

const FullFileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
`;

const FullFileTitle = styled.div`
  font-weight: 500;
  font-size: 12px;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const FullFileContent = styled.pre`
  margin: 0;
  padding: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ViewModeToggle = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const ViewModeButton = styled.button<{ $active: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  background-color: ${({ $active }) => ($active ? "#e5e7eb" : "transparent")};
  border: 1px solid ${({ $active }) => ($active ? "#d1d5db" : "#e5e7eb")};
  color: ${({ $active }) => ($active ? "#374151" : "#6b7280")};
  cursor: pointer;

  &:hover {
    background-color: ${({ $active }) => ($active ? "#e5e7eb" : "#f3f4f6")};
  }
`;

const LineNumbers = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-right: 8px;
  color: #9ca3af;
  user-select: none;
  border-right: 1px solid #e5e7eb;
  margin-right: 8px;
`;

const CodeWithLineNumbers = styled.div`
  display: flex;
`;

const BackToDiffButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  background-color: transparent;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  cursor: pointer;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const FileDiff: React.FC<FileDiffProps> = ({
  diff,
  isVisible = true,
  onClose = () => {},
  onKeep,
  onRevert,
}) => {
  const [status, setStatus] = useState(diff.status);
  const [expandedHunks, setExpandedHunks] = useState<Set<string>>(
    new Set(diff.hunks?.map((h) => h.id) || []),
  );
  const [viewMode, setViewMode] = useState<"diff" | "original" | "new">("diff");

  const toggleHunk = (hunkId: string) => {
    setExpandedHunks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(hunkId)) {
        newSet.delete(hunkId);
      } else {
        newSet.add(hunkId);
      }
      return newSet;
    });
  };

  // Calculate stats
  const additions =
    diff.hunks?.reduce(
      (count, hunk) =>
        count +
        hunk.changes.filter((change) => change.type === "addition").length,
      0,
    ) || 0;

  const deletions =
    diff.hunks?.reduce(
      (count, hunk) =>
        count +
        hunk.changes.filter((change) => change.type === "deletion").length,
      0,
    ) || 0;

  // Add effect to log when diff status changes
  useEffect(() => {
    console.log(`Diff status changed to: ${diff.status}`);
    // This will trigger a re-render when the status changes
    setStatus(diff.status);
  }, [diff.status]);

  return (
    <DiffContainer
      isVisible={isVisible}
      data-diff-id={diff.id}
      data-status={diff.status}
    >
      <DiffHeader>
        <DiffTitle>
          <FileIcon width={12} height={12} />
          {diff.filePath}
          {status !== "pending" && (
            <StatusBadge $status={status === "kept" ? "kept" : "reverted"}>
              {status === "kept" ? (
                <>
                  <CheckIcon width={12} height={12} />
                  Kept
                </>
              ) : (
                <>
                  <UndoIcon size={12} />
                  Reverted
                </>
              )}
            </StatusBadge>
          )}
        </DiffTitle>
        <DiffActions>
          {viewMode === "diff" ? (
            <>
              <StyledDiffButton
                onClick={() => {
                  // Check if we have content to display
                  if (diff.originalContent || diff.newContent) {
                    // Default to showing the new content if available, otherwise show original
                    setViewMode(diff.newContent ? "new" : "original");
                  } else {
                    console.log("No file content available to display");
                    alert("Full file content is not available for this file.");
                  }
                }}
              >
                View Full File
              </StyledDiffButton>
              <StyledDiffButton onClick={onClose}>
                <CloseIcon size={12} />
              </StyledDiffButton>
            </>
          ) : (
            <>
              <BackToDiffButton onClick={() => setViewMode("diff")}>
                <ArrowLeftIcon width={12} height={12} />
                Back to Diff
              </BackToDiffButton>
              <StyledDiffButton onClick={onClose}>
                <CloseIcon size={12} />
              </StyledDiffButton>
            </>
          )}
        </DiffActions>
      </DiffHeader>

      {viewMode === "diff" ? (
        <>
          <DiffStats>
            <StatItem $color="#10b981">{additions} additions</StatItem>
            <StatItem $color="#ef4444">{deletions} deletions</StatItem>
          </DiffStats>

          <DiffContent>
            <DiffTable>
              <tbody>
                {diff.hunks?.map((hunk) => (
                  <React.Fragment key={hunk.id}>
                    <HunkHeader
                      onClick={() => toggleHunk(hunk.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td colSpan={3}>
                        {expandedHunks.has(hunk.id) ? "▼" : "►"} {hunk.header}
                      </td>
                    </HunkHeader>

                    {expandedHunks.has(hunk.id) &&
                      hunk.changes.map((change, index) => (
                        <DiffRow
                          key={`${hunk.id}-${index}`}
                          $type={
                            change.type as "addition" | "deletion" | "context"
                          }
                        >
                          {change.type === "deletion" ? (
                            <>
                              <LineNumber>{change.oldLineNumber}</LineNumber>
                              <EmptyCell />
                              <LineContent
                                $type={
                                  change.type as
                                    | "addition"
                                    | "deletion"
                                    | "context"
                                }
                              >
                                {change.content}
                              </LineContent>
                            </>
                          ) : change.type === "addition" ? (
                            <>
                              <EmptyCell />
                              <LineNumber>{change.newLineNumber}</LineNumber>
                              <LineContent
                                $type={
                                  change.type as
                                    | "addition"
                                    | "deletion"
                                    | "context"
                                }
                              >
                                {change.content}
                              </LineContent>
                            </>
                          ) : (
                            <>
                              <LineNumber>{change.oldLineNumber}</LineNumber>
                              <LineNumber>{change.newLineNumber}</LineNumber>
                              <LineContent
                                $type={
                                  change.type as
                                    | "addition"
                                    | "deletion"
                                    | "context"
                                }
                              >
                                {change.content}
                              </LineContent>
                            </>
                          )}
                        </DiffRow>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </DiffTable>
          </DiffContent>

          {status === "pending" && (
            <DiffActions style={{ padding: "12px" }}>
              <StyledDiffButton
                onClick={() => {
                  console.log("Keep button clicked for diff:", diff.id);
                  if (onKeep) {
                    onKeep(diff.id);
                    setStatus("kept");
                    console.log("onKeep callback executed");
                  } else {
                    console.error("onKeep callback is not defined");
                  }
                }}
              >
                <CheckIcon width={12} height={12} />
                Keep Changes
              </StyledDiffButton>
              <StyledDiffButton
                onClick={() => {
                  console.log("Revert button clicked for diff:", diff.id);
                  if (onRevert) {
                    onRevert(diff.id);
                    setStatus("reverted");
                    console.log("onRevert callback executed");
                  } else {
                    console.error("onRevert callback is not defined");
                  }
                }}
              >
                <UndoIcon size={12} />
                Revert Changes
              </StyledDiffButton>
            </DiffActions>
          )}
        </>
      ) : (
        <FullFileContainer>
          <FullFileHeader>
            <FullFileTitle>
              <FileIcon width={12} height={12} />
              {diff.fileName} - {viewMode === "original" ? "Original" : "New"}{" "}
              Version
            </FullFileTitle>
          </FullFileHeader>

          <ViewModeToggle>
            {diff.originalContent && (
              <ViewModeButton
                $active={viewMode === "original"}
                onClick={() => setViewMode("original")}
              >
                Original
              </ViewModeButton>
            )}
            {diff.newContent && (
              <ViewModeButton
                $active={viewMode === "new"}
                onClick={() => setViewMode("new")}
              >
                New
              </ViewModeButton>
            )}
          </ViewModeToggle>

          <CodeWithLineNumbers>
            <LineNumbers>
              {(viewMode === "original"
                ? diff.originalContent
                : diff.newContent
              )
                ?.split("\n")
                .map((_, i) => (
                  <div
                    key={`line-${
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      i
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
            </LineNumbers>
            <FullFileContent>
              {viewMode === "original" ? diff.originalContent : diff.newContent}
            </FullFileContent>
          </CodeWithLineNumbers>
        </FullFileContainer>
      )}
    </DiffContainer>
  );
};

export default FileDiff;
