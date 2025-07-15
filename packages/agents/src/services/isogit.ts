import git from "isomorphic-git";
import * as fs from "node:fs";
import { join } from "node:path";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { logger } from "@chara-codes/logger";

export interface GitInitResult {
  status: "success" | "skipped";
  message: string;
  path: string;
  gitignoreUpdated?: boolean;
  initialCommitSha?: string;
  filesCommitted?: number;
}

export interface GitSaveResult {
  status: "success" | "no_changes";
  message: string;
  commitSha?: string;
  filesProcessed: number;
  commitMessage?: string;
  files?: string[];
}

export interface GitCommitInfo {
  oid: string;
  commit: {
    message: string;
    tree: string;
    parent: string[];
    author: {
      name: string;
      email: string;
      timestamp: number;
      timezoneOffset: number;
    };
    committer: {
      name: string;
      email: string;
      timestamp: number;
      timezoneOffset: number;
    };
    gpgsig?: string;
  };
  payload: string;
}

export interface GitLastCommitResult {
  status: "success" | "no_commits";
  message: string;
  commit?: GitCommitInfo;
}

export interface GitCommitHistoryResult {
  status: "success" | "no_commits";
  message: string;
  commits?: GitCommitInfo[];
  totalCount?: number;
}

export interface GitCommitByOidResult {
  status: "success" | "not_found";
  message: string;
  commit?: GitCommitInfo;
}

export interface GitHeadShaResult {
  status: "success" | "no_head";
  message: string;
  sha?: string;
}

export interface GitUncommittedChangesResult {
  status: "success";
  message: string;
  hasChanges: boolean;
  changedFiles?: string[];
}

export interface GitResetToCommitResult {
  status: "success" | "commit_not_found" | "error";
  message: string;
  targetCommitSha?: string;
  previousHeadSha?: string;
  commitsRemoved?: number;
}

export class IsoGitService {
  private getGitDir(workingDir: string): string {
    return join(workingDir, ".chara", "history");
  }

  /**
   * Initialize git repository in .chara/history directory
   * Also adds .chara/ to project's .gitignore and makes initial commit
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

      // Add .chara/ to project's .gitignore file
      const gitignoreUpdated = await this.ensureCharaInGitignore(workingDir);

      // Create initial .gitkeep file in the git directory
      await Bun.write(join(gitDir, ".gitkeep"), "");

      // Make initial commit
      let initialCommitSha: string | undefined;
      let filesCommitted = 0;
      try {
        const commitResult = await this.makeInitialCommit(workingDir, gitDir);
        initialCommitSha = commitResult.sha;
        filesCommitted = commitResult.filesCommitted;
      } catch (commitError) {
        logger.debug(
          "Initial commit failed (this is normal for empty repositories):",
          commitError
        );
      }

      const message = `Successfully initialized git repository in .chara/history${
        initialCommitSha ? ` with initial commit (${filesCommitted} files)` : ""
      }`;

      return {
        status: "success",
        message,
        path: gitDir,
        gitignoreUpdated,
        initialCommitSha,
        filesCommitted,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize git repository: ${errorMessage}`);
    }
  }

  /**
   * Ensure .chara/ is added to the project's .gitignore file
   */
  private async ensureCharaInGitignore(workingDir: string): Promise<boolean> {
    const gitignorePath = join(workingDir, ".gitignore");
    const charaEntry = ".chara/";

    try {
      // Try to read existing .gitignore
      let gitignoreContent = "";
      try {
        gitignoreContent = await readFile(gitignorePath, "utf-8");
      } catch {
        // .gitignore doesn't exist, will create it
      }

      // Check if .chara/ is already in .gitignore
      const lines = gitignoreContent.split("\n");
      const hasCharaEntry = lines.some((line) => line.trim() === charaEntry);

      if (!hasCharaEntry) {
        // Add .chara/ to .gitignore
        const newContent = gitignoreContent.trim()
          ? gitignoreContent.trim() + "\n" + charaEntry + "\n"
          : charaEntry + "\n";

        await writeFile(gitignorePath, newContent, "utf-8");
        logger.debug("Added .chara/ to .gitignore");
        return true;
      } else {
        logger.debug(".chara/ already exists in .gitignore");
        return false;
      }
    } catch (error) {
      logger.debug("Failed to update .gitignore:", error);
      // Don't throw error - this is not critical for git initialization
      return false;
    }
  }

