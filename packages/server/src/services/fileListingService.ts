import fs from "fs/promises";
import path from "path";
import ignore from "ignore";
import { logger } from "../utils/logger";

export interface FileSystemEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  isGitIgnored: boolean;
  lastModified?: Date;
  children?: FileSystemEntry[];
}

export interface FileListingOptions {
  maxDepth?: number;
  includeHidden?: boolean;
  workingDirectory?: string;
}

export interface FileListResponse {
  files: FileSystemEntry[];
  totalCount: number;
  gitIgnoreRules: string[];
}

export class FileListingService {
  private ignoreInstance: ReturnType<typeof ignore>;
  private gitIgnoreRules: string[] = [];

  constructor(private workingDirectory: string) {
    this.ignoreInstance = ignore();
  }

  /**
   * Load .gitignore rules from the working directory
   */
  private async loadGitIgnoreRules(): Promise<void> {
    try {
      const gitIgnorePath = path.join(this.workingDirectory, ".gitignore");
      const gitIgnoreContent = await fs.readFile(gitIgnorePath, "utf-8");
      this.gitIgnoreRules = gitIgnoreContent
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith("#"));
      
      // Add the gitignore content to the ignore instance
      this.ignoreInstance.add(gitIgnoreContent);
      
      logger.debug("Loaded .gitignore rules", {
        count: this.gitIgnoreRules.length,
        workingDirectory: this.workingDirectory,
      });
    } catch (error) {
      // .gitignore doesn't exist or can't be read - continue without rules
      logger.debug("No .gitignore found or unable to read", { error });
    }
  }

  /**
   * Check if a file path should be ignored based on .gitignore rules
   */
  private isIgnored(relativePath: string, isDirectory: boolean = false): boolean {
    // Normalize path separators for cross-platform compatibility
    let normalizedPath = relativePath.replace(/\\/g, "/");
    
    // For directories, also check with trailing slash as gitignore patterns
    // like "node_modules/" specifically match directories
    if (isDirectory && !normalizedPath.endsWith("/")) {
      normalizedPath = normalizedPath + "/";
    }
    
    return this.ignoreInstance.ignores(normalizedPath);
  }

  /**
   * Recursively scan directory and build file tree
   */
  private async scanDirectory(
    dirPath: string,
    currentDepth: number,
    maxDepth: number,
    includeHidden: boolean,
    basePath: string
  ): Promise<FileSystemEntry[]> {
    const entries: FileSystemEntry[] = [];

    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        // Skip hidden files/directories if not included
        if (!includeHidden && item.name.startsWith(".")) {
          continue;
        }

        const fullPath = path.join(dirPath, item.name);
        const relativePath = path.relative(basePath, fullPath);

        // Check if ignored by .gitignore
        const isGitIgnored = this.isIgnored(relativePath, item.isDirectory());
        
        if (isGitIgnored) {
          continue;
        }

        const entry: FileSystemEntry = {
          name: item.name,
          path: relativePath,
          type: item.isDirectory() ? "directory" : "file",
          isGitIgnored,
        };

        // Get file stats for additional metadata
        try {
          const stats = await fs.stat(fullPath);
          entry.size = stats.size;
          entry.lastModified = stats.mtime;
        } catch (error) {
          logger.warn("Failed to get stats for file", {
            path: fullPath,
            error,
          });
        }

        // Recursively scan subdirectories if within depth limit
        if (item.isDirectory() && currentDepth < maxDepth) {
          entry.children = await this.scanDirectory(
            fullPath,
            currentDepth + 1,
            maxDepth,
            includeHidden,
            basePath
          );
        }

        entries.push(entry);
      }
    } catch (error) {
      logger.error("Failed to read directory", { path: dirPath, error });
      throw error;
    }

    return entries;
  }

  /**
   * List files in the working directory
   */
  async listFiles(options: FileListingOptions = {}): Promise<FileListResponse> {
    const {
      maxDepth = 3,
      includeHidden = false,
      workingDirectory = this.workingDirectory,
    } = options;

    // Load .gitignore rules
    await this.loadGitIgnoreRules();

    try {
      // Verify working directory exists
      await fs.access(workingDirectory);

      // Scan directory tree
      const files = await this.scanDirectory(
        workingDirectory,
        0,
        maxDepth,
        includeHidden,
        workingDirectory
      );

      // Count total files
      const countFiles = (entries: FileSystemEntry[]): number => {
        return entries.reduce((count, entry) => {
          if (entry.type === "file") {
            return count + 1;
          }
          if (entry.children) {
            return count + countFiles(entry.children);
          }
          return count;
        }, 0);
      };

      const totalCount = countFiles(files);

      logger.info("File listing completed", {
        totalCount,
        maxDepth,
        workingDirectory,
      });

      return {
        files,
        totalCount,
        gitIgnoreRules: this.gitIgnoreRules,
      };
    } catch (error) {
      logger.error("Failed to list files", { workingDirectory, error });
      throw error;
    }
  }
}
