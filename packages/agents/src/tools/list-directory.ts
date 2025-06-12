import { tool } from "ai";
import z from "zod";
import { readdir } from "node:fs/promises";

export const listDirectory = tool({
  description:
    "Get a detailed listing of all files and directories in a specified path",
  parameters: z.object({
    path: z.string().describe("Path to the directory to list"),
  }),
  execute: async ({ path }) => {
    try {
      const entries = await readdir(path, { withFileTypes: true });

      const formatted = entries
        .map(
          (entry) =>
            `${entry.isDirectory() ? "[DIR]" : "[FILE]"} ${entry.name}`,
        )
        .join("\n");

      return formatted || "Directory is empty";
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list directory ${path}: ${errorMessage}`);
    }
  },
});
