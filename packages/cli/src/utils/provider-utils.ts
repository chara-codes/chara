import { logger } from "@chara-codes/logger";
import { green, yellow } from "picocolors";
import type { ProviderConfig } from "../config/provider-configs";
import { PROVIDER_CONFIGS } from "../config/provider-configs";
import { isCancel, text } from "./prompts";

export async function promptForProviderConfig(
  _providerKey: string,
  config: ProviderConfig,
  existingConfig: Record<string, string> = {}
): Promise<Record<string, string> | null> {
  const envConfig: Record<string, string> = {};

  if (config.requiresApiKey) {
    // Check if environment variable already exists
    const envValue = process.env[config.envKey];
    const currentValue = existingConfig[config.envKey] || envValue || "";

    // Show help URL if available
    if (config.helpUrl) {
      logger.info(
        `${yellow("ℹ")} Get your ${config.name} API key: ${config.helpUrl}`
      );
    }

    // Special handling for gemini-cli provider
    if (_providerKey === "gemini-cli") {
      logger.info(
        `${yellow("ℹ")} Gemini CLI supports two authentication methods:`
      );
      logger.info(`  1. API Key (recommended): Set GEMINI_API_KEY`);
      logger.info(
        `  2. OAuth (fallback): Run 'npm install -g @google/gemini-cli && gemini' for setup`
      );
      logger.info(
        `  ${yellow(
          "→"
        )} API key authentication will be tried first, OAuth as fallback`
      );
    }

    // Show if using environment variable
    if (envValue && !existingConfig[config.envKey]) {
      logger.info(
        `${green("✓")} Found ${config.envKey} in environment variables`
      );
    }

    const apiKey = await text({
      message:
        _providerKey === "gemini-cli"
          ? `Enter your ${config.name} API key (leave empty to use OAuth fallback):`
          : `Enter your ${config.name} API key:`,
      placeholder:
        _providerKey === "gemini-cli"
          ? "Your Google AI Studio API key or leave empty"
          : "sk-...",
      defaultValue: currentValue,
      validate: (value) => {
        // Allow empty for gemini-cli (OAuth fallback)
        if (
          _providerKey === "gemini-cli" &&
          (!value || value.trim().length === 0)
        ) {
          return undefined; // Valid - will use OAuth fallback
        }
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

    // Only set the API key if provided, for gemini-cli allow empty (OAuth fallback)
    if (apiKey && (apiKey as string).trim().length > 0) {
      envConfig[config.envKey] = apiKey as string;
    } else if (_providerKey === "gemini-cli") {
      logger.info(
        `${yellow(
          "ℹ"
        )} No API key provided for Gemini CLI - will use OAuth authentication as fallback`
      );
      logger.info(
        `  Make sure you have authenticated with: npm install -g @google/gemini-cli && gemini`
      );
      // Set a placeholder value to indicate gemini-cli is configured for OAuth
      envConfig[config.envKey] = "OAUTH_FALLBACK";
    } else {
      envConfig[config.envKey] = apiKey as string;
    }
  } else {
    // For providers that don't require API keys (like Ollama, LMStudio)
    const envValue = process.env[config.envKey];
    const currentValue =
      existingConfig[config.envKey] || envValue || config.defaultValue || "";

    // Show if using environment variable
    if (envValue && !existingConfig[config.envKey]) {
      logger.info(
        `${green("✓")} Found ${config.envKey} in environment variables`
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
  envConfig: Record<string, string>
): Promise<boolean> {
  const config = PROVIDER_CONFIGS[providerKey];

  if (!config) {
    logger.error(`Unknown provider: ${providerKey}`);
    return false;
  }

  try {
    if (config.requiresApiKey) {
      const apiKey = envConfig[config.envKey];
      // Special case for gemini-cli: API key is optional (OAuth fallback available)
      if (providerKey === "gemini-cli") {
        if (
          !apiKey ||
          apiKey.trim().length === 0 ||
          apiKey === "OAUTH_FALLBACK"
        ) {
          logger.info(
            `${config.name} will use OAuth authentication (no API key provided)`
          );
          return true; // Valid - will use OAuth fallback
        }
      } else if (!apiKey || apiKey.trim().length === 0) {
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
  envConfig: Record<string, string>
): string[] {
  return Object.keys(PROVIDER_CONFIGS).filter((providerKey) => {
    const config = PROVIDER_CONFIGS[providerKey];
    // Special case for gemini-cli: treat OAUTH_FALLBACK as configured
    if (
      providerKey === "gemini-cli" &&
      envConfig[config.envKey] === "OAUTH_FALLBACK"
    ) {
      return true;
    }
    return (
      envConfig[config.envKey] ||
      config.additionalEnvKeys?.some((key) => envConfig[key])
    );
  });
}

export function maskSensitiveValue(key: string, value: string): string {
  // Special case for gemini-cli OAuth fallback
  if (value === "OAUTH_FALLBACK") {
    return "OAuth (CLI authenticated)";
  }
  return key.includes("KEY") ? "***" + value.slice(-4) : value;
}
