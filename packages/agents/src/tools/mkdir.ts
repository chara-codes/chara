import { tool } from "ai";
import z from "zod";
import { mkdir as fsMkdir } from "node:fs/promises";
import { resolve } from "node:path";

export const mkdir = tool({
  description: `Create directories with recursive parent creation support.

**Operations:**
- Create directories with automatic parent directory creation
- Support for relative paths (resolved from current working directory)
- Proper error handling and validation

**Features:**
- Recursive directory creation (equivalent to 'mkdir -p')
- Works with relative paths from current working directory
- Creates parent directories as needed
- Detailed success and error reporting`,

  parameters: z.object({
    path: z
      .string()
      .describe(
        "Directory path to create (relative to current working directory or absolute path)"
      ),

    recursive: z
      .boolean()
      .default(true)
      .describe("Create parent directories as needed (default: true)"),
  }),

  execute: async ({ path, recursive = true }) => {
    try {
      if (!path || path.trim() === "") {
        throw new Error("Path cannot be empty");
      }

      // Normalize and resolve path from current working directory
      const normalizedPath = path.trim();
      const fullPath = resolve(process.cwd(), normalizedPath);

      // Clean trailing slash if present
      const cleanPath = normalizedPath.endsWith("/")
        ? normalizedPath.slice(0, -1)
        : normalizedPath;

      // Create directory
      await fsMkdir(fullPath, { recursive });

      return {
        success: true,
        operation: "mkdir",
        path: cleanPath,
        fullPath,
        recursive,
        message: `Successfully created directory: ${cleanPath}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Provide helpful error messages and suggestions
      let suggestion = "Check the path and permissions and try again";

      if (errorMessage.includes("EEXIST")) {
        suggestion = recursive
          ? "Directory already exists (this is normal with recursive mode)"
          : "Directory already exists. Use recursive mode or choose a different path";
      } else if (
        errorMessage.includes("EACCES") ||
        errorMessage.includes("EPERM")
      ) {
        suggestion =
          "Permission denied. Check directory permissions and user access rights";
      } else if (errorMessage.includes("ENOTDIR")) {
        suggestion =
          "A component of the path exists but is not a directory. Check the parent path structure";
      } else if (errorMessage.includes("ENAMETOOLONG")) {
        suggestion = "Path name is too long. Use a shorter path";
      } else if (errorMessage.includes("ENOSPC")) {
        suggestion =
          "No space left on device. Free up disk space and try again";
      } else if (errorMessage.includes("ENOENT")) {
        suggestion = recursive
          ? "Cannot create directory. Check if the path is valid"
          : "Parent directory does not exist. Use recursive mode or create parent directories first";
      }

      return {
        success: false,
        error: true,
        operation: "mkdir",
        path,
        message: `Failed to create directory: ${errorMessage}`,
        suggestion,
        errorCode:
          error instanceof Error && "code" in error ? error.code : undefined,
      };
    }
  },
});
