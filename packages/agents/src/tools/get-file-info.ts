import { tool } from "ai";
import z from "zod";
import { stat } from "node:fs/promises";

interface FileInfo {
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
  isDirectory: boolean;
  isFile: boolean;
  permissions: string;
}

export const getFileInfo = tool({
  description:
    "Retrieve detailed metadata about a file or directory including size, timestamps, and permissions",
  parameters: z.object({
    path: z
      .string()
      .describe("Path to the file or directory to get information about"),
  }),
  execute: async ({ path }) => {
    try {
      const stats = await stat(path);

      const fileInfo: FileInfo = {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        permissions: stats.mode.toString(8).slice(-3),
      };

      return {
        path,
        ...fileInfo,
        formattedInfo: Object.entries(fileInfo)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n"),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get file info for ${path}: ${errorMessage}`);
    }
  },
});
