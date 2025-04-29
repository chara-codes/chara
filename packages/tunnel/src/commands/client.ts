import type { CommandModule } from "yargs";
import { logger } from "../utils/logger";
import { TunnelClient } from "../client";

interface ClientCommandArgs {
  port: number;
  host: string;
  remoteHost: string;
  secure: boolean;
  subdomain?: string;
}

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
        default: "control.localhost:1337",
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
      }),
  handler: async (argv) => {
    const { port, host, remoteHost, secure, subdomain } = argv;

    const client = new TunnelClient({
      port,
      host,
      remoteHost,
      secure,
      subdomain,
    });

    try {
      await client.connect();

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
