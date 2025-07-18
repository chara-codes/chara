import type { Server as BunServer } from "bun";
import type { ServerWebSocket } from "bun";
import { logger } from "@chara-codes/logger";
import type {
  ClientData,
  ClientMap,
  ServerConfig,
} from "../types/server.types";
import { handleHttpRequest } from "./handlers/http-handler";
import { handleConnection } from "./handlers/connection-handler";
import { handleOpen, handleMessage, handleClose } from "./handlers";

/**
 * Tunnel Server that manages WebSocket connections and HTTP tunneling
 */
export class TunnelServer {
  private server: BunServer | null = null;
  private clients: ClientMap = new Map();
  private config: ServerConfig;

  /**
   * Creates a new TunnelServer instance
   * @param config Server configuration
   */
  constructor(config: ServerConfig) {
    this.config = config;
  }

  /**
   * Starts the tunnel server
   * @returns The Bun server instance
   */
  public start(): BunServer {
    const { port, domain, controlDomain } = this.config;

    logger.debug(`Starting tunnel server on port ${port}`);
    logger.debug(`Root domain: ${domain}`);
    logger.debug(`Control domain: ${controlDomain}`);
    logger.debug(
      `Server configuration: ${JSON.stringify(this.config, null, 2)}`
    );

    if (this.config.replacements && this.config.replacements.length > 0) {
      logger.debug(
        `Text replacements configured: ${this.config.replacements.length} patterns`
      );
      this.config.replacements.forEach((replacement, index) => {
        logger.debug(
          `  ${index + 1}: ${replacement.pattern} → ${replacement.replacement}`
        );
      });
    }

    this.server = Bun.serve({
      port,
      hostname: "0.0.0.0",
      fetch: (req) => {
        const url = new URL(req.url);
        const path = url.pathname;

        if (path === "/_chara/connect") {
          return handleConnection(req, this.server!, this.config);
        }

        return handleHttpRequest(req, this.clients, this.config.controlDomain);
      },

      websocket: {
        open: (ws) => {
          const typedWs = ws as ServerWebSocket<ClientData>;
          handleOpen(typedWs, this.clients, this.config);
        },
        message: (ws, message) => {
          const typedWs = ws as ServerWebSocket<ClientData>;
          handleMessage(typedWs, message, this.clients, this.config);
        },
        close: (ws) => {
          const typedWs = ws as ServerWebSocket<ClientData>;
          handleClose(typedWs, this.clients);
        },
      },
    });

    logger.server(`Server running at ${this.server.url}`);
    return this.server;
  }

  /**
   * Gets the underlying Bun server instance
   * @returns The Bun server instance or null if not started
   */
  public getServer(): BunServer | null {
    return this.server;
  }

  /**
   * Gets the number of connected clients
   * @returns The number of connected clients
   */
  public getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Checks if a client is connected with the specified subdomain
   * @param subdomain The subdomain to check
   * @returns True if a client is connected with the subdomain, false otherwise
   */
  public hasClient(subdomain: string): boolean {
    return this.clients.has(subdomain);
  }

  /**
   * Gets the full list of active subdomains
   * @returns Array of active subdomains
   */
  public getActiveSubdomains(): string[] {
    return Array.from(this.clients.keys());
  }
}
