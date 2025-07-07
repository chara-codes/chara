import { logger } from "@chara/logger";
import type { CommandModule } from "yargs";
import type {
  DefaultModelActionOptions,
  StartAgentsActionOptions,
  StopAgentsActionOptions,
} from "../actions";
import { ActionFactory, startAgentsAction, stopAgentsAction } from "../actions";

interface DefaultModelCommandArgs {
  port?: number;
  verbose?: boolean;
}

export const defaultModelCommand: CommandModule<
  Record<string, unknown>,
  DefaultModelCommandArgs
> = {
  command: "default-model",
  describe: "Set default AI model for Chara Codes",
  builder: (yargs) =>
    yargs
      .option("port", {
        describe: "Port to start server on",
        type: "number",
        default: 3031,
        alias: "p",
      })
      .option("verbose", {
        describe: "Enable verbose output",
        type: "boolean",
        default: false,
        alias: "v",
      }),
  handler: async (argv) => {
    if (argv.verbose) {
      logger.setLevel("debug");
    }

    let server: any;
    try {
      // Start server for model fetching using startAgentsAction directly
      const result = await startAgentsAction({
        port: argv.port,
        mcp: false,
        runner: false,
        websocket: false,
        silent: true,
        verbose: argv.verbose,
      });
      server = result.server;

      // Execute default-model action with server URL
      await ActionFactory.execute<DefaultModelActionOptions>("default-model", {
        port: argv.port,
        serverUrl: `http://localhost:${result.port}`,
        verbose: argv.verbose,
      });
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        logger.error("Command failed:", (error as Error).message);
      } else {
        logger.error("Command failed:", error);
      }
      process.exit(1);
    } finally {
      // Clean up server using stopAgentsAction directly
      if (server) {
        await stopAgentsAction({
          server,
          silent: true,
          verbose: false,
        });
      }
    }
  },
};
