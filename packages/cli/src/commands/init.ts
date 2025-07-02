import { logger } from "@chara/logger";
import {
  cancel,
  confirm,
  intro,
  isCancel,
  multiselect,
  outro,
  spinner,
  text,
} from "@clack/prompts";
import { bold, cyan, green, yellow } from "picocolors";
import type { CommandModule } from "yargs";
import {
  existsGlobalConfig,
  getPathToGlobalConfig,
  readGlobalConfig,
  updateGlobalConfig,
} from "../utils/global-config";

interface InitCommandArgs {
  force?: boolean;
  verbose?: boolean;
  show?: boolean;
  reset?: boolean;
}

// Provider configuration mapping based on the provider-configs.ts
const PROVIDER_CONFIGS = {
  openai: {
    name: "OpenAI",
    envKey: "OPENAI_API_KEY",
    description: "OpenAI GPT models (GPT-4, GPT-3.5, etc.)",
    requiresApiKey: true,
    helpUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    name: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
    description: "Anthropic Claude models (Claude-3, Claude-2, etc.)",
    requiresApiKey: true,
    helpUrl: "https://console.anthropic.com/",
  },
  google: {
    name: "Google",
    envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    description: "Google Gemini models",
    requiresApiKey: true,
    helpUrl: "https://aistudio.google.com/app/apikey",
  },
  deepseek: {
    name: "DeepSeek",
    envKey: "DEEPSEEK_API_KEY",
    description: "DeepSeek AI models",
    requiresApiKey: true,
    helpUrl: "https://platform.deepseek.com/api_keys",
  },
  openrouter: {
    name: "OpenRouter",
    envKey: "OPEN_ROUTER_API_KEY",
    description: "OpenRouter (access to multiple models)",
    requiresApiKey: true,
    helpUrl: "https://openrouter.ai/keys",
  },
  ollama: {
    name: "Ollama",
    envKey: "OLLAMA_API_BASE_URL",
    description: "Local Ollama models",
    requiresApiKey: false,
    defaultValue: "http://127.0.0.1:11434/api",
    helpUrl: "https://ollama.com/download",
  },
  lmstudio: {
    name: "LMStudio",
    envKey: "LMSTUDIO_API_BASE_URL",
    description: "LMStudio local models",
    requiresApiKey: false,
    defaultValue: "http://localhost:1234/v1",
    helpUrl: "https://lmstudio.ai/",
  },
  dial: {
    name: "DIAL",
    envKey: "DIAL_API_KEY",
    description: "DIAL (Distributed AI Layer)",
    requiresApiKey: true,
    additionalEnvKeys: ["DIAL_API_BASE_URL"],
    helpUrl: "https://epam-rail.com/dial_api",
  },
};

async function promptForProviderConfig(
  providerKey: string,
  config: any,
  existingConfig: any = {},
) {
  const envConfig: Record<string, string> = {};

  if (config.requiresApiKey) {
    // Check if environment variable already exists
    const envValue = process.env[config.envKey];
    const currentValue = existingConfig[config.envKey] || envValue || "";

    // Show help URL if available
    if (config.helpUrl) {
      logger.info(
        `${yellow("ℹ")} Get your ${config.name} API key: ${config.helpUrl}`,
      );
    }

    // Show if using environment variable
    if (envValue && !existingConfig[config.envKey]) {
      logger.info(
        `${green("✓")} Found ${config.envKey} in environment variables`,
      );
    }

    const apiKey = await text({
      message: `Enter your ${config.name} API key:`,
      placeholder: "sk-...",
      defaultValue: currentValue,
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return `${config.name} API key is required`;
        }
        if (value.trim().length < 10) {
          return `${config.name} API key seems too short`;
        }
        return undefined;
      },
    });

    if (isCancel(apiKey)) {
      return null;
    }

    envConfig[config.envKey] = apiKey as string;
  } else {
    // For providers that don't require API keys (like Ollama, LMStudio)
    const envValue = process.env[config.envKey];
    const currentValue =
      existingConfig[config.envKey] || envValue || config.defaultValue || "";

    // Show if using environment variable
    if (envValue && !existingConfig[config.envKey]) {
      logger.info(
        `${green("✓")} Found ${config.envKey} in environment variables`,
      );
    }

    const baseUrl = await text({
      message: `Enter the base URL for ${config.name}:`,
      placeholder: config.defaultValue || "",
      defaultValue: currentValue,
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return `Base URL for ${config.name} is required`;
        }
        try {
          new URL(value);
          return undefined;
        } catch {
          return "Please enter a valid URL";
        }
      },
    });

    if (isCancel(baseUrl)) {
      return null;
    }

    envConfig[config.envKey] = baseUrl as string;
  }

  // Handle additional environment variables (like DIAL_API_BASE_URL)
  if (config.additionalEnvKeys) {
    for (const envKey of config.additionalEnvKeys) {
      const envValue = process.env[envKey];
      const currentValue = existingConfig[envKey] || envValue || "";

      // Show if using environment variable
      if (envValue && !existingConfig[envKey]) {
        logger.info(`${green("✓")} Found ${envKey} in environment variables`);
      }

      const value = await text({
        message: `Enter ${envKey.replace(/_/g, " ").toLowerCase()}:`,
        placeholder: envKey.includes("URL") ? "https://..." : envKey,
        defaultValue: currentValue,
        validate: (value) => {
          if (!value || value.trim().length === 0) {
            return `${envKey} is required for ${config.name}`;
          }
          if (envKey.includes("URL")) {
            try {
              new URL(value);
              return undefined;
            } catch {
              return "Please enter a valid URL";
            }
          }
          return undefined;
        },
      });

      if (isCancel(value)) {
        return null;
      }

      envConfig[envKey] = value as string;
    }
  }

  return envConfig;
}

