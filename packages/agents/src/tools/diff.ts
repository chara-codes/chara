import { tool } from "ai";
import z from "zod";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import git from "isomorphic-git";
import fs from "node:fs";

interface DiffLine {
  type: "added" | "removed" | "unchanged" | "context";
  content: string;
  lineNumber?: {
    old?: number;
    new?: number;
  };
}

const DiffEngine = {
  /**
   * Generate unified diff between two strings
   */
  generateUnifiedDiff(
    oldContent: string,
    newContent: string,
    oldFile = "a/file",
    newFile = "b/file",
    context = 3,
  ): string {
    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");

    const diffLines = DiffEngine.computeDiff(oldLines, newLines);
    return DiffEngine.formatUnifiedDiff(diffLines, oldFile, newFile, context);
  },

  /**
   * Compute line-by-line diff using a simple LCS-based algorithm
   */
  computeDiff(oldLines: string[], newLines: string[]): DiffLine[] {
    const result: DiffLine[] = [];

    // Simple diff algorithm - for production, consider using a more sophisticated algorithm
    let i = 0;
    let j = 0;

    while (i < oldLines.length || j < newLines.length) {
      if (i >= oldLines.length) {
        // Remaining lines are all additions
        result.push({
          type: "added",
          content: newLines[j] || "",
          lineNumber: { new: j + 1 },
        });
        j++;
      } else if (j >= newLines.length) {
        // Remaining lines are all deletions
        result.push({
          type: "removed",
          content: oldLines[i] || "",
          lineNumber: { old: i + 1 },
        });
        i++;
      } else if (oldLines[i] === newLines[j]) {
        // Lines are the same
        result.push({
          type: "unchanged",
          content: oldLines[i] || "",
          lineNumber: { old: i + 1, new: j + 1 },
        });
        i++;
        j++;
      } else {
        // Lines are different - simple strategy: mark as removed/added
        result.push({
          type: "removed",
          content: oldLines[i] || "",
          lineNumber: { old: i + 1 },
        });
        result.push({
          type: "added",
          content: newLines[j] || "",
          lineNumber: { new: j + 1 },
        });
        i++;
        j++;
      }
    }

    return result;
  },

  /**
   * Format diff lines as unified diff format
   */
  formatUnifiedDiff(
    diffLines: DiffLine[],
    oldFile: string,
    newFile: string,
    context: number,
  ): string {
    let result = `--- ${oldFile}\n+++ ${newFile}\n`;

    if (diffLines.length === 0) {
      return result;
    }

    // Group changes into hunks
    const hunks = DiffEngine.groupIntoHunks(diffLines, context);

    for (const hunk of hunks) {
      const header = DiffEngine.generateHunkHeader(hunk);
      result += `${header}\n`;

      for (const line of hunk) {
        let prefix = " ";
        if (line.type === "added") prefix = "+";
        else if (line.type === "removed") prefix = "-";

        result += `${prefix}${line.content}\n`;
      }
    }

    return result;
  },

  /**
   * Group diff lines into hunks with context
   */
  groupIntoHunks(diffLines: DiffLine[], context: number): DiffLine[][] {
    const hunks: DiffLine[][] = [];
    let currentHunk: DiffLine[] = [];
    let unchangedBuffer: DiffLine[] = [];

    for (const line of diffLines) {
      if (line.type === "unchanged") {
        unchangedBuffer.push(line);

        if (unchangedBuffer.length > context * 2) {
          // Add context before, finish current hunk, start new one
          if (currentHunk.length > 0) {
            currentHunk.push(...unchangedBuffer.slice(0, context));
            hunks.push(currentHunk);
            currentHunk = [];
          }
          unchangedBuffer = unchangedBuffer.slice(-context);
        }
      } else {
        // Changed line
        if (currentHunk.length === 0) {
          // Start new hunk with context
          const contextStart = Math.max(0, unchangedBuffer.length - context);
          currentHunk.push(...unchangedBuffer.slice(contextStart));
        } else {
          // Add all buffered unchanged lines
          currentHunk.push(...unchangedBuffer);
        }

        currentHunk.push(line);
        unchangedBuffer = [];
      }
    }

    // Finish last hunk
    if (currentHunk.length > 0) {
      const contextEnd = Math.min(context, unchangedBuffer.length);
      currentHunk.push(...unchangedBuffer.slice(0, contextEnd));
      hunks.push(currentHunk);
    }

    return hunks;
  },

  /**
   * Generate hunk header (@@...@@)
   */
  generateHunkHeader(hunk: DiffLine[]): string {
    let oldStart = 0;
    let oldCount = 0;
    let newStart = 0;
    let newCount = 0;

    for (const line of hunk) {
      if (
        line.lineNumber?.old &&
        (oldStart === 0 || line.lineNumber.old < oldStart)
      ) {
        oldStart = line.lineNumber.old;
      }
      if (
        line.lineNumber?.new &&
        (newStart === 0 || line.lineNumber.new < newStart)
      ) {
        newStart = line.lineNumber.new;
      }

      if (line.type === "removed" || line.type === "unchanged") {
        oldCount++;
      }
      if (line.type === "added" || line.type === "unchanged") {
        newCount++;
      }
    }

    return `@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`;
  },
};

