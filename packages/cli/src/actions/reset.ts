import { logger } from "@chara/logger";
import {
  cancel,
  confirm,
  intro,
  isCancel,
  outro,
  spinner,
} from "../utils/prompts";
import { bold, cyan, green } from "picocolors";
import { existsGlobalConfig, updateGlobalConfig } from "@chara/settings";
import type { ResetActionOptions } from "./types";

export async function resetAction(
  options: ResetActionOptions = {},
): Promise<void> {
  if (options.verbose) {
    logger.setLevel("debug");
  }
  intro(bold(cyan("🔄 Reset Chara Configuration")));

  const configExists = await existsGlobalConfig();
  if (!configExists) {
    logger.info("No configuration found to reset.");
    return;
  }

  const shouldReset =
    options.confirm ??
    (await confirm({
      message:
        "Are you sure you want to reset all configuration? This action cannot be undone.",
      initialValue: false,
    }));

  if (isCancel(shouldReset) || !shouldReset) {
    cancel("Reset cancelled.");
    return;
  }

  const s = spinner();
  s.start("Resetting configuration...");

  try {
    await updateGlobalConfig({ env: {} });
    s.stop("Configuration reset successfully!");
    outro(
      `${bold(green("✅ Configuration reset!"))}

All environment variables have been cleared.
Run ${cyan("chara init")} to set up your providers again.`,
    );
  } catch (error) {
    s.stop("Failed to reset configuration");
    logger.error("Error resetting configuration:", error);
    throw error;
  }
}
