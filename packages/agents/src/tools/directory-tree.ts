import { tool } from "ai";
import z from "zod";
import { readdir } from "node:fs/promises";

interface TreeEntry {
  name: string;
  type: "file" | "directory";
  children?: TreeEntry[];
}

export const directoryTree = tool({
  description:
    "Get a recursive tree view of files and directories as a JSON structure",
  parameters: z.object({
    path: z.string().describe("Path to the directory to get tree view for"),
  }),
  execute: async ({ path }) => {
    async function buildTree(currentPath: string): Promise<TreeEntry[]> {
      try {
        const entries = await readdir(currentPath, { withFileTypes: true });
        const result: TreeEntry[] = [];

        for (const entry of entries) {
          const entryData: TreeEntry = {
            name: entry.name,
            type: entry.isDirectory() ? "directory" : "file",
          };

          if (entry.isDirectory()) {
            const subPath = `${currentPath}/${entry.name}`;
            entryData.children = await buildTree(subPath);
          }

          result.push(entryData);
        }

        return result;
      } catch (error) {
        throw new Error(
          `Failed to read directory ${currentPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    try {
      const treeData = await buildTree(path);
      return JSON.stringify(treeData, null, 2);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to build directory tree for ${path}: ${errorMessage}`,
      );
    }
  },
});
