import { logger } from "@chara-codes/logger";
import type { CommandModule } from "yargs";
import type {
  DefaultModelActionOptions,
  InitActionOptions,
  ResetActionOptions,
  ShowActionOptions,
  StartAgentsActionOptions,
  StopAgentsActionOptions,
} from "../actions";
import { ActionFactory, startAgentsAction, stopAgentsAction } from "../actions";

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

      // Start server for model selection
      let server: any;
      try {
        const result = await startAgentsAction({
          port: 3031,
          mcp: false,
          runner: false,
          websocket: false,
          silent: true,
          verbose: argv.verbose,
        });
        server = result.server;

        // Execute default-model action with server URL
        await ActionFactory.execute<DefaultModelActionOptions>(
          "default-model",
          {
            port: 3031,
            serverUrl: `http://localhost:${result.port}`,
            verbose: argv.verbose,
          }
        );
      } finally {
        // Clean up server
        if (server) {
          await stopAgentsAction({
            server,
            silent: true,
            verbose: false,
          });
        }
      }
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
