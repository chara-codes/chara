import { logger } from "@chara/logger";
import { isCancel, text } from "@clack/prompts";
import { green, yellow } from "picocolors";
import type { ProviderConfig } from "../config/provider-configs";
import { PROVIDER_CONFIGS } from "../config/provider-configs";

export async function promptForProviderConfig(
  _providerKey: string,
  config: ProviderConfig,
  existingConfig: Record<string, string> = {},
): Promise<Record<string, string> | null> {
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

export async function validateProviderConfig(
  providerKey: string,
  envConfig: Record<string, string>,
): Promise<boolean> {
  const config = PROVIDER_CONFIGS[providerKey];

  if (!config) {
    logger.error(`Unknown provider: ${providerKey}`);
    return false;
  }

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

export function getConfiguredProviders(
  envConfig: Record<string, string>,
): string[] {
  return Object.keys(PROVIDER_CONFIGS).filter((providerKey) => {
    const config = PROVIDER_CONFIGS[providerKey];
    return (
      envConfig[config.envKey] ||
      config.additionalEnvKeys?.some((key) => envConfig[key])
    );
  });
}

export function maskSensitiveValue(key: string, value: string): string {
  return key.includes("KEY") ? "***" + value.slice(-4) : value;
}
