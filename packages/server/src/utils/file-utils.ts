import fs from "fs";
import path from "node:path";
import { myLogger } from "./logger";

export function isNonEmptyDirectory(projectPath: string): boolean {
  try {
    const files = fs.readdirSync(projectPath).filter((f) => !f.startsWith("."));
    myLogger.info("Found files:", files.length);
    return files.length > 0;
  } catch (e) {
    myLogger.error(e);
    return false;
  }
}

const PROJECTS_ROOT = path.resolve(__dirname, "../../../../projects");

/**
 * Resolves the absolute path to a project directory by its name.
 * @param projectName - The name of the project (folder name in the projects directory).
 * @returns The absolute path to the project directory.
 */
export function resolveProjectPath(projectName: string): string {
  if (!projectName) {
    throw new Error("Project name must be provided");
  }
  myLogger.debug("Project path:", path.join(PROJECTS_ROOT, projectName));
  return path.join(PROJECTS_ROOT, projectName);
}

/**
 * Returns the root directory where all projects are stored.
 * @returns The absolute path to the projects root directory.
 */
export function getProjectsRoot(): string {
  return PROJECTS_ROOT;
}
