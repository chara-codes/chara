import { logger } from "@chara-codes/logger";
import { bold, cyan, green } from "picocolors";
import { TunnelClient } from "../../../tunnel/src/client";
import { intro, outro, spinner } from "../utils/prompts";
import type {
  StartTunnelClientActionOptions,
  StopTunnelClientActionOptions,
} from "./types";

// Define event data interfaces
interface SubdomainAssignedData {
  subdomain: string;
}

interface HttpRequestData {
  method: string;
  path: string;
  id: string;
  headers: Record<string, string>;
  body: string | null;
}

interface HttpResponseStartData {
  status: number;
  id: string;
  headers: Record<string, string>;
}

interface HttpErrorData {
  error: string;
}

interface CloseData {
  code: number;
  reason: string;
}

/**
 * Start a tunnel client to connect local development server to the internet
 *
 * @param options Configuration options for the tunnel client
 * @param options.port Local port to forward (default: 3000)
 * @param options.host Local host to forward (default: "localhost")
 * @param options.remoteHost Remote tunnel server host (default: "tunnel.chara-ai.dev")
 * @param options.secure Use secure WebSocket connection (default: true)
 * @param options.subdomain Desired subdomain (random if not specified)
 * @param options.silent Suppress UI output for programmatic use
 * @param options.verbose Enable detailed logging
 *
 * @returns Promise resolving to client instance and connection details
 *
 * @example
 * ```typescript
 * // Start tunnel client with default configuration
 * const { client, subdomain } = await startTunnelClientAction({
 *   port: 3000,
 *   host: "localhost",
 *   remoteHost: "tunnel.chara-ai.dev",
 *   verbose: true
 * });
 *
 * // Start tunnel client with custom subdomain
 * const { client } = await startTunnelClientAction({
 *   port: 8080,
 *   subdomain: "my-app",
 *   remoteHost: "tunnel.chara-ai.dev"
 * });
 * ```
 */
export async function startTunnelClientAction(
  options: StartTunnelClientActionOptions = {}
): Promise<{
  client: TunnelClient;
  port: number;
  host: string;
  remoteHost: string;
  subdomain?: string;
}> {
  if (options.verbose) {
    logger.setLevel("debug");
  }

  if (!options.silent) {
    intro(bold(cyan("🚀 Starting Tunnel Client")));
  }

  const port = options.port || 3000;
  const host = options.host || "localhost";
  const remoteHost = options.remoteHost || "tunnel.chara-ai.dev";
  const secure = options.secure ?? true;
  const subdomain = options.subdomain;

  const s = spinner();
  if (!options.silent) {
    s.start("Connecting to tunnel server...");
  }

  if (options.verbose) {
    logger.debug(`Starting tunnel client with configuration:`);
    logger.debug(`  Local Port: ${port}`);
    logger.debug(`  Local Host: ${host}`);
    logger.debug(`  Remote Host: ${remoteHost}`);
    logger.debug(`  Secure: ${secure}`);
    logger.debug(`  Subdomain: ${subdomain || "random"}`);
  }

  try {
    const client = new TunnelClient({
      port,
      host,
      remoteHost,
      secure,
      subdomain,
    });

    // Set up event handlers
    let assignedSubdomain: string | undefined = subdomain;
    let connectionEstablished = false;

    const connectionPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error("Connection timeout - failed to connect to tunnel server")
        );
      }, 30000); // 30 second timeout

      client.on("open", () => {
        connectionEstablished = true;
        if (options.verbose) {
          logger.debug("WebSocket connection established");
        }
      });

      client.on("subdomain_assigned", (data: SubdomainAssignedData) => {
        assignedSubdomain = data.subdomain;
        if (options.verbose) {
          logger.debug(`Subdomain assigned: ${assignedSubdomain}`);
        }
        clearTimeout(timeout);
        resolve();
      });

      client.on("error", (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      });

      client.on("close", (data: CloseData) => {
        if (!connectionEstablished) {
          clearTimeout(timeout);
          reject(new Error(`Connection closed: ${data.code} - ${data.reason}`));
        }
      });

      client.on("http_request", (message: HttpRequestData) => {
        if (options.verbose) {
          logger.debug(
            `HTTP request received: ${message.method} ${message.path}`
          );
        }
      });

      client.on("http_response_start", (data: HttpResponseStartData) => {
        if (options.verbose) {
          logger.debug(`HTTP response started: ${data.status}`);
        }
      });

      client.on("http_error", (data: HttpErrorData) => {
        logger.error(`HTTP error: ${data.error}`);
      });
    });

    // Connect to the tunnel server
    client.connect();

    // Wait for connection to be established
    await connectionPromise;

    if (!options.silent) {
      s.stop("Connected to tunnel server!");

      const tunnelUrl = `${secure ? "https" : "http"}://${assignedSubdomain}`;
      const localUrl = `http://${host}:${port}`;

      outro(
        `${bold(green("✅ Tunnel established!"))}

${bold("Connection Details:")}
• Local Server: ${bold(cyan(localUrl))}
• Tunnel URL: ${bold(cyan(tunnelUrl))}
• Remote Host: ${bold(cyan(remoteHost))}
• Secure: ${bold(cyan(secure.toString()))}

${bold("Your local server is now available at:")}
  ${bold(green(tunnelUrl))}

${bold("Press Ctrl+C to disconnect")}`
      );
    }

    logger.info(`Tunnel client connected to ${remoteHost}`);
    logger.info(`Local server: http://${host}:${port}`);
    logger.info(
      `Tunnel URL: ${secure ? "https" : "http"}://${assignedSubdomain}`
    );

    if (options.verbose) {
      logger.debug("Tunnel client started successfully");
    }

    return {
      client,
      port,
      host,
      remoteHost,
      subdomain: assignedSubdomain,
    };
  } catch (error) {
    if (!options.silent) {
      s.stop("Failed to connect to tunnel server");
    }
    logger.error("Error starting tunnel client:", error);
    throw error;
  }
}

