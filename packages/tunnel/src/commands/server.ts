import * as path from "path";
import type { CommandModule } from "yargs";
import { startServer } from "../server";
import type { ServerConfig } from "../types/server.types";
import { logger, LogLevel } from "@chara-codes/logger";

interface ServerCommandArgs extends ServerConfig {
  configFile?: string;
}

export const serverCommand: CommandModule<{}, ServerCommandArgs> = {
  command: "server",
  describe:
    "Start Chara Codes Tunnel, expose the localhost to public, add a chara codes panel.",
  builder: (yargs) =>
    yargs
      .option("port", {
        alias: "p",
        type: "number",
        description: "Port to listen on",
        default: 1337,
      })
      .option("domain", {
        type: "string",
        description: "Root domain for generating subdomains",
        default: "chara-ai.dev",
      })
      .option("controlDomain", {
        type: "string",
        description: "Control domain for websocket connections",
        default: "tunnel.chara-ai.dev",
      })
      .option("debug", {
        alias: "D",
        type: "boolean",
        description: "Enable debug logging",
        default: false,
      })
      .option("configFile", {
        alias: "c",
        type: "string",
        description: "Path to a JSON configuration file for replacements",
      }),
  handler: async (argv) => {
    logger.setLevel(argv.debug ? LogLevel.DEBUG : LogLevel.INFO);

    let replacements = [];
    if (argv.configFile) {
      try {
        const configFilePath = path.resolve(argv.configFile);
        const file = Bun.file(configFilePath);
        const configFileJson = await file.json();

        if (
          configFileJson.replacements &&
          Array.isArray(configFileJson.replacements)
        ) {
          replacements = configFileJson.replacements;
          logger.info(
            `Loaded replacements from config file: ${configFilePath}`,
          );
        } else {
          logger.warning(
            "Config file does not contain a valid replacements array",
          );
        }
      } catch (error) {
        logger.error(
          `Failed to read or parse config file: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
      }
    }

    const config: ServerConfig = {
      port: argv.port,
      domain: argv.domain,
      controlDomain: argv.controlDomain,
      replacements,
    };

    startServer(config);
  },
};
