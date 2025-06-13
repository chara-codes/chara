import { tool } from "ai";
import z from "zod";
import { isoGitService } from "../services/isogit.js";

export const initGit = tool({
  description:
    "Initialize git repository using isomorphic-git in .chara/history directory. Skips if already initialized.",
  parameters: z.object({
    workingDir: z
      .string()
      .optional()
      .describe("Working directory (defaults to current working directory)"),
  }),
  execute: async ({ workingDir }) => {
    const cwd = workingDir || process.cwd();

    try {
      return await isoGitService.initializeRepository(cwd);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize git repository: ${errorMessage}`);
    }
  },
});
