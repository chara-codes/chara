import { logger } from "@apk/logger";
import { intro, outro, spinner } from "../utils/prompts";
import { bold, cyan, green } from "picocolors";
import { existsGlobalConfig, readGlobalConfig } from "@apk/settings";
import { initializeCharaConfig, initialize } from "@apk/agents";
import type { InitializeConfigActionOptions } from "./types";

export async function initializeConfigAction(
  options: InitializeConfigActionOptions = {},
): Promise<void> {
  if (options.verbose) {
    logger.setLevel("debug");
  }

  intro(bold(cyan("🛠️ Initialize Chara Configuration")));

  const s = spinner();
  s.start("Reading configuration...");

  let selectedModel = "deepseek:::deepseek-chat"; // Default fallback

  try {
    // Check if global config exists
    const configExists = await existsGlobalConfig();

    if (configExists) {
      if (options.verbose) {
        logger.debug("Global configuration found, reading default model...");
      }

      const config = await readGlobalConfig();
      const defaultModel = config.defaultModel as string | undefined;

      if (defaultModel) {
        selectedModel = defaultModel;
        s.stop(`Using default model from global config: ${defaultModel}`);

        if (options.verbose) {
          logger.debug(`Selected model from global config: ${defaultModel}`);
        }
      } else {
        s.stop("No default model in global config, using fallback");

        if (options.verbose) {
          logger.debug("No defaultModel found in global config");
        }
      }
    } else {
      s.stop("No global configuration found, using fallback model");

      if (options.verbose) {
        logger.debug("Global configuration does not exist");
      }
    }
  } catch (error) {
    s.stop("Failed to read global configuration, using fallback model");
    logger.error("Error reading global configuration:", error);

    if (options.verbose) {
      logger.debug("Falling back to default model due to config read error");
    }
  }

  // Initialize providers first
  s.start("Initializing providers...");

  try {
    await initialize();
    s.stop("Providers initialized successfully");

    if (options.verbose) {
      logger.debug("Providers initialization completed");
    }
  } catch (error) {
    s.stop("Failed to initialize providers");
    logger.error("Error initializing providers:", error);
    throw new Error(
      `Failed to initialize providers: ${(error as Error).message}`,
    );
  }

  // Initialize Chara configuration
  s.start("Initializing Chara configuration...");

  try {
    const charaConfigFile = options.configFile || ".chara.json";

    if (options.verbose) {
      logger.debug(`Initializing config file: ${charaConfigFile}`);
      logger.debug(`Using model: ${selectedModel}`);
    }

    const result = await initializeCharaConfig(charaConfigFile, selectedModel);

    s.stop("Chara configuration initialized successfully!");

    if (options.verbose) {
      logger.debug("Configuration result:", result);
    }

    outro(
      `${bold(green("✅ Configuration initialized!"))}

Configuration file: ${bold(cyan(charaConfigFile))}
Model used: ${bold(cyan(selectedModel))}

${bold("Next steps:")}
• Your Chara configuration is ready to use
• Run ${cyan("chara dev")} to start development
• Modify ${cyan(charaConfigFile)} to customize your setup

${bold("Need help?")} Run ${cyan("chara --help")} for more options`,
    );
  } catch (error) {
    s.stop("Failed to initialize Chara configuration");
    logger.error("Error initializing configuration:", error);
    throw new Error(
      `Failed to initialize Chara configuration: ${(error as Error).message}`,
    );
  }
}
