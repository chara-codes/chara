import git from "isomorphic-git";
import fs from "node:fs";
import { join } from "node:path";
import { mkdir, readdir } from "node:fs/promises";
import { logger } from "@apk/logger";

export interface GitInitResult {
  status: "success" | "skipped";
  message: string;
  path: string;
}

export interface GitSaveResult {
  status: "success" | "no_changes";
  message: string;
  commitSha?: string;
  filesProcessed: number;
  commitMessage?: string;
  files?: string[];
}

export class IsoGitService {
  private getGitDir(workingDir: string): string {
    return join(workingDir, ".chara", "history");
  }

  /**
   * Initialize git repository in .chara/history directory
   */
  async initializeRepository(workingDir: string): Promise<GitInitResult> {
    const gitDir = this.getGitDir(workingDir);

    try {
      // Create .chara/history directory if it doesn't exist
      await mkdir(gitDir, { recursive: true });

      // Check if git is already initialized by trying to get the current branch
      try {
        await git.currentBranch({ fs, dir: gitDir });
        return {
          status: "skipped",
          message: "Git repository already initialized in .chara/history",
          path: gitDir,
        };
      } catch {
        // Git is not initialized, proceed with initialization
      }

      // Initialize git repository
      await git.init({
        fs,
        dir: gitDir,
        defaultBranch: "main",
      });

      await Bun.write(".gitkeep", "");

      return {
        status: "success",
        message: "Successfully initialized git repository in .chara/history",
        path: gitDir,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize git repository: ${errorMessage}`);
    }
  }

  /**
   * Get all files in working directory, excluding .chara and .git folders
   */
  private async getAllFiles(dir: string, relativePath = ""): Promise<string[]> {
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
          const subFiles = await this.getAllFiles(dir, fullPath);
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

  /**
   * Check if a file has changes compared to the last commit
   */
  private async hasFileChanges(
    workingDir: string,
    gitDir: string,
    filepath: string,
  ): Promise<boolean> {
    try {
      logger.debug(`Checking file: ${filepath}`);

      // Check if file is ignored by .gitignore
      const ignored = await git.isIgnored({
        fs,
        dir: workingDir,
        gitdir: gitDir,
        filepath,
      });
      if (ignored) {
        logger.debug(`File ${filepath} is ignored by gitignore`);
        return false;
      }

      // Check if file has changes by comparing content with last commit
      try {
        // First check git status
        const status = await git.status({
          fs,
          dir: workingDir,
          gitdir: gitDir,
          filepath,
        });

        if (status === "unmodified") {
          return false;
        }
        if (status === "added") {
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
              join(workingDir, filepath),
            ).text();
            const committedContent = new TextDecoder().decode(blob);

            const hasChanges = currentContent !== committedContent;
            logger.debug(
              `Content comparison for ${filepath}: current="${currentContent}", committed="${committedContent}", different=${hasChanges}`,
            );
            return hasChanges;
          } catch (error) {
            // File doesn't exist in commit or error reading - no changes
            logger.debug(
              `Error reading committed content for ${filepath}:`,
              error,
            );
            return false;
          }
        } else {
          // File is new, modified, or deleted
          return true;
        }
      } catch (error) {
        // If status check fails, assume it's a new file that should be added
        logger.debug(
          `File ${filepath}: status check failed, assuming new file`,
        );
        return true;
      }
    } catch (error) {
      // Skip files that can't be processed
      return false;
    }
  }

  /**
   * Save all changes to git history
   */
  async saveToHistory(
    workingDir: string,
    commitMessage?: string,
  ): Promise<GitSaveResult> {
    const gitDir = this.getGitDir(workingDir);

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
      const allFiles = await this.getAllFiles(workingDir);

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
        const hasChanges = await this.hasFileChanges(
          workingDir,
          gitDir,
          filepath,
        );

        if (hasChanges) {
          logger.debug(`Adding file: ${filepath}`);
          await git.add({ fs, dir: workingDir, gitdir: gitDir, filepath });
          addedFiles.push(filepath);
        } else {
          logger.debug(`Skipping file: ${filepath} (no changes)`);
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
  }

  /**
   * Check if git repository is initialized
   */
  async isRepositoryInitialized(workingDir: string): Promise<boolean> {
    const gitDir = this.getGitDir(workingDir);
    try {
      await git.currentBranch({ fs, dir: gitDir });
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const isoGitService = new IsoGitService();
