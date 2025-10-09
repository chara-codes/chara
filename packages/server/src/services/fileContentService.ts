import fs from "fs/promises";
import path from "path";
import { logger } from "../utils/logger";

export interface FileContentResponse {
  content: string;
  mimeType: string;
  isBinary: boolean;
  size: number;
  encoding: string;
}

// Maximum file size to read (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export class FileContentService {
  constructor(private workingDirectory: string) {}

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".js": "text/javascript",
      ".jsx": "text/javascript",
      ".ts": "text/typescript",
      ".tsx": "text/typescript",
      ".json": "application/json",
      ".html": "text/html",
      ".css": "text/css",
      ".md": "text/markdown",
      ".txt": "text/plain",
      ".xml": "application/xml",
      ".yaml": "text/yaml",
      ".yml": "text/yaml",
      ".py": "text/x-python",
      ".java": "text/x-java",
      ".c": "text/x-c",
      ".cpp": "text/x-c++",
      ".h": "text/x-c",
      ".go": "text/x-go",
      ".rs": "text/x-rust",
      ".sh": "text/x-shellscript",
      ".bash": "text/x-shellscript",
      ".sql": "text/x-sql",
      ".graphql": "application/graphql",
      ".vue": "text/x-vue",
      ".svelte": "text/x-svelte",
      ".php": "text/x-php",
      ".rb": "text/x-ruby",
      ".swift": "text/x-swift",
      ".kt": "text/x-kotlin",
      ".scala": "text/x-scala",
      ".r": "text/x-r",
      ".m": "text/x-objective-c",
      ".dockerfile": "text/x-dockerfile",
      ".gitignore": "text/plain",
      ".env": "text/plain",
    };

    return mimeTypes[ext] || "application/octet-stream";
  }

  /**
   * Check if content is binary by looking for null bytes
   */
  private isBinaryContent(buffer: Buffer): boolean {
    // Check first 8000 bytes for null bytes (common binary indicator)
    const checkLength = Math.min(buffer.length, 8000);
    for (let i = 0; i < checkLength; i++) {
      if (buffer[i] === 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if MIME type indicates a text file
   */
  private isTextMimeType(mimeType: string): boolean {
    return (
      mimeType.startsWith("text/") ||
      mimeType === "application/json" ||
      mimeType === "application/xml" ||
      mimeType === "application/graphql" ||
      mimeType.includes("javascript") ||
      mimeType.includes("typescript")
    );
  }

  /**
   * Validate that the file path is within the working directory
   */
  private validatePath(filePath: string): string {
    // Resolve the absolute path
    const absolutePath = path.resolve(this.workingDirectory, filePath);

    // Ensure the path is within the working directory
    if (!absolutePath.startsWith(this.workingDirectory)) {
      throw new Error("Invalid file path: path is outside working directory");
    }

    return absolutePath;
  }

  /**
   * Get file content by path
   */
  async getFileContent(filePath: string): Promise<FileContentResponse> {
    try {
      // Validate and resolve path
      const absolutePath = this.validatePath(filePath);

      logger.debug("Reading file content", { filePath, absolutePath });

      // Check if file exists and get stats
      const stats = await fs.stat(absolutePath);

      if (!stats.isFile()) {
        throw new Error("Path is not a file");
      }

      // Check file size
      if (stats.size > MAX_FILE_SIZE) {
        throw new Error(
          `File too large: ${stats.size} bytes (max: ${MAX_FILE_SIZE} bytes)`
        );
      }

      // Get MIME type
      const mimeType = this.getMimeType(absolutePath);

      // Read file content
      const buffer = await fs.readFile(absolutePath);

      // Determine if binary
      const isBinary = this.isBinaryContent(buffer);

      // Convert to appropriate encoding
      const content = isBinary
        ? buffer.toString("base64")
        : buffer.toString("utf-8");

      const encoding = isBinary ? "base64" : "utf-8";

      logger.info("File content retrieved", {
        filePath,
        size: stats.size,
        mimeType,
        isBinary,
        encoding,
      });

      return {
        content,
        mimeType,
        isBinary,
        size: stats.size,
        encoding,
      };
    } catch (error) {
      logger.error("Failed to read file content", { filePath, error });

      // Provide more specific error messages
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(`File not found: ${filePath}`);
      }
      if ((error as NodeJS.ErrnoException).code === "EACCES") {
        throw new Error(`Permission denied: ${filePath}`);
      }

      throw error;
    }
  }
}
