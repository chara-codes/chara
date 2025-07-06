import { logger } from "@chara/logger";
import { readConfig } from "../config";
import type { LoadConfigActionOptions } from "./types";

export async function loadConfigAction(
  options: LoadConfigActionOptions = {},
): Promise<any> {
  if (options.verbose) {
    logger.debug("Loading configuration from project directory...");
  }

  try {
    // Read the config from the project directory
    const config = await readConfig();

    if (options.verbose) {
      logger.debug("Configuration loaded successfully");
      logger.debug("Configuration:", config);
    }

    return config;
  } catch (error) {
    logger.error("Failed to load configuration:");
    logger.error((error as Error).message);
    throw new Error(
      `Failed to load configuration: ${(error as Error).message}`,
    );
  }
}
