import { promises as fs } from "node:fs";
import { initialize } from "@chara-codes/agents";
import { logger } from "@chara-codes/logger";
import { existsGlobalConfig, readGlobalConfig } from "@chara-codes/settings";
import { NodeFS } from "@chara-codes/shared";
import { Project } from "@netlify/build-info";
import { bold, cyan, green } from "picocolors";
import { intro, outro, spinner } from "../utils/prompts.js";
import type { InitializeConfigActionOptions } from "./types.js";

export async function initializeConfigAction(
  options: InitializeConfigActionOptions = {}
): Promise<void> {
  if (options.verbose) {
    logger.setLevel("debug");
  }

  intro(bold(cyan("🛠️ Initialize Chara Development Environment")));

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
      `Failed to initialize providers: ${(error as Error).message}`
    );
  }

  // Detect development command using @netlify/build-info
  s.start("Detecting project development command...");

  let devCommand = "npx live-server --no-browser {path}".replace(
    "{path}",
    process.cwd()
  ); // Default fallback

  try {
    const fsImpl = new NodeFS();
    const project = new Project(fsImpl, process.cwd())
      .setEnvironment(process.env)
      .setNodeVersion(process.version);

    const buildSettings = await project.getBuildSettings();

    if (buildSettings.length > 0 && buildSettings[0].devCommand) {
      devCommand = buildSettings[0].devCommand;
      s.stop(`Development command detected: ${devCommand}`);

      if (options.verbose) {
        logger.debug(`Detected dev command from build settings: ${devCommand}`);
      }
    } else {
      s.stop("No development command detected, using fallback");

      if (options.verbose) {
        logger.debug("No dev command found in build settings, using fallback");
      }
    }
  } catch (error) {
    s.stop("Failed to detect development command, using fallback");
    logger.error("Error detecting development command:", error);

    if (options.verbose) {
      logger.debug(
        "Falling back to default dev command due to detection error"
      );
    }
  }

  // Check for existing .mcp.json or create a minimal one
  s.start("Setting up MCP configuration...");

  try {
    const mcpConfigFile = ".mcp.json";
    const mcpConfigExists = await fs
      .access(mcpConfigFile)
      .then(() => true)
      .catch(() => false);

    if (!mcpConfigExists) {
      const defaultMcpConfig = {
        mcpServers: {},
      };

      await fs.writeFile(
        mcpConfigFile,
        JSON.stringify(defaultMcpConfig, null, 2)
      );
      s.stop("Created default .mcp.json configuration");

      if (options.verbose) {
        logger.debug(`Created ${mcpConfigFile} with empty mcpServers`);
      }
    } else {
      s.stop("Existing .mcp.json configuration found");

      if (options.verbose) {
        logger.debug(`Found existing ${mcpConfigFile}`);
      }
    }

    outro(
      `${bold(green("✅ Development environment initialized!"))}

Development command: ${bold(cyan(devCommand))}
MCP configuration: ${bold(cyan(mcpConfigFile))}
Model: ${bold(cyan(selectedModel))}

${bold("Next steps:")}
• Run ${cyan("chara dev")} to start development
• Configure MCP servers in ${cyan(mcpConfigFile)} if needed
• Your environment will automatically use the detected dev command

${bold("Need help?")} Run ${cyan("chara --help")} for more options`
    );
  } catch (error) {
    s.stop("Failed to setup MCP configuration");
    logger.error("Error setting up MCP configuration:", error);
    throw new Error(
      `Failed to setup MCP configuration: ${(error as Error).message}`
    );
  }
}
