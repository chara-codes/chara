import type { FileDiff, DiffStats } from "../types";

/**
 * Parse a unified diff patch to extract statistics
 */
export function parsePatchStats(patchContent: string): DiffStats {
  const lines = patchContent.split("\n");
  let additions = 0;
  let deletions = 0;
  let modifications = 0;

  for (const line of lines) {
    if (line.startsWith("+") && !line.startsWith("+++")) {
      additions++;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      deletions++;
    }
  }

  // Modifications are the minimum of additions and deletions
  modifications = Math.min(additions, deletions);

  return {
    additions,
    deletions,
    modifications,
    totalLines: additions + deletions,
  };
}

/**
 * Apply a patch to original content to get new content
 * This is a simplified implementation - in production you'd use a proper patch library
 */
export function applyPatch(
  originalContent: string,
  _patchContent: string,
): string {
  // For now, return the newContent if available, otherwise return original
  // In a real implementation, you'd parse the patch and apply it line by line
  return originalContent; // Placeholder implementation
}

/**
 * Create a unified diff patch from original and new content
 */
export function createPatch(
  originalContent: string,
  newContent: string,
  filePath: string,
): string {
  // This is a simplified implementation
  // In production, you'd use a proper diff library like 'diff' or similar
  const originalLines = originalContent.split("\n");
  const newLines = newContent.split("\n");

  let patch = `--- a/${filePath}\n+++ b/${filePath}\n`;

  // Simple line-by-line comparison (not optimal, but functional)
  const maxLines = Math.max(originalLines.length, newLines.length);
  let hunkStart = -1;
  let changes: string[] = [];

  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLines[i];
    const newLine = newLines[i];

    if (originalLine !== newLine) {
      if (hunkStart === -1) {
        hunkStart = i;
      }

      if (originalLine !== undefined) {
        changes.push(`-${originalLine}`);
      }
      if (newLine !== undefined) {
        changes.push(`+${newLine}`);
      }
    } else if (changes.length > 0) {
      // End of hunk
      const hunkHeader = `@@ -${hunkStart + 1},${changes.filter((c) => c.startsWith("-")).length} +${hunkStart + 1},${changes.filter((c) => c.startsWith("+")).length} @@`;
      patch += hunkHeader + "\n" + changes.join("\n") + "\n";
      changes = [];
      hunkStart = -1;
    }
  }

  // Handle remaining changes
  if (changes.length > 0) {
    const hunkHeader = `@@ -${hunkStart + 1},${changes.filter((c) => c.startsWith("-")).length} +${hunkStart + 1},${changes.filter((c) => c.startsWith("+")).length} @@`;
    patch += hunkHeader + "\n" + changes.join("\n") + "\n";
  }

  return patch;
}

/**
 * Parse patch content to extract individual hunks for display
 */
export interface PatchHunk {
  header: string;
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  changes: Array<{
    type: "context" | "addition" | "deletion";
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
  }>;
}