/**
 * Stop a tunnel client instance
 *
 * @param options Configuration options for stopping the client
 * @param options.client Client instance to stop
 * @param options.silent Suppress UI output
 * @param options.verbose Enable detailed logging
 * @param options.force Force disconnect without graceful shutdown
 *
 * @example
 * ```typescript
 * await stopTunnelClientAction({
 *   client,
 *   silent: false,
 *   force: false
 * });
 * ```
 */
export async function stopTunnelClientAction(
  options: StopTunnelClientActionOptions = {}
): Promise<void> {
  if (options.verbose) {
    logger.setLevel("debug");
  }

  if (!options.silent) {
    const s = spinner();
    s.start("Disconnecting from tunnel server...");

    try {
      if (options.client && typeof options.client.disconnect === "function") {
        if (options.verbose) {
          logger.debug("Disconnecting tunnel client...");
        }

        if (options.force) {
          // Force disconnect immediately
          options.client.disconnect();
        } else {
          // Graceful disconnect - give time for any pending requests
          await new Promise((resolve) => setTimeout(resolve, 1000));
          options.client.disconnect();
        }
      } else if (options.client) {
        logger.debug(
          "Client object provided but does not have a disconnect method"
        );
      }

      s.stop("Disconnected from tunnel server");

      if (options.verbose) {
        logger.debug("Tunnel client disconnected successfully");
      }
    } catch (error) {
      s.stop("Error disconnecting from tunnel server");
      logger.error("Error disconnecting tunnel client:", error);
      throw error;
    }
  } else {
    // Silent mode - just disconnect
    if (options.client && typeof options.client.disconnect === "function") {
      try {
        if (options.force) {
          options.client.disconnect();
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          options.client.disconnect();
        }
      } catch (error) {
        logger.error("Error disconnecting tunnel client:", error);
        throw error;
      }
    } else if (options.client) {
      logger.debug(
        "Client object provided but does not have a disconnect method"
      );
    }
  }
}
