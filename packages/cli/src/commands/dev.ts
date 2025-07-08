import { logger } from "@apk/logger";
import { bold, cyan, green, yellow } from "picocolors";
import type { CommandModule } from "yargs";
import { ActionFactory } from "../actions";
import { intro, outro } from "../utils/prompts";
import { existsGlobalConfig, readGlobalConfig } from "@apk/settings";
import { existsSync } from "node:fs";
import { join } from "node:path";

interface DevCommandArgs {
  projectDir?: string;
  verbose?: boolean;
  trace?: boolean;
}

export const devCommand: CommandModule<
  Record<string, unknown>,
  DevCommandArgs
> = {
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

      // Step 3: Check if global config exists, if not run init
      const globalConfigExists = await existsGlobalConfig();
      if (!globalConfigExists) {
        logger.info(
          `${yellow("⚠️")} No global configuration found. Running initialization...`,
        );
        await ActionFactory.execute("init", {
          verbose: argv.verbose,
        });
      }

      // Step 4: Check if default model exists in global config
      let globalConfig: any = {};
      try {
        globalConfig = await readGlobalConfig();
        if (!globalConfig.defaultModel) {
          logger.info(
            `${yellow("⚠️")} No default model found in global configuration. Setting up default model...`,
          );

          // We need to start a temporary server to get available models
          const tempServer = await ActionFactory.execute("start-agents", {
            verbose: argv.verbose,
            silent: true,
            port: 3031,
            mcpEnabled: false,
            websocketEnabled: false,
          });

          try {
            await ActionFactory.execute("default-model", {
              verbose: argv.verbose,
              serverUrl: "http://localhost:3031",
            });
          } finally {
            // Stop the temporary server
            await ActionFactory.execute("stop-agents", {
              verbose: argv.verbose,
              server: tempServer.server,
              silent: true,
            });
          }
        }
      } catch (error) {
        logger.error("Error reading global configuration:", error);
        throw error;
      }

      // Step 5: Check if local/project config exists
      const localConfigPath = join(projectDir || process.cwd(), ".chara.json");
      if (!existsSync(localConfigPath)) {
        logger.info(
          `${yellow("⚠️")} No local configuration found. Initializing project configuration...`,
        );
        await ActionFactory.execute("initialize-config", {
          verbose: argv.verbose,
          configFile: ".chara.json",
        });
      }

      // Step 6: Load local configuration
      const config = await ActionFactory.execute("load-config", {
        verbose: argv.verbose,
      });

      // Step 7: Check if local config has MCP servers
      const hasMcpServers =
        config?.mcpServers && Object.keys(config.mcpServers).length > 0;

      if (argv.verbose) {
        logger.debug(`MCP servers available: ${hasMcpServers ? "Yes" : "No"}`);
        if (hasMcpServers) {
          logger.debug(
            `MCP servers: ${Object.keys(config.mcpServers).join(", ")}`,
          );
        }
      }

      // Step 8: Start server with appropriate configuration
      const serverResult = await ActionFactory.execute("start-server", {
        verbose: argv.verbose,
        port: 3030,
        mcpEnabled: hasMcpServers,
        websocketEnabled: hasMcpServers, // Only enable WebSocket if MCP is available
        silent: false,
      });

      // Step 9: Connect to MCP servers if available
      let clientsList: any[] = [];
      if (hasMcpServers) {
        clientsList = await ActionFactory.execute("connect-mcp", {
          verbose: argv.verbose,
          mcpServers: config.mcpServers,
        });
      }

      // Step 10: Connect to server events via WebSocket (if enabled)
      if (hasMcpServers) {
        await ActionFactory.execute("connect-events", {
          verbose: argv.verbose,
        });
      }

      // Step 11: Initialize API client
      if (hasMcpServers) {
        await ActionFactory.execute("init-api", {
          verbose: argv.verbose,
        });
      }

      // Step 12: Initialize MCP client (if MCP servers are available)
      if (hasMcpServers) {
        await ActionFactory.execute("init-mcp-client", {
          verbose: argv.verbose,
        });
      }

      // Step 13: Start agents with appropriate configuration
      const agentsResult = await ActionFactory.execute("start-agents", {
        verbose: argv.verbose,
        port: 3031,
        mcp: hasMcpServers,
        runner: true,
        websocket: true,
        silent: false,
      });

      // Success message
      logger.success("✓ Chara development environment is ready!");

      // Print server information
      console.log(`\n${bold("🖥️  Running Servers:")}`);
      console.log(
        `  • Main Server: ${cyan(`http://localhost:${serverResult.port}`)}`,
      );
      console.log(
        `  • Agents Server: ${cyan(`http://localhost:${agentsResult.port}`)}`,
      );

      if (hasMcpServers) {
        console.log(
          `  • WebSocket Events: ${cyan(`ws://localhost:${serverResult.port}/events`)}`,
        );
      }

      if (argv.verbose) {
        console.log(`\n${bold("🔧 Server Configuration:")}`);
        console.log(
          `  • API endpoint: ${bold(`http://localhost:${serverResult.port}/trpc`)}`,
        );
        console.log(
          `  • MCP enabled: ${hasMcpServers ? green("Yes") : yellow("No")}`,
        );
        console.log(
          `  • WebSocket enabled: ${hasMcpServers ? green("Yes") : yellow("No")}`,
        );
        console.log(`  • Runner enabled: ${green("Yes")}`);

        if (hasMcpServers) {
          console.log(
            `  • WebSocket endpoint: ${bold(`ws://localhost:${serverResult.port}/events`)}`,
          );
        }
      }

      console.log(`\n${bold("📊 Connected Services:")}`);
      console.log(
        `  • MCP servers: ${hasMcpServers ? green(clientsList.length.toString()) : yellow("0")}`,
      );
      console.log(
        `  • Project directory: ${cyan(projectDir || process.cwd())}`,
      );

      if (hasMcpServers && clientsList.length > 0) {
        console.log(
          `  • Active MCP clients: ${clientsList.map((client: any) => cyan(client.name || "Unknown")).join(", ")}`,
        );
      }

      logger.info(`\nPress ${bold("Ctrl+C")} to stop\n`);

      outro(
        `${bold(green("🎉 Development environment ready!"))}

${bold("Available endpoints:")}
• Main API: ${cyan(`http://localhost:${serverResult.port}/trpc`)}
• Agents API: ${cyan(`http://localhost:${agentsResult.port}`)}
${hasMcpServers ? `• WebSocket: ${cyan(`ws://localhost:${serverResult.port}/events`)}` : ""}

${bold("Features enabled:")}
• Code execution: ${green("✓")}
• MCP support: ${hasMcpServers ? green("✓") : yellow("✗")}
• WebSocket events: ${hasMcpServers ? green("✓") : yellow("✗")}

Ready to receive instructions and execute code changes!`,
      );

      // Keep the process running
      process.on("SIGINT", async () => {
        console.log("\n\n🛑 Shutting down development environment...");

        try {
          await ActionFactory.execute("stop-agents", {
            verbose: argv.verbose,
            server: agentsResult.server,
            silent: true,
          });

          await ActionFactory.execute("stop-server", {
            verbose: argv.verbose,
            server: serverResult.server,
            silent: true,
          });

          console.log("✓ Development environment stopped successfully");
        } catch (error) {
          logger.error("Error during shutdown:", error);
        }

        process.exit(0);
      });
    } catch (error) {
      logger.error("Failed to initialize development environment:");
      logger.error((error as Error).message);
      process.exit(1);
    }
  },
};
