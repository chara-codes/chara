import * as fs from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { logger } from "@chara-codes/logger";
import git from "isomorphic-git";

/**
 * Get git directory path for the given working directory
 */
export function getGitDir(workingDir: string): string {
  return join(workingDir, ".chara", "history");
}

/**
 * Ensure .chara/ is added to the project's .gitignore file
 */
export async function ensureCharaInGitignore(
  workingDir: string
): Promise<boolean> {
  const gitignorePath = join(workingDir, ".gitignore");
  const charaEntry = ".chara/";

  try {
    // Try to read existing .gitignore
    let gitignoreContent = "";
    try {
      gitignoreContent = await readFile(gitignorePath, "utf-8");
    } catch {
      // .gitignore doesn't exist, will create it
    }

    // Check if .chara/ is already in .gitignore
    const lines = gitignoreContent.split("\n");
    const hasCharaEntry = lines.some((line) => line.trim() === charaEntry);

    if (!hasCharaEntry) {
      // Add .chara/ to .gitignore
      const newContent = gitignoreContent.trim()
        ? gitignoreContent.trim() + "\n" + charaEntry + "\n"
        : charaEntry + "\n";

      await writeFile(gitignorePath, newContent, "utf-8");
      logger.debug("Added .chara/ to .gitignore");
      return true;
    } else {
      logger.debug(".chara/ already exists in .gitignore");
      return false;
    }
  } catch (error) {
    logger.debug("Failed to update .gitignore:", error);
    // Don't throw error - this is not critical for git initialization
    return false;
  }
}

/**
 * Get all files in working directory, excluding .chara and .git folders
 * Includes .gitignore for initial commit
 */
export async function getAllFiles(
  dir: string,
  relativePath = ""
): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(join(dir, relativePath), {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const fullPath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;

      // Skip .chara folder and .git folder
      if (fullPath.startsWith(".chara/") || fullPath.startsWith(".git/"))
        continue;

      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(dir, fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  } catch {
    // Skip directories that can't be read
  }
  return files;
}

/**
 * Make initial commit in the history repository
 */
export async function makeInitialCommit(
  workingDir: string,
  gitDir: string
): Promise<{ sha: string; filesCommitted: number }> {
  try {
    // Get all files that should be committed
    const allFiles = await getAllFiles(workingDir);

    if (allFiles.length === 0) {
      logger.debug("No files to commit for initial commit");
      throw new Error("No files to commit");
    }

    // Add all files to the staging area
    let filesAdded = 0;
    for (const filepath of allFiles) {
      try {
        await git.add({ fs, dir: workingDir, gitdir: gitDir, filepath });
        filesAdded++;
      } catch (addError) {
        logger.debug(`Failed to add file ${filepath}:`, addError);
        // Continue with other files
      }
    }

    if (filesAdded === 0) {
      throw new Error("No files could be added to commit");
    }

    // Create initial commit
    const sha = await git.commit({
      fs,
      dir: workingDir,
      gitdir: gitDir,
      message: "Initial commit - Chara history repository initialized",
      author: {
        name: "Chara Agent",
        email: "agent@chara-ai.dev",
      },
    });

    logger.debug(`Initial commit created with SHA: ${sha}`);
    return { sha, filesCommitted: filesAdded };
  } catch (error) {
    logger.debug("Failed to create initial commit:", error);
    // Don't throw - repository is still initialized successfully
    return { sha: "", filesCommitted: 0 };
  }
}
