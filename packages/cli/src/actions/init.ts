import { logger } from "@chara/logger";
import {
  cancel,
  confirm,
  intro,
  isCancel,
  multiselect,
  outro,
  spinner,
} from "@clack/prompts";
import { bold, cyan, green } from "picocolors";
import {
  existsGlobalConfig,
  getPathToGlobalConfig,
  readGlobalConfig,
  updateGlobalConfig,
} from "../utils/global-config";
import { PROVIDER_CONFIGS } from "../config/provider-configs";
import {
  promptForProviderConfig,
  validateProviderConfig,
  maskSensitiveValue,
} from "../utils/provider-utils";
import type { InitActionOptions } from "./types";

interface GlobalConfig {
  env?: Record<string, string>;
  [key: string]: unknown;
}

export async function initAction(
  options: InitActionOptions = {},
): Promise<void> {
  if (options.verbose) {
    logger.setLevel("debug");
  }
  intro(bold(cyan("🚀 Welcome to Chara Codes Setup!")));

  // Check if config already exists
  const configExists = await existsGlobalConfig();
  let existingConfig: GlobalConfig = {};

  if (configExists && !options.force) {
    try {
      existingConfig = await readGlobalConfig();

      const shouldContinue = await confirm({
        message: "Configuration already exists. Do you want to update it?",
        initialValue: false,
      });

      if (isCancel(shouldContinue) || !shouldContinue) {
        cancel("Setup cancelled.");
        return;
      }
    } catch (error) {
      logger.debug("Error reading existing config:", error);
      // Continue with setup if we can't read existing config
    }
  }

  // Select which providers to configure
  const selectedProviders = await multiselect({
    message: "Select AI providers to configure:",
    options: Object.entries(PROVIDER_CONFIGS).map(([key, config]) => ({
      value: key,
      label: `${config.name} - ${config.description}`,
      hint: config.requiresApiKey
        ? "Requires API key"
        : "Local/URL configuration",
    })),
    required: true,
  });

  if (isCancel(selectedProviders)) {
    cancel("Setup cancelled.");
    return;
  }

  if (selectedProviders.length === 0) {
    cancel("No providers selected. Setup cancelled.");
    return;
  }

  // Collect configuration for each selected provider
  const envConfig: Record<string, string> = {};

  for (const providerKey of selectedProviders) {
    const config = PROVIDER_CONFIGS[providerKey];
    if (!config) continue;

    logger.info(`\n${bold(cyan(`Configuring ${config.name}...`))}`);

    const providerEnvConfig = await promptForProviderConfig(
      providerKey,
      config,
      existingConfig.env || {},
    );

    if (providerEnvConfig === null) {
      cancel("Setup cancelled.");
      return;
    }

    Object.assign(envConfig, providerEnvConfig);
  }

  // Confirm configuration
  logger.info(`\n${bold("Configuration Summary:")}`);
  Object.entries(envConfig).forEach(([key, value]) => {
    const displayValue = maskSensitiveValue(key, value);
    logger.info(`  ${green("✓")} ${key}: ${displayValue}`);
  });

  const shouldSave = await confirm({
    message: "Save this configuration?",
    initialValue: true,
  });

  if (isCancel(shouldSave) || !shouldSave) {
    cancel("Configuration not saved.");
    return;
  }

  // Validate configuration before saving
  const s = spinner();
  s.start("Validating configuration...");

  let allValid = true;
  for (const providerKey of selectedProviders) {
    const isValid = await validateProviderConfig(providerKey, envConfig);
    if (!isValid) {
      allValid = false;
      break;
    }
  }

  if (!allValid) {
    s.stop("Configuration validation failed");
    cancel(
      "Configuration contains errors. Please check your settings and try again.",
    );
    return;
  }

  s.start("Saving configuration...");

  try {
    // Merge with existing config, preserving non-env fields
    const finalConfig = {
      ...existingConfig,
      env: {
        ...(existingConfig.env || {}),
        ...envConfig,
      },
    };

    await updateGlobalConfig(finalConfig);
    s.stop("Configuration saved successfully!");

    process.env = { ...process.env, ...finalConfig.env };

    outro(
      `${bold(green("🎉 Setup complete!"))}

Your AI provider configuration has been saved to your global config.
You can now use ${bold(cyan("chara dev"))} to start development with Chara Codes.

${bold("Configuration precedence:")}
• Environment variables take precedence over saved config
• Project-specific settings override global settings

${bold("Next steps:")}
• Run ${cyan("chara dev")} in your project directory
• Configure your project-specific settings in ${cyan(getPathToGlobalConfig())}

${bold("Need help?")} Check the documentation or run ${cyan("chara --help")}`,
    );
  } catch (error) {
    s.stop("Failed to save configuration");
    logger.error("Error saving configuration:", error);
    throw error;
  }
}
