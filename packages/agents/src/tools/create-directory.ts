import { tool } from "ai";
import z from "zod";
import { mkdir } from "node:fs/promises";

export const createDirectory = tool({
  description:
    "Create a new directory or ensure a directory exists. Can create nested directories.",
  parameters: z.object({
    path: z.string().describe("Path to the directory to create"),
  }),
  execute: async ({ path }) => {
    try {
      await mkdir(path, { recursive: true });
      return {
        status: "success",
        message: `Successfully created directory: ${path}`,
        path,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create directory ${path}: ${errorMessage}`);
    }
  },
});
