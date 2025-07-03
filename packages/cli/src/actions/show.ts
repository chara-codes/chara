import { logger } from "@chara/logger";
import { intro, outro } from "@clack/prompts";
import { bold, cyan, green } from "picocolors";
import { existsGlobalConfig, readGlobalConfig } from "../utils/global-config";
import {
  getConfiguredProviders,
  maskSensitiveValue,
} from "../utils/provider-utils";
import { PROVIDER_CONFIGS } from "../config/provider-configs";
import type { ShowActionOptions } from "./types";

export async function showAction(
  options: ShowActionOptions = {},
): Promise<void> {
  if (options.verbose) {
    logger.setLevel("debug");
  }
  intro(bold(cyan("📋 Current Chara Configuration")));

  const configExists = await existsGlobalConfig();
  if (!configExists) {
    logger.info(
      "No configuration found. Run 'chara init' to set up your providers.",
    );
    return;
  }

  try {
    const config = await readGlobalConfig();
    const envConfig = config.env || {};

    if (Object.keys(envConfig).length === 0) {
      logger.info("No environment variables configured.");
      return;
    }

    logger.info("\n" + bold("Configured Environment Variables:"));
    Object.entries(envConfig).forEach(([key, value]) => {
      const displayValue = maskSensitiveValue(key, value as string);
      logger.info(`  ${green("✓")} ${key}: ${displayValue}`);
    });

    // Show which providers are configured
    const configuredProviders = getConfiguredProviders(envConfig);

    if (configuredProviders.length > 0) {
      logger.info("\n" + bold("Configured Providers:"));
      configuredProviders.forEach((providerKey) => {
        const config = PROVIDER_CONFIGS[providerKey];
        if (config) {
          logger.info(`  ${green("✓")} ${config.name}`);
        }
      });
    }

    outro("Configuration displayed successfully!");
  } catch (error) {
    logger.error("Error reading configuration:", error);
    throw error;
  }
}
