import { tool } from "ai";
import z from "zod";
import git from "isomorphic-git";
import fs from "node:fs";
import { join } from "node:path";
import { readdir } from "node:fs/promises";
import { logger } from "@chara/logger";

// Helper function to get all files in working directory
async function getAllFiles(dir: string, relativePath = ""): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(join(dir, relativePath), {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const fullPath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;

      // Skip .chara folder
      if (fullPath.startsWith(".chara/") || fullPath.startsWith(".git/"))
        continue;

      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(dir, fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  } catch {
    // Skip directories that can't be read
  }
  return files;
}

export const saveToHistory = tool({
  description:
    "Save all changes to git history in .chara/history directory. Adds and commits all modified files while respecting .gitignore rules and excluding .chara folder.",
  parameters: z.object({
    workingDir: z
      .string()
      .optional()
      .describe("Working directory (defaults to current working directory)"),
    commitMessage: z
      .string()
      .optional()
      .describe("Custom commit message (defaults to timestamp-based message)"),
  }),
  execute: async ({ workingDir, commitMessage }) => {
    let cwd = workingDir || process.cwd();
    // Ensure that the cwd exists and has expected structure
    try {
      await fs.promises.access(cwd);
    } catch (error) {
      // Fallback to current working directory
      cwd = process.cwd();
    }
    const gitDir = join(cwd, ".chara", "history");

    try {
      // Check if git is initialized
      try {
        await git.currentBranch({ fs, dir: gitDir });
      } catch {
        throw new Error(
          "Git repository not initialized. Please run init-git first.",
        );
      }

      // Get all files and check their status to see what has changed
      const allFiles = await getAllFiles(cwd);

      if (allFiles.length === 0) {
        return {
          status: "no_changes",
          message: "No changes to commit",
          filesProcessed: 0,
        };
      }

      // Check each file for changes and add only those that need to be committed
      const addedFiles: string[] = [];
      logger.debug(
        `Processing ${allFiles.length} files: ${allFiles.join(", ")}`,
      );

      for (const filepath of allFiles) {
        try {
          logger.debug(`Checking file: ${filepath}`);

          // Check if file is ignored by .gitignore
          const ignored = await git.isIgnored({
            fs,
            dir: cwd,
            gitdir: gitDir,
            filepath,
          });
          if (ignored) {
            logger.debug(`File ${filepath} is ignored by gitignore`);
            continue;
          }

          // Check if file has changes by comparing content with last commit
          let hasChanges = false;
          try {
            // First check git status
            const status = await git.status({
              fs,
              dir: cwd,
              gitdir: gitDir,
              filepath,
            });

            if (status === "unmodified") {
              hasChanges = false;
            } else if (status === "added") {
              // File was committed but might have been modified since
              // Check if current content differs from committed content
              logger.debug(
                `File ${filepath} has 'added' status, checking content...`,
              );
              try {
                const oid = await git.resolveRef({
                  fs,
                  dir: gitDir,
                  ref: "HEAD",
                });
                const { blob } = await git.readBlob({
                  fs,
                  dir: gitDir,
                  oid,
                  filepath,
                });

                const currentContent = await Bun.file(
                  join(cwd, filepath),
                ).text();
                const committedContent = new TextDecoder().decode(blob);

                hasChanges = currentContent !== committedContent;
                logger.debug(
                  `Content comparison for ${filepath}: current="${currentContent}", committed="${committedContent}", different=${hasChanges}`,
                );
              } catch (error) {
                // File doesn't exist in commit or error reading - no changes
                logger.debug(
                  `Error reading committed content for ${filepath}:`,
                  error,
                );
                hasChanges = false;
              }
            } else {
              // File is new, modified, or deleted
              hasChanges = true;
            }

            logger.debug(
              `File ${filepath}: status=${status}, hasChanges=${hasChanges}`,
            );
          } catch (error) {
            // If status check fails, assume it's a new file that should be added
            hasChanges = true;
            logger.debug(
              `File ${filepath}: status check failed, assuming new file`,
            );
          }

          if (hasChanges) {
            logger.debug(`Adding file: ${filepath}`);
            await git.add({ fs, dir: cwd, gitdir: gitDir, filepath });
            addedFiles.push(filepath);
          } else {
            logger.debug(`Skipping file: ${filepath} (no changes)`);
          }
        } catch (error) {
          // Skip files that can't be processed
          // continue;
        }
      }

      if (addedFiles.length === 0) {
        return {
          status: "no_changes",
          message:
            "No changes to commit (all files ignored or already committed)",
          filesProcessed: 0,
        };
      }

      // Create commit message
      const defaultMessage = `Save changes - ${new Date().toISOString()}`;
      const message = commitMessage || defaultMessage;

      // Commit changes
      const sha = await git.commit({
        fs,
        dir: gitDir,
        message,
        author: {
          name: "Chara Agent",
          email: "agent@chara.dev",
        },
      });

      return {
        status: "success",
        message: `Successfully committed ${addedFiles.length} files to history`,
        commitSha: sha,
        filesProcessed: addedFiles.length,
        commitMessage: message,
        files: addedFiles,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to save to history: ${errorMessage}`);
    }
  },
});
