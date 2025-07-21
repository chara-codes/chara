import { existsSync } from "node:fs";
import ping from "ping";
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

interface ServerInfo {
  serverResult: any;
  agentsResult: any;
  serveStatic: any;
  tunnel?: any;
  tunnelClient?: any;
  projectDir: string;
  hasMcpServers: boolean;
  clientsList: any[];
  runnerStatus?: string;
  runnerInfo?: any;
  verbose?: boolean;
}

function displayServerSummary(info: ServerInfo) {
  console.clear();
  console.log("\n" + bold(green("🎉 Development environment ready!")));

  console.log("\n" + bold("🖥️  Running Servers:"));
  console.log(
    `  • Backend Server:  ${cyan(`http://localhost:${info.serverResult.port}`)}`
  );
  console.log(
    `  • Agents Server:   ${cyan(`http://localhost:${info.agentsResult.port}`)}`
  );

  // Dev Server (Runner) Information
  const runnerStatus = info.runnerStatus || "inactive";
  const statusColor = runnerStatus === "active" ? green : yellow;
  const statusIcon = runnerStatus === "active" ? "🟢" : "🟡";
  const statusText = statusColor(
    runnerStatus.charAt(0).toUpperCase() + runnerStatus.slice(1)
  );

  if (info.runnerInfo && runnerStatus === "active") {
    console.log(`  • Dev Server:      ${statusIcon} ${statusText}`);
  } else {
    console.log(
      `  • Dev Server:      ${statusIcon} ${statusText} - Waiting for project...`
    );
  }

  if (info.tunnel) {
    console.log(
      `  • Tunnel Server:   ${cyan("http://control.localhost:1337")}`
    );
  }

  console.log("\n" + bold("📁 Project Configuration:"));
  console.log(`  • Directory:       ${cyan(info.projectDir)}`);
  console.log(
    `  • MCP Servers:     ${
      info.hasMcpServers ? green("Enabled") : yellow("Disabled")
    }`
  );

  if (info.hasMcpServers && info.clientsList.length > 0) {
    console.log(
      `  • Active Clients:  ${info.clientsList
        .map((client: any) => cyan(client.name || "Unknown"))
        .join(", ")}`
    );
  }

  if (info.tunnelClient) {
    console.log("\n" + bold("🌐 Tunnel Configuration:"));
    console.log(
      `  • Domain:          ${cyan(`${info.tunnelClient.subdomain}:1337`)}`
    );
    console.log(`  • Control:         ${cyan("control.localhost:1337")}`);
  }

  if (info.runnerInfo) {
    console.log("\n" + bold("⚡ Dev Server Details:"));
    const statusIcon = runnerStatus === "active" ? "🟢" : "🟡";
    const statusColor = runnerStatus === "active" ? green : yellow;
    console.log(
      `  • Status:          ${statusIcon} ${statusColor(
        runnerStatus.charAt(0).toUpperCase() + runnerStatus.slice(1)
      )}`
    );
    console.log(
      `  • URL:             ${cyan(`http://localhost:${info.runnerInfo.port}`)}`
    );
    console.log(
      `  • Command:         ${cyan(info.runnerInfo.command || "Unknown")}`
    );
    console.log(
      `  • Working Dir:     ${cyan(info.runnerInfo.cwd || "Unknown")}`
    );
  }

  if (info.verbose) {
    console.log("\n" + bold("🔧 Additional Info:"));
    console.log(
      `  • API Endpoint:    ${cyan(
        `http://localhost:${info.serverResult.port}/trpc`
      )}`
    );
    console.log(
      `  • WebSocket:       ${
        info.hasMcpServers ? green("Enabled") : yellow("Disabled")
      }`
    );
    console.log(`  • Runner:          ${green("Enabled")}`);
  }

  console.log("\n" + bold("🌟 Start Working with Chara Codes:"));
  console.log(
    `  • Web Interface:   ${bold(
      cyan(`http://localhost:${info.serveStatic.port}`)
    )}`
  );

  if (info.tunnelClient) {
    console.log(
      `  • Chara Widget:    ${bold(
        cyan(`http://${info.tunnelClient.subdomain}:1337`)
      )}`
    );
  }

  console.log(`\n${cyan(`Press ${bold("Ctrl+C")} to stop all servers`)}\n`);
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
      // Progress tracking
      const steps = [
        "Setting up logging",
        "Preparing project directory",
        "Checking configuration",
        "Starting backend server",
        "Starting agents server",
        "Setting up web interface",
        "Configuring tunnel",
      ];
      let currentStep = 0;

      const showProgress = (message: string) => {
        currentStep++;
        if (!argv.verbose) {
          logger.info(`${bold(`[${currentStep}/${steps.length}]`)} ${message}`);
        }
      };

      // Step 1: Setup logging
      showProgress("Setting up logging");
      await ActionFactory.execute("setup-logging", {
        verbose: argv.verbose,
        trace: argv.trace,
      });

      // Step 2: Setup project directory
      showProgress("Preparing project directory");
      const projectDir = await ActionFactory.execute("setup-project", {
        verbose: argv.verbose,
        projectDir: argv.projectDir,
      });

      // Step 3: Check if global config exists, if not run init
      showProgress("Checking configuration");
      const globalConfigExists = await existsGlobalConfig();
      if (!globalConfigExists) {
        if (argv.verbose) {
          logger.warning(
            "No global configuration found. Running initialization..."
          );
        }
        await ActionFactory.execute("init", {
          verbose: argv.verbose,
        });
      }

      // Step 4: Check if default model exists in global config
      let globalConfig: any = {};
      try {
        globalConfig = await readGlobalConfig();
        if (!globalConfig.defaultModel) {
          if (argv.verbose) {
            logger.warning(
              "No default model found in global configuration. Setting up default model..."
            );
          }

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
        if (argv.verbose) {
          logger.warning(
            "No local configuration found. Initializing project configuration..."
          );
        }
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
      showProgress("Starting backend server");
      const serverResult = await ActionFactory.execute("start-server", {
        verbose: argv.verbose,
        port: 3030,
        mcpEnabled: hasMcpServers,
        websocketEnabled: hasMcpServers, // Only enable WebSocket if MCP is available
        silent: !argv.verbose,
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
      showProgress("Starting agents server");
      const agentsResult = await ActionFactory.execute("start-agents", {
        verbose: argv.verbose,
        port: 3031,
        mcp: hasMcpServers,
        runner: true,
        websocket: true,
        silent: !argv.verbose,
      });

      // Step 14: Start web applications that should connect to server and agents
      showProgress("Setting up web interface");
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

      // Step 15: Run widget mode (tunnel server, tunnel client, event listener for the runner)
      showProgress("Configuring tunnel");
      const pingControl = await ping.promise.probe("control.localhost");
      const pingChara = await ping.promise.probe("chara.localhost");

      let tunnelClient: any = null;
      let tunnel: any = null;
      let runnerStatus = "inactive";
      let runnerInfo: any = null;
      if (pingChara.alive && pingControl.alive) {
        const { events } = agentsResult.server;
        tunnel = await ActionFactory.execute("start-tunnel-server", {
          verbose: argv.verbose,
          port: 1337,
          domain: "localhost",
          controlDomain: "control.localhost",
          replacements: [
            {
              pattern: "</body>",
              replacement: `<script type="module" src="http://localhost:1237/widget/main.js"></script><chara-codes></chara-codes></body>`,
            },
          ],
          silent: true,
        });

        events.on(
          "runner:status",
          async ({ proccesId, status, serverInfo }) => {
            runnerStatus = status;
            runnerInfo = serverInfo;

            if (argv.verbose) {
              logger.debug(`Runner status: ${status}`);
            }
            if (status === "active" && tunnel && !tunnelClient) {
              tunnelClient = await ActionFactory.execute(
                "start-tunnel-client",
                {
                  verbose: argv.verbose,
                  port: serverInfo.port,
                  remoteHost: "control.localhost:1337",
                  subdomain: "chara",
                  secure: false,
                  silent: true,
                }
              );

              // Display updated server summary with tunnel client info
              displayServerSummary({
                serverResult,
                agentsResult,
                serveStatic,
                tunnel,
                tunnelClient,
                projectDir: projectDir || process.cwd(),
                hasMcpServers,
                clientsList,
                runnerStatus,
                runnerInfo,
                verbose: argv.verbose,
              });
            } else {
              if (tunnelClient) {
                await ActionFactory.execute("stop-tunnel-client", {
                  client: tunnelClient,
                  force: true,
                  silent: true,
                });
                tunnelClient = null;
              }
            }
          }
        );
      } else {
        if (argv.verbose) {
          logger.warning(
            "Local tunnel domains not configured. Add to /etc/hosts:"
          );
          console.log(bold("127.0.0.1 control.localhost chara.localhost"));
        }
        // Display initial server summary
        displayServerSummary({
          serverResult,
          agentsResult,
          serveStatic,
          tunnel,
          tunnelClient,
          projectDir: projectDir || process.cwd(),
          hasMcpServers,
          clientsList,
          runnerStatus,
          runnerInfo,
          verbose: argv.verbose,
        });
      }

      // Display initial server summary

      // Keep the process running
      process.on("SIGINT", async () => {
        console.log("\n\n🛑 Shutting down development environment...");

        try {
          const shutdownTasks = [];

          if (tunnelClient) {
            shutdownTasks.push(
              ActionFactory.execute("stop-tunnel-client", {
                client: tunnelClient,
                force: true,
                silent: true,
              })
            );
          }

          if (tunnel) {
            shutdownTasks.push(
              ActionFactory.execute("stop-tunnel-server", {
                server: tunnel,
                silent: true,
              })
            );
          }

          shutdownTasks.push(
            ActionFactory.execute("stop-agents", {
              verbose: argv.verbose,
              server: agentsResult.server,
              silent: true,
            })
          );

          shutdownTasks.push(
            ActionFactory.execute("stop-server", {
              verbose: argv.verbose,
              server: serverResult.server,
              silent: true,
            })
          );

          shutdownTasks.push(
            ActionFactory.execute("stop-serve-static", {
              verbose: argv.verbose,
              server: serveStatic.server,
              silent: true,
            })
          );

          await Promise.all(shutdownTasks);
          console.log("✓ Development environment stopped successfully");
        } catch (error) {
          if (argv.verbose) {
            logger.error("Error during shutdown:", error);
          } else {
            console.log("⚠️  Some services may not have stopped cleanly");
          }
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
