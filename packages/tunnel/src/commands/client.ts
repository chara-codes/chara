import type { CommandModule } from "yargs";
import { logger, LogLevel } from "@chara/logger";
import { TunnelClient } from "../client";
import type {
  RouteReply,
  RouteRequest,
  TunnelClientOptions,
} from "../types/client.types";
import { black, bold, gray, white } from "picocolors";

interface ClientCommandArgs extends TunnelClientOptions {}

export const clientCommand: CommandModule<{}, ClientCommandArgs> = {
  command: "client",
  describe: "Start a tunnel client",
  builder: (yargs) =>
    yargs
      .option("port", {
        alias: "p",
        type: "number",
        description: "Local port to forward",
        default: 3000,
      })
      .option("host", {
        alias: "h",
        type: "string",
        description: "Local host to forward",
        default: "localhost",
      })
      .option("remoteHost", {
        alias: "r",
        type: "string",
        description: "Remote tunnel server host",
        default: "tunnel.chara-ai.dev",
      })
      .option("secure", {
        alias: "s",
        type: "boolean",
        description: "Use secure WebSocket connection (wss://)",
        default: true,
      })
      .option("subdomain", {
        alias: "d",
        type: "string",
        description: "Desired subdomain",
      })
      .option("debug", {
        alias: "D",
        type: "boolean",
        description: "Enable debug logging",
        default: false,
      }),
  handler: async (argv) => {
    const { port, host, remoteHost, secure, subdomain, debug } = argv;

    logger.setLevel(debug ? LogLevel.DEBUG : LogLevel.INFO);

    const client = new TunnelClient({
      port,
      host,
      remoteHost,
      secure,
      subdomain,
    });

    client.route({
      method: "GET",
      url: "/_test/:id*",
      handler: function (request: RouteRequest): Promise<any> {
        return Promise.resolve(request);
      },
    });

    client.redirectAll("/openrouter/:path*", {
      url: "https://openrouter.ai/",
      headers: {
        Authorization: "Bearer <OPENROUTER_API_KEY>",
        "Content-Type": "application/json",
      },
    });

    client.on("subdomain_assigned", (params) => {
      const protocol = secure ? "https" : "http";
      const url = `${protocol}://${params.subdomain}`;

      logger.info("");
      logger.info("🚀 Tunnel successfully established!");
      logger.info("");
      logger.info(`🌐 URL: ${white(bold(url))}`);
      logger.info("");
      logger.info(`📡 Forwarding: http://${host}:${port} → ${url}`);
      logger.info("");
      logger.info("⌨️  Press Ctrl+C to stop the tunnel");
      logger.info("");
    });

    try {
      client.connect();

      // Keep the process running and handle graceful shutdown
      process.on("SIGINT", () => {
        logger.info("Disconnecting tunnel client...");
        client.disconnect();
        process.exit(0);
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Failed to connect: ${errorMessage}`);
      process.exit(1);
    }
  },
};