export const diff = tool({
  description:
    "Generate diff output showing changes between files, git commits, or current working directory state. Supports unified diff format with context lines.",
  parameters: z.object({
    mode: z
      .enum(["files", "git-status", "git-commit"])
      .describe(
        "Diff mode: 'files' for comparing two files, 'git-status' for working directory changes, 'git-commit' for comparing with specific commit",
      ),

    // For file comparison mode
    oldFile: z
      .string()
      .optional()
      .describe("Path to old/original file (required for 'files' mode)"),
    newFile: z
      .string()
      .optional()
      .describe("Path to new/modified file (required for 'files' mode)"),

    // For git modes
    workingDir: z
      .string()
      .optional()
      .describe(
        "Working directory (defaults to current directory for git modes)",
      ),
    commitHash: z
      .string()
      .optional()
      .describe("Git commit hash to compare against (for 'git-commit' mode)"),
    staged: z
      .boolean()
      .default(false)
      .describe(
        "Show staged changes instead of unstaged (for 'git-status' mode)",
      ),

    // General options
    context: z
      .number()
      .int()
      .min(0)
      .default(3)
      .describe("Number of context lines around changes"),
    filepath: z
      .string()
      .optional()
      .describe("Specific file path to diff (for git modes)"),
  }),
  execute: async ({
    mode,
    oldFile,
    newFile,
    workingDir,
    commitHash,
    staged = false,
    context = 3,
    filepath,
  }) => {
    try {
      if (mode === "files") {
        if (!oldFile || !newFile) {
          throw new Error(
            "Both oldFile and newFile are required for file comparison mode",
          );
        }

        const oldContent = await readFile(oldFile, "utf-8");
        const newContent = await readFile(newFile, "utf-8");

        const diffOutput = DiffEngine.generateUnifiedDiff(
          oldContent,
          newContent,
          oldFile,
          newFile,
          context,
        );

        return diffOutput || "No differences found";
      }

      if (mode === "git-status") {
        const currentWorkingDir = workingDir || process.cwd();
        const gitDir = join(currentWorkingDir, ".chara", "history");

        try {
          await git.currentBranch({ fs, dir: gitDir });
        } catch {
          throw new Error(
            "Git repository not found. Please initialize git first.",
          );
        }

        // Get list of files with changes
        const statusMatrix = await git.statusMatrix({
          fs,
          dir: currentWorkingDir,
          gitdir: gitDir,
        });

        let diffOutput = "";

        for (const [file, head, workdir, stage] of statusMatrix) {
          // Skip if specific filepath requested and doesn't match
          if (filepath && file !== filepath) continue;

          // Determine what to show based on staged flag
          const showFile = staged
            ? stage !== head // Show staged changes
            : workdir !== stage; // Show unstaged changes

          if (!showFile) continue;

          try {
            let oldContent = "";
            let newContent = "";

            if (staged) {
              // Compare HEAD vs staged
              if (head === 1) {
                const objectId = await git.resolveRef({
                  fs,
                  dir: gitDir,
                  ref: "HEAD",
                });
                const { blob } = await git.readBlob({
                  fs,
                  dir: gitDir,
                  oid: objectId,
                  filepath: file,
                });
                oldContent = new TextDecoder().decode(blob);
              }

              if (stage === 1) {
                newContent = await readFile(
                  join(currentWorkingDir, file),
                  "utf-8",
                );
              }
            } else {
              // Compare staged vs working directory
              if (stage === 1) {
                if (head === 1) {
                  const objectId = await git.resolveRef({
                    fs,
                    dir: gitDir,
                    ref: "HEAD",
                  });
                  const { blob } = await git.readBlob({
                    fs,
                    dir: gitDir,
                    oid: objectId,
                    filepath: file,
                  });
                  oldContent = new TextDecoder().decode(blob);
                } else {
                  oldContent = "";
                }
              }

              if (workdir === 1) {
                newContent = await readFile(
                  join(currentWorkingDir, file),
                  "utf-8",
                );
              }
            }

            const fileDiff = DiffEngine.generateUnifiedDiff(
              oldContent,
              newContent,
              `a/${file}`,
              `b/${file}`,
              context,
            );

            if (fileDiff) {
              diffOutput += `${fileDiff}\n`;
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }

        return diffOutput || "No changes found";
      }

      if (mode === "git-commit") {
        if (!commitHash) {
          throw new Error("commitHash is required for git-commit mode");
        }

        const currentWorkingDir = workingDir || process.cwd();
        const gitDir = join(currentWorkingDir, ".chara", "history");

        try {
          await git.currentBranch({ fs, dir: gitDir });
        } catch {
          throw new Error(
            "Git repository not found. Please initialize git first.",
          );
        }

        // Get current HEAD
        const headObjectId = await git.resolveRef({
          fs,
          dir: gitDir,
          ref: "HEAD",
        });
        const compareObjectId = await git.resolveRef({
          fs,
          dir: gitDir,
          ref: commitHash,
        });

        // For simplicity, compare current working directory with specified commit
        // In a full implementation, you'd compare the tree objects
        if (filepath) {
          try {
            const currentContent = await readFile(
              join(currentWorkingDir, filepath),
              "utf-8",
            );
            let oldContent = "";

            try {
              const { blob } = await git.readBlob({
                fs,
                dir: gitDir,
                oid: compareObjectId,
                filepath,
              });
              oldContent = new TextDecoder().decode(blob);
            } catch {
              // File didn't exist in that commit
              oldContent = "";
            }

            const fileDiff = DiffEngine.generateUnifiedDiff(
              oldContent,
              currentContent,
              `${commitHash}:${filepath}`,
              `current:${filepath}`,
              context,
            );

            return fileDiff || "No differences found";
          } catch (error) {
            throw new Error(
              `Failed to diff file ${filepath}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        } else {
          return "Please specify a filepath for git-commit mode";
        }
      }

      throw new Error(`Unknown diff mode: ${mode}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate diff: ${errorMessage}`);
    }
  },
});
