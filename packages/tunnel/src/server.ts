import type { Server } from "bun";
import { logger } from "@chara/logger";
import { 
  createTunnelServer 
} from "./server/index";
import type { ServerConfig } from "./types/server.types";

/**
 * Starts a tunnel server with the given configuration
 * 
 * @param config Server configuration including port, domain, and control domain
 * @returns The Bun server instance
 */
export function startServer(config: ServerConfig): Server {
  logger.debug(`Starting tunnel server with config: ${JSON.stringify(config, null, 2)}`);
  
  // Create and start the tunnel server
  const tunnelServer = createTunnelServer(config);
  const server = tunnelServer.start();
  
  return server;
}