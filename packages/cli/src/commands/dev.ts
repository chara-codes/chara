import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { logger } from "@chara-codes/logger";
import { existsGlobalConfig, readGlobalConfig } from "@chara-codes/settings";
import { bold, cyan, green, yellow } from "picocolors";
import type { CommandModule } from "yargs";
import { ActionFactory } from "../actions";
import { intro, outro } from "../utils/prompts";

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
        logger.warning(
          `No global configuration found. Running initialization...`
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
          logger.warning(
            `No default model found in global configuration. Setting up default model...`
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
        logger.warning(
          `No local configuration found. Initializing project configuration...`
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
            `MCP servers: ${Object.keys(config.mcpServers).join(", ")}`
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

      // Step 14: Start web applications that should connect to server and agents
      const pathToRoot = dirname(process.execPath);
      const indexWeb = Bun.file(`${pathToRoot}/web/index.html`);
      const indexWidget = Bun.file(`${pathToRoot}/widget/index.html`);
      const hasWeb = await indexWeb.exists();
      const hasWidget = await indexWidget.exists();

      const serveStatic = await ActionFactory.execute("serve-static", {
        verbose: argv.verbose,
        port: 1237,
        directories: {
          "/": hasWeb
            ? `${pathToRoot}/web/`
            : resolve(`${__dirname}../../../../web/dist/`),
          "/widget": hasWidget
            ? `${pathToRoot}/widget/`
            : resolve(`${__dirname}../../../../widget/dist/`),
        },
        silent: true,
      });

      // Step 15: Run tunnel server (needed for widget mode)
      const tunnel = await ActionFactory.execute("start-tunnel-server", {
        verbose: argv.verbose,
        port: 1337,
        domain: "localhost",
        controlDomain: "127.0.0.2",
        silent: true,
      });

      // Success message
      logger.success("✓ Chara development environment is ready!");

      if (hasMcpServers) {
        console.log(
          `  • WebSocket Events: ${cyan(
            `ws://localhost:${serverResult.port}/events`
          )}`
        );
      }

      if (argv.verbose) {
        logger.info(`\n${bold("🔧 Server Configuration:")}`);
        logger.info(
          `  • API endpoint: ${bold(
            `http://localhost:${serverResult.port}/trpc`
          )}`
        );
        logger.info(
          `  • MCP enabled: ${hasMcpServers ? green("Yes") : yellow("No")}`
        );
        logger.info(
          `  • WebSocket enabled: ${
            hasMcpServers ? green("Yes") : yellow("No")
          }`
        );
        logger.info(`  • Runner enabled: ${green("Yes")}`);

        if (hasMcpServers) {
          logger.info(
            `  • WebSocket endpoint: ${bold(
              `ws://localhost:${serverResult.port}/events`
            )}`
          );
        }
      }

      logger.info(
        `  • Project directory: ${cyan(projectDir || process.cwd())}`
      );

      if (hasMcpServers && clientsList.length > 0) {
        logger.info(
          `  • Active MCP clients: ${clientsList
            .map((client: any) => cyan(client.name || "Unknown"))
            .join(", ")}`
        );
      }

      // Print server information
      logger.server(`${bold("🖥️  Running Servers:")}`);
      logger.server(
        `  • Main Server: ${cyan(`http://localhost:${serverResult.port}`)}`
      );
      logger.server(
        `  • Agents Server: ${cyan(`http://localhost:${agentsResult.port}`)}`
      );
      logger.server(
        `  • Chara Web : ${cyan(`http://localhost:${serveStatic.port}`)}`
      );
      logger.server(
        `  • Chara Widget: ${cyan(
          `http://localhost:${serveStatic.port}/widget/`
        )}`
      );

      outro(
        `${bold(green("🎉 Development environment ready!"))}. ${cyan(
          `Press ${bold("Ctrl+C")} to stop`
        )}`
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

          console.log("✓ Serve static stopped successfully");
          await ActionFactory.execute("stop-serve-static", {
            verbose: argv.verbose,
            server: serveStatic.server,
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
