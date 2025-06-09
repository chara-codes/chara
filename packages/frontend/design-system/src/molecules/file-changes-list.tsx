"use client";

import type React from "react";
import styled from "styled-components";
import { useState, useEffect } from "react";
import type { FileDiff } from '@frontend/core';
import { parsePatchStats } from '@frontend/core';

// Update the FileChangesListProps interface
interface FileChangesListProps {
  diffs: FileDiff[];
  onSelectDiff: (diffId: string) => void;
  onKeepAll?: () => void;
  onRevertAll?: () => void;
}

const Container = styled.div`
  margin-top: 8px;
  background-color: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

// First, update the Header styled component to display flex with space-between
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  font-weight: 500;
  font-size: 12px;
  color: #4b5563;
  background-color: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
`;

// Add a new styled component for the left section of the header
const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

// Add a new styled component for the buttons
const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`;

// Add a new styled component for the action buttons
const ActionButton = styled.button<{ $variant: "keep" | "revert" }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${({ $variant }) => {
    switch ($variant) {
      case "keep":
        return `
          background-color: #dcfce7;
          color: #10b981;
          border: 1px solid #a7f3d0;
          &:hover {
            background-color: #a7f3d0;
          }
        `;
      case "revert":
        return `
          background-color: #fee2e2;
          color: #ef4444;
          border: 1px solid #fecaca;
          &:hover {
            background-color: #fecaca;
          }
        `;
    }
  }}
`;

const FilesList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const FileItem = styled.div<{ $status?: "kept" | "reverted" | "pending" }>`
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  font-size: 12px;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f3f4f6;
  }

  ${({ $status }) => {
    switch ($status) {
      case "kept":
        return `
          background-color: rgba(16, 185, 129, 0.05);
        `;
      case "reverted":
        return `
          background-color: rgba(239, 68, 68, 0.05);
        `;
      default:
        return ``;
    }
  }}
`;

const FileName = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const FileStats = styled.div`
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #6b7280;
`;

const StatItem = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 4px;

  &::before {
    content: "";
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${({ $color }) => $color};
  }
`;

// Add this after the StatItem styled component
const StatusBadge = styled.span<{ $status: "kept" | "reverted" | "pending" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  margin-left: 8px;

  ${({ $status }) => {
    switch ($status) {
      case "kept":
        return `
          background-color: #dcfce7;
          color: #10b981;
          border: 1px solid #a7f3d0;
        `;
      case "reverted":
        return `
          background-color: #fee2e2;
          color: #ef4444;
          border: 1px solid #fecaca;
        `;
      default:
        return `
          background-color: #f3f4f6;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        `;
    }
  }}
`;

const StatusFilterContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
`;

const StatusFilter = styled.button<{
  $active: boolean;
  $status?: "kept" | "reverted" | "pending" | "all";
}>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;

  ${({ $active, $status }) => {
    if ($active) {
      switch ($status) {
        case "kept":
          return `
            background-color: #dcfce7;
            color: #10b981;
            border-color: #a7f3d0;
          `;
        case "reverted":
          return `
            background-color: #fee2e2;
            color: #ef4444;
            border-color: #fecaca;
          `;
        case "pending":
          return `
            background-color: #f3f4f6;
            color: #6b7280;
            border-color: #d1d5db;
          `;
        default:
          return `
            background-color: #e5e7eb;
            color: #374151;
            border-color: #d1d5db;
          `;
      }
    } else {
      return `
        background-color: transparent;
        color: #6b7280;
        border-color: #e5e7eb;
        &:hover {
          background-color: #f3f4f6;
        }
      `;
    }
  }}
