import path from "node:path";
import { myLogger } from "./logger";

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
