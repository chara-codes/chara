import { logger } from "@chara/logger";
import type { CommandModule } from "yargs";
import type {
  DefaultModelActionOptions,
  InitActionOptions,
  ResetActionOptions,
  ShowActionOptions,
} from "../actions";
import { ActionFactory } from "../actions";

interface InitCommandArgs {
  force?: boolean;
  verbose?: boolean;
  show?: boolean;
  reset?: boolean;
}

export const initCommand: CommandModule<
  Record<string, unknown>,
  InitCommandArgs
> = {
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
        await ActionFactory.execute<ResetActionOptions>("reset", {
          verbose: argv.verbose,
        });
        return;
      }

      // Handle show configuration option
      if (argv.show) {
        await ActionFactory.execute<ShowActionOptions>("show", {
          verbose: argv.verbose,
        });
        return;
      }

      // Handle main init action
      await ActionFactory.execute<InitActionOptions>("init", {
        force: argv.force,
        verbose: argv.verbose,
      });
      await ActionFactory.execute<DefaultModelActionOptions>("default-model", {
        verbose: argv.verbose,
      });
      return;
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        logger.error("Command failed:", (error as Error).message);
      } else {
        logger.error("Command failed:", error);
      }
      process.exit(1);
    }
  },
};
