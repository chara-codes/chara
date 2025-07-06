import { logger } from "@chara/logger";
import type { CommandModule } from "yargs";
import type { InitializeConfigActionOptions } from "../actions";
import { ActionFactory } from "../actions";

interface InitializeConfigCommandArgs {
  configFile?: string;
  verbose?: boolean;
}

export const initializeConfigCommand: CommandModule<
  Record<string, unknown>,
  InitializeConfigCommandArgs
> = {
  command: "initialize-config",
  describe: "Initialize Chara configuration with default model from global config",
  builder: (yargs) =>
    yargs
      .option("config-file", {
        describe: "Path to the Chara configuration file",
        type: "string",
        default: ".chara.json",
        alias: "c",
      })
      .option("verbose", {
        describe: "Enable verbose output",
        type: "boolean",
        default: false,
        alias: "v",
      }),
  handler: async (argv) => {
    try {
      await ActionFactory.execute<InitializeConfigActionOptions>("initialize-config", {
        configFile: argv.configFile,
        verbose: argv.verbose,
      });
    } catch (error) {
      logger.error("Failed to initialize configuration:");
      logger.error((error as Error).message);
      process.exit(1);
    }
  },
};
