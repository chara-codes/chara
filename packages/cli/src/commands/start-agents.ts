import { logger } from "@chara/logger";
import { bold, cyan, green } from "picocolors";
import type { CommandModule } from "yargs";
import type { StartAgentsActionOptions } from "../actions";
import { startAgentsAction, stopAgentsAction } from "../actions";
import { cancel, confirm, intro, isCancel, outro } from "../utils/prompts";

interface StartAgentsCommandArgs {
  port?: number;
  mcp?: boolean;
  runner?: boolean;
  websocket?: boolean;
  verbose?: boolean;
}

export const startAgentsCommand: CommandModule<
  Record<string, unknown>,
  StartAgentsCommandArgs
> = {
  command: "start-agents",
  describe: "Start Chara agents server",
  builder: (yargs) =>
    yargs
      .option("port", {
        describe: "Port to start server on",
        type: "number",
        default: 3031,
        alias: "p",
      })
      .option("mcp", {
        describe: "Enable MCP (Model Context Protocol) support",
        type: "boolean",
        default: false,
      })
      .option("runner", {
        describe:
          "Enable runner functionality (code execution and process management)",
        type: "boolean",
        default: false,
      })
      .option("websocket", {
        describe: "Enable WebSocket support",
        type: "boolean",
        default: false,
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

    intro(bold(cyan("🚀 Start Chara Agents Server")));

    // Show feature options
    const enabledFeatures = [];
    if (argv.mcp) enabledFeatures.push("MCP (Model Context Protocol)");
    if (argv.runner) enabledFeatures.push("Runner (Code execution)");
    if (argv.websocket)
      enabledFeatures.push("WebSocket (Real-time communication)");

    if (enabledFeatures.length > 0) {
      logger.info(`\nEnabled features: ${enabledFeatures.join(", ")}`);
    }

    // Confirm server start
    const shouldStart = await confirm({
      message: "Start the Chara agents server?",
      initialValue: true,
    });

    if (isCancel(shouldStart) || !shouldStart) {
      cancel("Server start cancelled.");
      return;
    }

    let server: any;
    try {
      // Use startAgentsAction directly with non-silent mode for interactive behavior
      const result = await startAgentsAction({
        port: argv.port,
        mcp: argv.mcp,
        runner: argv.runner,
        websocket: argv.websocket,
        silent: false,
        verbose: argv.verbose,
      });
      server = result.server;

      const featuresText =
        enabledFeatures.length > 0
          ? `\nEnabled features: ${enabledFeatures.join(", ")}`
          : "";

      outro(
        `${bold(green("✅ Server started successfully!"))}

The Chara agents server is now running on port ${result.port}.${featuresText}
Press Ctrl+C to stop the server.`,
      );

      // Keep the process running
      process.on("SIGINT", async () => {
        console.log("\nShutting down server...");
        await stopAgentsAction({ server, silent: false });
        process.exit(0);
      });

      // Keep the process alive
      await new Promise(() => {});
    } catch (error) {
      logger.error("Failed to start server:", error);

      if (server) {
        await stopAgentsAction({ server, silent: true });
      }

      if (error && typeof error === "object" && "message" in error) {
        logger.error("Command failed:", (error as Error).message);
      } else {
        logger.error("Command failed:", error);
      }
      process.exit(1);
    }
  },
};