  /**
   * Make initial commit in the history repository
   */
  private async makeInitialCommit(
    workingDir: string,
    gitDir: string
  ): Promise<{ sha: string; filesCommitted: number }> {
    try {
      // Get all files that should be committed
      const allFiles = await this.getAllFiles(workingDir);

      if (allFiles.length === 0) {
        logger.debug("No files to commit for initial commit");
        throw new Error("No files to commit");
      }

      // Add all files to the staging area
      let filesAdded = 0;
      for (const filepath of allFiles) {
        try {
          await git.add({ fs, dir: workingDir, gitdir: gitDir, filepath });
          filesAdded++;
        } catch (addError) {
          logger.debug(`Failed to add file ${filepath}:`, addError);
          // Continue with other files
        }
      }

      if (filesAdded === 0) {
        throw new Error("No files could be added to commit");
      }

      // Create initial commit
      const sha = await git.commit({
        fs,
        dir: gitDir,
        message: "Initial commit - Chara history repository initialized",
        author: {
          name: "Chara Agent",
          email: "agent@chara-ai.dev",
        },
      });

      logger.debug(`Initial commit created with SHA: ${sha}`);
      return { sha, filesCommitted: filesAdded };
    } catch (error) {
      logger.debug("Failed to create initial commit:", error);
      // Don't throw - repository is still initialized successfully
      return { sha: "", filesCommitted: 0 };
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
    filepath: string
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
            `File ${filepath} has 'added' status, checking content...`
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
              join(workingDir, filepath)
            ).text();
            const committedContent = new TextDecoder().decode(blob);

            const hasChanges = currentContent !== committedContent;
            logger.debug(
              `Content comparison for ${filepath}: current="${currentContent}", committed="${committedContent}", different=${hasChanges}`
            );
            return hasChanges;
          } catch (error) {
            // File doesn't exist in commit or error reading - no changes
            logger.debug(
              `Error reading committed content for ${filepath}:`,
              error
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
          `File ${filepath}: status check failed, assuming new file`
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
    commitMessage?: string
  ): Promise<GitSaveResult> {
    const gitDir = this.getGitDir(workingDir);

    try {
      // Check if git is initialized
      try {
        await git.currentBranch({ fs, dir: gitDir });
      } catch {
        throw new Error(
          "Git repository not initialized. Please run init-git first."
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
        `Processing ${allFiles.length} files: ${allFiles.join(", ")}`
      );

      for (const filepath of allFiles) {
        const hasChanges = await this.hasFileChanges(
          workingDir,
          gitDir,
          filepath
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
          email: "agent@chara-ai.dev",
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
   * Get the last commit information
   */
  async getLastCommit(workingDir: string): Promise<GitLastCommitResult> {
    const gitDir = this.getGitDir(workingDir);

    try {
      // Check if git is initialized
      try {
        await git.currentBranch({ fs, dir: gitDir });
      } catch {
        throw new Error(
          "Git repository not initialized. Please run init-git first."
        );
      }

      // Get the last commit using git.log with depth 1
      try {
        const commits = await git.log({
          fs,
          dir: gitDir,
          depth: 1,
        });

        if (commits.length === 0) {
          return {
            status: "no_commits",
            message: "No commits found in repository",
          };
        }

        const lastCommit = commits[0];

        return {
          status: "success",
          message: "Successfully retrieved last commit",
          commit: lastCommit,
        };
      } catch (logError) {
        // If git.log fails (e.g., no refs/heads/main), it means no commits
        return {
          status: "no_commits",
          message: "No commits found in repository",
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get last commit: ${errorMessage}`);
    }
  }

  /**
   * Get commit history with optional depth limit
   */
  async getCommitHistory(
    workingDir: string,
    options?: { depth?: number; ref?: string }
  ): Promise<GitCommitHistoryResult> {
    const gitDir = this.getGitDir(workingDir);

    try {
      // Check if git is initialized
      try {
        await git.currentBranch({ fs, dir: gitDir });
      } catch {
        throw new Error(
          "Git repository not initialized. Please run init-git first."
        );
      }

      // Get commits with optional depth and ref
      try {
        const commits = await git.log({
          fs,
          dir: gitDir,
          depth: options?.depth,
          ref: options?.ref,
        });

        if (commits.length === 0) {
          return {
            status: "no_commits",
            message: "No commits found in repository",
          };
        }

        return {
          status: "success",
          message: `Successfully retrieved ${commits.length} commits`,
          commits,
          totalCount: commits.length,
        };
      } catch (logError) {
        // If git.log fails (e.g., no refs/heads/main), it means no commits
        return {
          status: "no_commits",
          message: "No commits found in repository",
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get commit history: ${errorMessage}`);
    }
  }

  /**
   * Get a specific commit by its OID (SHA)
   */
  async getCommitByOid(
    workingDir: string,
    oid: string
  ): Promise<GitCommitByOidResult> {
    const gitDir = this.getGitDir(workingDir);

    try {
      // Check if git is initialized
      try {
        await git.currentBranch({ fs, dir: gitDir });
      } catch {
        throw new Error(
          "Git repository not initialized. Please run init-git first."
        );
      }

      // Read the commit object
      try {
        const commit = await git.readCommit({
          fs,
          dir: gitDir,
          oid,
        });

        return {
          status: "success",
          message: "Successfully retrieved commit",
          commit,
        };
      } catch (readError) {
        const errorMessage =
          readError instanceof Error ? readError.message : String(readError);

        // Check if it's a "not found" error
        if (
          errorMessage.includes("object not found") ||
          errorMessage.includes("not a valid object") ||
          errorMessage.includes("invalid object id") ||
          errorMessage.includes("Could not find")
        ) {
          return {
            status: "not_found",
            message: `Commit with OID ${oid} not found`,
          };
        }

        throw readError;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get commit: ${errorMessage}`);
    }
  }

  /**
   * Get the current HEAD commit SHA
   */
  async getCurrentHeadSha(workingDir: string): Promise<GitHeadShaResult> {
    const gitDir = this.getGitDir(workingDir);

    try {
      // Check if git is initialized
      try {
        await git.currentBranch({ fs, dir: gitDir });
      } catch {
        throw new Error(
          "Git repository not initialized. Please run init-git first."
        );
      }

      try {
        // Get the current HEAD reference
        const sha = await git.resolveRef({
          fs,
          dir: gitDir,
          ref: "HEAD",
        });

        return {
          status: "success",
          message: "Successfully retrieved HEAD SHA",
          sha,
        };
      } catch (error) {
        // Repository exists but has no commits yet
        return {
          status: "no_head",
          message: "Repository has no commits yet",
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get HEAD SHA: ${errorMessage}`);
    }
  }

  /**
   * Check if there are uncommitted changes in the working directory
   */
  async hasUncommittedChanges(
    workingDir: string
  ): Promise<GitUncommittedChangesResult> {
    const gitDir = this.getGitDir(workingDir);

    try {
      // Check if git is initialized
      try {
        await git.currentBranch({ fs, dir: gitDir });
      } catch {
        throw new Error(
          "Git repository not initialized. Please run init-git first."
        );
      }

      // Get all files and check for changes
      const allFiles = await this.getAllFiles(workingDir);
      const changedFiles: string[] = [];

      for (const filepath of allFiles) {
        const hasChanges = await this.hasFileChanges(
          workingDir,
          gitDir,
          filepath
        );

        if (hasChanges) {
          changedFiles.push(filepath);
        }
      }

      return {
        status: "success",
        message: `Found ${changedFiles.length} changed files`,
        hasChanges: changedFiles.length > 0,
        changedFiles,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to check uncommitted changes: ${errorMessage}`);
    }
  }

  /**
   * Reset HEAD and current branch to a specific commit, removing all commits after it
   */
  async resetToCommit(
    workingDir: string,
    targetCommitSha: string
  ): Promise<GitResetToCommitResult> {
    const gitDir = this.getGitDir(workingDir);

    try {
      // First, verify the target commit exists
      try {
        await git.readCommit({
          fs,
          dir: gitDir,
          oid: targetCommitSha,
        });
      } catch {
        return {
          status: "commit_not_found",
          message: `Target commit ${targetCommitSha} not found`,
        };
      }

      // Get current HEAD SHA to track what we're changing from
      const previousHeadSha = await git.resolveRef({
        fs,
        dir: gitDir,
        ref: "HEAD",
      });

      // Get current branch name
      const currentBranch = await git.currentBranch({ fs, dir: gitDir });
      if (!currentBranch) {
        return {
          status: "error",
          message: "No current branch found",
        };
      }

      // Count commits that will be removed
      let commitsRemoved = 0;
      try {
        const commits = await git.log({ fs, dir: gitDir, ref: "HEAD" });
        for (const commit of commits) {
          if (commit.oid === targetCommitSha) {
            break;
          }
          commitsRemoved++;
        }
      } catch (error) {
        logger.warning(`Could not count commits to be removed: ${error}`);
      }

      // Update the current branch to point to the target commit and checkout files
      const branchRef = `refs/heads/${currentBranch}`;
      await new Promise<void>((resolve, reject) => {
        // Ensure refs/heads directory exists
        fs.mkdir(
          join(gitDir, "refs", "heads"),
          { recursive: true },
          (mkdirErr) => {
            if (mkdirErr) {
              return reject(mkdirErr);
            }

            fs.writeFile(join(gitDir, branchRef), targetCommitSha, (err) => {
              if (err) {
                return reject(err);
              }

              // Clear the index (if any)
              const indexPath = join(gitDir, "index");
              fs.unlink(indexPath, (unlinkErr) => {
                // It's okay if index doesn't exist, just continue
                if (unlinkErr && unlinkErr.code !== "ENOENT") {
                  logger.warning(
                    `Could not remove index: ${unlinkErr.message}`
                  );
                }

                // Manually restore files from the target commit
                git
                  .readCommit({
                    fs,
                    dir: gitDir,
                    oid: targetCommitSha,
                  })
                  .then(async (commit) => {
                    // Get the tree object
                    const { tree } = commit.commit;

                    // Recursively restore all files from the commit
                    const restoreFiles = async (
                      treeOid: string,
                      basePath = ""
                    ): Promise<void> => {
                      const { tree: treeEntries } = await git.readTree({
                        fs,
                        dir: gitDir,
                        oid: treeOid,
                      });

                      for (const entry of treeEntries) {
                        const filePath = basePath
                          ? join(basePath, entry.path)
                          : entry.path;
                        const fullPath = join(workingDir, filePath);

                        if (entry.type === "tree") {
                          // Create directory and recurse
                          await mkdir(join(workingDir, filePath), {
                            recursive: true,
                          });
                          await restoreFiles(entry.oid, filePath);
                        } else if (entry.type === "blob") {
                          // Read blob and write file
                          const { blob } = await git.readBlob({
                            fs,
                            dir: gitDir,
                            oid: entry.oid,
                          });

                          // Ensure parent directory exists
                          const parentDir = join(workingDir, filePath, "..");
                          await mkdir(parentDir, { recursive: true });

                          // Write file
                          await writeFile(fullPath, blob);
                        }
                      }
                    };

                    await restoreFiles(tree);
                  })
                  .then(() => resolve())
                  .catch((error) => {
                    logger.error(`File restoration failed: ${error.message}`);
                    reject(
                      new Error(
                        `Failed to restore files from commit: ${error.message}`
                      )
                    );
                  });
              });
            });
          }
        );
      });

      logger.info(
        `Successfully reset to commit ${targetCommitSha}, removed ${commitsRemoved} commits`
      );

      return {
        status: "success",
        message: `Successfully reset to commit ${targetCommitSha}`,
        targetCommitSha,
        previousHeadSha,
        commitsRemoved,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Failed to reset to commit: ${errorMessage}`);
      return {
        status: "error",
        message: `Failed to reset to commit: ${errorMessage}`,
      };
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
