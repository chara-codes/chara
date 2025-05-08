import chokidar from "chokidar";
import path from "node:path";
import fs from "node:fs/promises";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@chara/server";
import superjson from "superjson";
import { logger } from "@chara/logger";

export interface FileChange {
  path: string;
  type: "add" | "modify" | "delete";
  content?: string; // File content (for add/modify)
  isDirectory: boolean;
  timestamp: number;
}

export interface WatchOptions {
  rootPath: string;
  ignoredPatterns?: string[];
}

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private trpcClient: ReturnType<typeof createApiClient>;
  private rootPath: string;
  private isActive = false;

  constructor(options: WatchOptions) {
    this.rootPath = options.rootPath;
    this.trpcClient = createApiClient();
  }

  /**
   * Start watching the specified directory for changes
   */
  public async start(): Promise<void> {
    if (this.isActive) {
      logger.warn("File watcher is already running.");
      return;
    }

    const defaultIgnored = [
      "**/node_modules/**",
      "**/.git/**",
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
    ];

    try {
      // Initialize watcher with appropriate options
      this.watcher = chokidar.watch(this.rootPath, {
        ignored: defaultIgnored,
        persistent: true,
        ignoreInitial: false, // We want to capture existing files on startup
        awaitWriteFinish: {
          stabilityThreshold: 300,
          pollInterval: 100,
        },
      });

      logger.info(`Watching for file changes in: ${this.rootPath}`);
      this.isActive = true;

      // Handle initial scan completion
      this.watcher.on("ready", () => {
        logger.debug("Initial file scan complete");
      });

      // File events
      this.watcher.on("add", async (filePath) => {
        await this.handleFileChange(filePath, "add");
      });

      this.watcher.on("change", async (filePath) => {
        await this.handleFileChange(filePath, "modify");
      });

      this.watcher.on("unlink", async (filePath) => {
        await this.handleFileChange(filePath, "delete");
      });

      // Directory events
      this.watcher.on("addDir", async (dirPath) => {
        if (dirPath !== this.rootPath) {
          await this.handleDirectoryChange(dirPath, "add");
        }
      });

      this.watcher.on("unlinkDir", async (dirPath) => {
        await this.handleDirectoryChange(dirPath, "delete");
      });

      // Error handling
      this.watcher.on("error", (error) => {
        logger.error(`File watcher error: ${error.message}`);
      });
    } catch (error) {
      logger.error(`Failed to start file watcher: ${error}`);
      this.isActive = false;
    }
  }

  /**
   * Stop watching for file changes
   */
  public async stop(): Promise<void> {
    if (!this.isActive || !this.watcher) {
      return;
    }

    try {
      await this.watcher.close();
      this.watcher = null;
      this.isActive = false;
      logger.info("File watcher stopped");
    } catch (error) {
      logger.error(`Error stopping file watcher: ${error}`);
    }
  }

  private async handleFileChange(
    filePath: string,
    changeType: "add" | "modify" | "delete",
  ): Promise<void> {
    try {
      const relativePath = path.relative(this.rootPath, filePath);
      let fileContent: string | undefined;

      // Only read file content for add/modify operations
      if (changeType !== "delete") {
        fileContent = await fs.readFile(filePath, "utf-8");
      }

      const fileChange: FileChange = {
        path: relativePath,
        type: changeType,
        content: fileContent,
        isDirectory: false,
        timestamp: Date.now(),
      };

      // Send to server via tRPC
      await this.trpcClient.files.syncChange.mutate(fileChange);

      logger.debug(
        `File ${changeType === "add" ? "added" : changeType === "modify" ? "modified" : "deleted"}: ${relativePath}`,
      );
    } catch (error) {
      logger.error(`Error handling file change: ${error}`);
    }
  }

  private async handleDirectoryChange(
    dirPath: string,
    changeType: "add" | "delete",
  ): Promise<void> {
    try {
      const relativePath = path.relative(this.rootPath, dirPath);

      const dirChange: FileChange = {
        path: relativePath,
        type: changeType,
        isDirectory: true,
        timestamp: Date.now(),
      };

      // Send to server via tRPC
      await this.trpcClient.files.syncChange.mutate(dirChange);

      logger.debug(
        `Directory ${changeType === "add" ? "added" : "deleted"}: ${relativePath}`,
      );
    } catch (error) {
      logger.error(`Error handling directory change: ${error}`);
    }
  }

  /**
   * Get a snapshot of the current project structure
   */
  public async getProjectStructure(): Promise<FileChange[]> {
    try {
      const fileChanges: FileChange[] = [];
      const walkDir = async (dirPath: string) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relativePath = path.relative(this.rootPath, fullPath);

          if (entry.isDirectory()) {
            fileChanges.push({
              path: relativePath,
              type: "add",
              isDirectory: true,
              timestamp: Date.now(),
            });
            await walkDir(fullPath);
          } else {
            const content = await fs.readFile(fullPath, "utf-8");
            fileChanges.push({
              path: relativePath,
              type: "add",
              content,
              isDirectory: false,
              timestamp: Date.now(),
            });
          }
        }
      };

      await walkDir(this.rootPath);
      return fileChanges;
    } catch (error) {
      logger.error(`Error generating project structure: ${error}`);
      return [];
    }
  }
}

function createApiClient() {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "http://localhost:3030/trpc",
        transformer: superjson,
      }),
    ],
  });
}