export function parsePatchHunks(patchContent: string): PatchHunk[] {
  const lines = patchContent.split("\n");
  const hunks: PatchHunk[] = [];
  let currentHunk: PatchHunk | null = null;

  for (const line of lines) {
    // Skip file headers
    if (line.startsWith("---") || line.startsWith("+++")) {
      continue;
    }

    // Hunk header
    if (line.startsWith("@@")) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
      if (match) {
        currentHunk = {
          header: line,
          oldStart: Number.parseInt(match[1], 10),
          oldCount: Number.parseInt(match[2] || "1", 10),
          newStart: Number.parseInt(match[3], 10),
          newCount: Number.parseInt(match[4] || "1", 10),
          changes: [],
        };
      }
      continue;
    }

    // Hunk content
    if (currentHunk) {
      if (line.startsWith("+")) {
        currentHunk.changes.push({
          type: "addition",
          content: line.substring(1),
        });
      } else if (line.startsWith("-")) {
        currentHunk.changes.push({
          type: "deletion",
          content: line.substring(1),
        });
      } else if (line.startsWith(" ")) {
        currentHunk.changes.push({
          type: "context",
          content: line.substring(1),
        });
      }
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}

/**
 * Convert a FileDiff with the new patch structure to display format
 */
export function convertDiffForDisplay(diff: FileDiff) {
  const hunks = parsePatchHunks(diff.patchContent || "");
  const stats = diff.stats || parsePatchStats(diff.patchContent || "");

  return {
    ...diff,
    hunks,
    stats,
  };
}

/**
 * Create a FileDiff from original and new content
 */
export function createFileDiff(
  id: string,
  filePath: string,
  originalContent: string,
  newContent: string,
  language?: string,
): FileDiff {
  const fileName = filePath.split("/").pop() || filePath;
  const patchContent = createPatch(originalContent, newContent, filePath);
  const stats = parsePatchStats(patchContent);

  return {
    id,
    filePath,
    fileName,
    language,
    originalContent,
    patchContent,
    newContent,
    status: "pending",
    stats,
  };
}

/**
 * Check if a diff has any actual changes
 */
export function hasDiffChanges(diff: FileDiff): boolean {
  if (diff.stats) {
    return diff.stats.additions > 0 || diff.stats.deletions > 0;
  }

  const stats = parsePatchStats(diff.patchContent || "");
  return stats.additions > 0 || stats.deletions > 0;
}

/**
 * Migration helper: Convert legacy hunk-based diff to new patch-based structure
 */
export function migrateLegacyDiff(legacyDiff: any): FileDiff {
  // If it's already in the new format, return as-is
  if (legacyDiff.patchContent && legacyDiff.originalContent) {
    return legacyDiff as FileDiff;
  }

  // Convert legacy hunks to patch format
  let patchContent = `--- a/${legacyDiff.filePath}\n+++ b/${legacyDiff.filePath}\n`;
  let originalContent = legacyDiff.originalContent || "";
  let newContent = legacyDiff.newContent || "";

  if (legacyDiff.hunks && Array.isArray(legacyDiff.hunks)) {
    for (const hunk of legacyDiff.hunks) {
      patchContent += hunk.header + "\n";

      if (hunk.changes && Array.isArray(hunk.changes)) {
        for (const change of hunk.changes) {
          if (change.type === "addition") {
            patchContent += `+${change.content}\n`;
          } else if (change.type === "deletion") {
            patchContent += `-${change.content}\n`;
          } else if (change.type === "context") {
            patchContent += ` ${change.content}\n`;
          }
        }
      }
    }
  }

  // If we don't have original/new content, try to reconstruct from hunks
  if (!originalContent && legacyDiff.hunks) {
    const lines: string[] = [];
    for (const hunk of legacyDiff.hunks) {
      for (const change of hunk.changes || []) {
        if (change.type === "context" || change.type === "deletion") {
          lines.push(change.content);
        }
      }
    }
    originalContent = lines.join("\n");
  }

  if (!newContent && legacyDiff.hunks) {
    const lines: string[] = [];
    for (const hunk of legacyDiff.hunks) {
      for (const change of hunk.changes || []) {
        if (change.type === "context" || change.type === "addition") {
          lines.push(change.content);
        }
      }
    }
    newContent = lines.join("\n");
  }

  const stats = parsePatchStats(patchContent);

  return {
    id: legacyDiff.id,
    filePath: legacyDiff.filePath,
    fileName: legacyDiff.fileName,
    language: legacyDiff.language,
    originalContent,
    patchContent,
    newContent,
    status: legacyDiff.status || "pending",
    stats,
  };
}

/**
 * Batch migration helper for converting multiple legacy diffs
 */
export function migrateLegacyDiffs(legacyDiffs: any[]): FileDiff[] {
  return legacyDiffs.map(migrateLegacyDiff);
}
