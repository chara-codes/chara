import { tool } from "ai";
import z from "zod";
import git from "isomorphic-git";
import fs from "node:fs";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";

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
    const gitDir = join(cwd, ".chara", "history");

    try {
      // Create .chara/history directory if it doesn't exist
      await mkdir(gitDir, { recursive: true });

      // Check if git is already initialized by trying to get the current branch
      try {
        await git.currentBranch({ fs, dir: gitDir });
        return {
          status: "skipped",
          message: "Git repository already initialized in .chara/history",
          path: gitDir,
        };
      } catch {
        // Bun.write(".gitkeep", "");
        // Git is not initialized, proceed with initialization
      }

      // Initialize git repository
      await git.init({
        fs,
        dir: gitDir,
        defaultBranch: "main",
      });
      await Bun.write(".gitkeep", "");
      return {
        status: "success",
        message: "Successfully initialized git repository in .chara/history",
        path: gitDir,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize git repository: ${errorMessage}`);
    }
  },
});
