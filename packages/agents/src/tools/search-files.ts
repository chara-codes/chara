import { tool } from "ai";
import z from "zod";
import { readdir } from "node:fs/promises";

export const searchFiles = tool({
  description:
    "Recursively search for files and directories matching a pattern. Searches through all subdirectories from the starting path.",
  parameters: z.object({
    path: z.string().describe("Starting directory path to search from"),
    pattern: z
      .string()
      .describe("Search pattern to match against file/directory names"),
    excludePatterns: z
      .array(z.string())
      .optional()
      .default([])
      .describe("Optional patterns to exclude from search results"),
  }),
  execute: async ({ path, pattern, excludePatterns = [] }) => {
    const results: string[] = [];

    async function search(currentPath: string) {
      try {
        const entries = await readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = `${currentPath}/${entry.name}`;

          // Check if path matches any exclude pattern
          const shouldExclude = excludePatterns.some((excludePattern) => {
            return (
              entry.name.toLowerCase().includes(excludePattern.toLowerCase()) ||
              fullPath.toLowerCase().includes(excludePattern.toLowerCase())
            );
          });

          if (shouldExclude) {
            continue;
          }

          // Check if entry matches the search pattern (case-insensitive)
          if (entry.name.toLowerCase().includes(pattern.toLowerCase())) {
            results.push(fullPath);
          }

          // Recursively search subdirectories
          if (entry.isDirectory()) {
            await search(fullPath);
          }
        }
      } catch (error) {
        // Skip directories that can't be accessed
        return;
      }
    }

    try {
      await search(path);
      return results.length > 0 ? results.join("\n") : "No matches found";
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to search files in ${path}: ${errorMessage}`);
    }
  },
});
