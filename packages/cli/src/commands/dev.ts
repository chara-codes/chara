import type { CommandModule } from "yargs";
import { ActionFactory } from "../actions";
import { intro, outro } from "../utils/prompts";
import { bold, cyan, green } from "picocolors";
import { logger } from "@chara/logger";

interface DevCommandArgs {
  projectDir?: string;
  verbose?: boolean;
  trace?: boolean;
}

export const devCommand: CommandModule<{}, DevCommandArgs> = {
  command: "dev",
  describe: "Start development with Chara Codes",
  builder: (yargs) =>
    yargs
      .option("projectDir", {
        describe: "Project root directory",
        type: "string",
        default: process.cwd(),
        alias: "p",
      })
      .option("verbose", {
        describe: "Enable debug logs",
        type: "boolean",
        default: false,
        alias: "v",
      })
      .option("trace", {
        describe: "Enable trace logs (includes debug logs)",
        type: "boolean",
        default: false,
        alias: "t",
      }),
  handler: async (argv) => {
    intro(bold(cyan("\n🚀 Starting development with Chara Codes...\n")));

    try {
      // Step 1: Setup logging
      await ActionFactory.execute("setup-logging", {
        verbose: argv.verbose,
        trace: argv.trace,
      });

      // Step 2: Setup project directory
      const projectDir = await ActionFactory.execute("setup-project", {
        verbose: argv.verbose,
        projectDir: argv.projectDir,
      });

      // Step 3: Load configuration
      const config = await ActionFactory.execute("load-config", {
        verbose: argv.verbose,
      });

      // Step 4: Connect to MCP servers
      const clientsList = await ActionFactory.execute("connect-mcp", {
        verbose: argv.verbose,
        mcpServers: config?.mcpServers || {},
      });

      // Step 5: Connect to server events via WebSocket
      await ActionFactory.execute("connect-events", {
        verbose: argv.verbose,
      });

      // Step 6: Initialize API client
      await ActionFactory.execute("init-api", {
        verbose: argv.verbose,
      });

      // Step 7: Initialize MCP client
      await ActionFactory.execute("init-mcp-client", {
        verbose: argv.verbose,
      });

      // Success message
      logger.success("✓ Chara development environment is ready!");

      if (argv.verbose) {
        logger.debug(`API endpoint: ${bold("http://localhost:3030/trpc")}`);
        logger.debug(
          `WebSocket endpoint: ${bold("ws://localhost:3030/events")}`,
        );
      }

      logger.info(`Press ${bold("Ctrl+C")} to stop\n`);

      outro(
        `${bold(green("🎉 Development environment ready!"))}

${bold("Available endpoints:")}
• API: ${cyan("http://localhost:3030/trpc")}
• WebSocket: ${cyan("ws://localhost:3030/events")}

${bold("Connected services:")}
• MCP servers: ${Array.isArray(clientsList) ? clientsList.length : 0}
• Project directory: ${cyan(projectDir || process.cwd())}

Ready to receive instructions and execute code changes!`,
      );
    } catch (error) {
      logger.error("Failed to initialize development environment:");
      logger.error((error as Error).message);
      process.exit(1);
    }
  },
};