`;

const FilesIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Files</title>
    <path
      d="M20 7H12L10 5H4C2.89543 5 2 5.89543 2 7V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FileIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>File</title>
    <path
      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 2V8H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Add icons for the buttons
const CheckIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Check</title>
    <path
      d="M20 6L9 17L4 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RevertIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Revert</title>
    <path
      d="M3 10H21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 14H21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 18L3 14L7 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 10L21 14L17 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Update the FileChangesList component to use status directly from FileDiff
const FileChangesList: React.FC<FileChangesListProps> = ({
  diffs,
  onSelectDiff,
  onKeepAll,
  onRevertAll,
}) => {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "kept" | "reverted" | "pending"
  >("all");
  const [filteredDiffs, setFilteredDiffs] = useState<FileDiff[]>(diffs);

  // Add this after the useState declarations
  useEffect(() => {
    // This will re-filter the diffs when statuses change
    if (statusFilter !== "all") {
      setFilteredDiffs(diffs.filter((diff) => diff.status === statusFilter));
    } else {
      setFilteredDiffs(diffs);
    }
  }, [statusFilter, diffs]);

  // Calculate stats for each diff using patch content or stored stats
  const getStats = (diff: FileDiff) => {
    // If stats are already calculated and stored, use them
    if (diff.stats) {
      return {
        additions: diff.stats.additions,
        deletions: diff.stats.deletions,
      };
    }

    // Otherwise, parse the patch content to calculate stats
    const stats = parsePatchStats(diff.patchContent || "");
    return {
      additions: stats.additions,
      deletions: stats.deletions,
    };
  };

  // Count files by status
  const statusCounts = {
    all: diffs.length,
    kept: diffs.filter((d) => d.status === "kept").length,
    reverted: diffs.filter((d) => d.status === "reverted").length,
    pending: diffs.filter((d) => d.status === "pending").length,
  };

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <FilesIcon />
          Changed Files
        </HeaderLeft>
        {statusCounts.pending > 0 && (
          <HeaderActions>
            <ActionButton $variant="keep" onClick={onKeepAll}>
              <CheckIcon /> Keep All
            </ActionButton>
            <ActionButton $variant="revert" onClick={onRevertAll}>
              <RevertIcon /> Revert All
            </ActionButton>
          </HeaderActions>
        )}
      </Header>

      <StatusFilterContainer>
        <StatusFilter
          $active={statusFilter === "all"}
          $status="all"
          onClick={() => setStatusFilter("all")}
        >
          All ({statusCounts.all})
        </StatusFilter>
        {statusCounts.kept > 0 && (
          <StatusFilter
            $active={statusFilter === "kept"}
            $status="kept"
            onClick={() => setStatusFilter("kept")}
          >
            <CheckIcon /> Kept ({statusCounts.kept})
          </StatusFilter>
        )}
        {statusCounts.pending > 0 && (
          <StatusFilter
            $active={statusFilter === "pending"}
            $status="pending"
            onClick={() => setStatusFilter("pending")}
          >
            Pending ({statusCounts.pending})
          </StatusFilter>
        )}
        {statusCounts.reverted > 0 && (
          <StatusFilter
            $active={statusFilter === "reverted"}
            $status="reverted"
            onClick={() => setStatusFilter("reverted")}
          >
            Reverted ({statusCounts.reverted})
          </StatusFilter>
        )}
      </StatusFilterContainer>

      <FilesList>
        {filteredDiffs.length > 0 ? (
          filteredDiffs.map((diff) => {
            const stats = getStats(diff);

            return (
              <FileItem
                key={diff.id}
                $status={diff.status}
                onClick={() => {
                  // First select the diff
                  onSelectDiff(diff.id);

                  // Then scroll to the diff element after a small delay to ensure it's rendered
                  setTimeout(() => {
                    const diffElement = document.querySelector(
                      `[data-diff-id="${diff.id}"]`,
                    );
                    if (diffElement) {
                      diffElement.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    } else {
                      console.log(
                        `Could not find diff element with ID: ${diff.id}`,
                      );
                    }
                  }, 100);
                }}
              >
                <FileName>
                  <FileIcon />
                  {diff.fileName}
                  <StatusBadge $status={diff.status}>
                    {diff.status === "kept"
                      ? "Kept"
                      : diff.status === "reverted"
                        ? "Reverted"
                        : "Pending"}
                  </StatusBadge>
                </FileName>
                <FileStats>
                  {stats.additions > 0 && (
                    <StatItem $color="#10b981">+{stats.additions}</StatItem>
                  )}
                  {stats.deletions > 0 && (
                    <StatItem $color="#ef4444">-{stats.deletions}</StatItem>
                  )}
                </FileStats>
              </FileItem>
            );
          })
        ) : (
          <div
            style={{
              padding: "12px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "12px",
            }}
          >
            No files match the selected filter
          </div>
        )}
      </FilesList>
    </Container>
  );
};

export default FileChangesList;
