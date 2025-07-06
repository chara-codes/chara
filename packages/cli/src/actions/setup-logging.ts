import { logger } from "@chara/logger";
import type { SetupLoggingActionOptions } from "./types";

export async function setupLoggingAction(
  options: SetupLoggingActionOptions = {},
): Promise<void> {
  // Set log level based on flags
  if (options.trace) {
    logger.setLevel("trace");
  } else if (options.verbose) {
    logger.setLevel("debug");
  } else {
    logger.setLevel("info");
  }

  if (options.verbose) {
    logger.debug(`Log level set to: ${options.trace ? "trace" : "debug"}`);
  }
}
