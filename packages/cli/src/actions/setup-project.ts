import { logger } from "@apk/logger";
import { resolve } from "path";
import type { SetupProjectActionOptions } from "./types";

export async function setupProjectAction(
  options: SetupProjectActionOptions = {},
): Promise<string> {
  // Resolve the project directory path
  const projectDir = resolve(options.projectDir || process.cwd());

  if (options.verbose) {
    logger.debug(`Resolving project directory: ${projectDir}`);
  }

  // Change the current working directory to the project root
  try {
    process.chdir(projectDir);
    logger.info(`Working directory: ${projectDir}`);

    if (options.verbose) {
      logger.debug(`Successfully changed to directory: ${projectDir}`);
    }

    return projectDir;
  } catch (error) {
    logger.error(`Failed to change to directory: ${projectDir}`);
    logger.error((error as Error).message);
    throw new Error(
      `Failed to change to directory: ${projectDir}: ${(error as Error).message}`,
    );
  }
}
