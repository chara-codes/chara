import { tool } from "ai";
import z from "zod";
import { isoGitService } from "../services/isogit.js";

export const saveToHistory = tool({
  description:
    "Save all changes to git history in .chara/history directory. Adds and commits all modified files while respecting .gitignore rules and excluding .chara folder.",
  parameters: z.object({
    workingDir: z
      .string()
      .optional()
      .describe("Working directory (defaults to current working directory)"),
    commitMessage: z
      .string()
      .optional()
      .describe("Custom commit message (defaults to timestamp-based message)"),
  }),
  execute: async ({ workingDir, commitMessage }) => {
    let cwd = workingDir || process.cwd();

    // Ensure that the cwd exists and has expected structure
    try {
      await Bun.file(cwd).exists();
    } catch (error) {
      // Fallback to current working directory
      cwd = process.cwd();
    }

    try {
      return await isoGitService.saveToHistory(cwd, commitMessage);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to save to history: ${errorMessage}`);
    }
  },
});