async function validateProviderConfig(
  providerKey: string,
  envConfig: Record<string, string>,
): Promise<boolean> {
  const config = PROVIDER_CONFIGS[providerKey as keyof typeof PROVIDER_CONFIGS];

  try {
    if (config.requiresApiKey) {
      const apiKey = envConfig[config.envKey];
      if (!apiKey || apiKey.trim().length === 0) {
        logger.error(`Missing API key for ${config.name}`);
        return false;
      }
    } else {
      const baseUrl = envConfig[config.envKey];
      if (!baseUrl || baseUrl.trim().length === 0) {
        logger.error(`Missing base URL for ${config.name}`);
        return false;
      }

      // Validate URL format
      try {
        new URL(baseUrl);
      } catch {
        logger.error(`Invalid URL format for ${config.name}: ${baseUrl}`);
        return false;
      }
    }

    // Validate additional environment variables
    if (config.additionalEnvKeys) {
      for (const envKey of config.additionalEnvKeys) {
        const value = envConfig[envKey];
        if (!value || value.trim().length === 0) {
          logger.error(`Missing ${envKey} for ${config.name}`);
          return false;
        }

        if (envKey.includes("URL")) {
          try {
            new URL(value);
          } catch {
            logger.error(`Invalid URL format for ${envKey}: ${value}`);
            return false;
          }
        }
      }
    }

    return true;
  } catch (error) {
    logger.error(`Validation failed for ${config.name}:`, error);
    return false;
  }
}

export const initCommand: CommandModule<{}, InitCommandArgs> = {
  command: "init",
  describe: "Initialize Chara configuration with AI provider settings",
  builder: (yargs) =>
    yargs
      .option("force", {
        describe: "Force initialization even if config exists",
        type: "boolean",
        default: false,
        alias: "f",
      })
      .option("verbose", {
        describe: "Enable verbose output",
        type: "boolean",
        default: false,
        alias: "v",
      })
      .option("show", {
        describe: "Show current configuration and exit",
        type: "boolean",
        default: false,
        alias: "s",
      })
      .option("reset", {
        describe: "Reset/clear all configuration",
        type: "boolean",
        default: false,
        alias: "r",
      }),
  handler: async (argv) => {
    if (argv.verbose) {
      logger.setLevel("debug");
    }

    try {
      // Handle reset configuration option first
      if (argv.reset) {
        intro(bold(cyan("🔄 Reset Chara Configuration")));

        const configExists = await existsGlobalConfig();
        if (!configExists) {
          logger.info("No configuration found to reset.");
          return;
        }

        const shouldReset = await confirm({
          message:
            "Are you sure you want to reset all configuration? This action cannot be undone.",
          initialValue: false,
        });

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
          process.exit(1);
        }
        return;
      }

      // Handle show configuration option
      if (argv.show) {
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
            const displayValue = key.includes("KEY")
              ? "***" + (value as string).slice(-4)
              : value;
            logger.info(`  ${green("✓")} ${key}: ${displayValue}`);
          });

          // Show which providers are configured
          const configuredProviders = Object.keys(PROVIDER_CONFIGS).filter(
            (providerKey) => {
              const config =
                PROVIDER_CONFIGS[providerKey as keyof typeof PROVIDER_CONFIGS];
              return (
                envConfig[config.envKey] ||
                (config.additionalEnvKeys &&
                  config.additionalEnvKeys.some((key) => envConfig[key]))
              );
            },
          );

          if (configuredProviders.length > 0) {
            logger.info("\n" + bold("Configured Providers:"));
            configuredProviders.forEach((providerKey) => {
              const config =
                PROVIDER_CONFIGS[providerKey as keyof typeof PROVIDER_CONFIGS];
              logger.info(`  ${green("✓")} ${config.name}`);
            });
          }

          outro("Configuration displayed successfully!");
          process.exit(0);
        } catch (error) {
          logger.error("Error reading configuration:", error);
          process.exit(1);
        }
      }

      intro(bold(cyan("🚀 Welcome to Chara Codes Setup!")));

      // Check if config already exists
      const configExists = await existsGlobalConfig();
      let existingConfig: any = {};

      if (configExists && !argv.force) {
        try {
          existingConfig = await readGlobalConfig();

          const shouldContinue = await confirm({
            message: "Configuration already exists. Do you want to update it?",
            initialValue: false,
          });

          if (isCancel(shouldContinue) || !shouldContinue) {
            cancel("Setup cancelled.");
            process.exit(0);
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
        process.exit(0);
      }

      if (selectedProviders.length === 0) {
        cancel("No providers selected. Setup cancelled.");
        process.exit(0);
      }

      // Collect configuration for each selected provider
      const envConfig: Record<string, string> = {};

      for (const providerKey of selectedProviders) {
        const config =
          PROVIDER_CONFIGS[providerKey as keyof typeof PROVIDER_CONFIGS];

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
        const displayValue = key.includes("KEY")
          ? "***" + value.slice(-4)
          : value;
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
        process.exit(0);
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
        process.exit(0);
      } catch (error) {
        s.stop("Failed to save configuration");
        logger.error("Error saving configuration:", error);
        process.exit(1);
      }
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        logger.error("Setup failed:", (error as Error).message);
      } else {
        logger.error("Setup failed:", error);
      }
      process.exit(1);
    }
  },
};
