import type { Server } from "bun";
import type { ServerConfig } from "../../types/server.types";
import { logger } from "../../utils/logger";

/**
 * Handles WebSocket connection upgrade attempts
 *
 * @param req The incoming request
 * @param server The Bun server instance
 * @param config Server configuration
 * @returns A Response object
 */
export function handleConnection(
  req: Request,
  server: Server,
  config: ServerConfig,
): Response {
  const url = new URL(req.url);
  const hostname = url.hostname;
  const host = req.headers.get("host") || "";
  const desiredSubdomain = url.searchParams.get("subdomain");
  const { controlDomain } = config;

  // Check if this is a connection to the control domain
  if (host.startsWith(controlDomain) || hostname === controlDomain) {
    logger.debug(
      `WebSocket connection attempt from ${hostname} to control domain ${controlDomain}`,
    );
    logger.debug(
      `Host header: ${host}, Desired subdomain: ${desiredSubdomain || "none"}`,
    );

    // Upgrade the request to WebSocket if it's a WebSocket request
    if (
      server.upgrade(req, {
        data: { type: "control", desiredSubdomain: desiredSubdomain },
      })
    ) {
      logger.debug(
        `Successfully upgraded connection to WebSocket for client requesting subdomain: ${desiredSubdomain || "random"}`,
      );
      return new Response("", { status: 101 });
    }

    logger.debug(`Failed to upgrade connection to WebSocket`);

    return new Response(
      "Chara Codes Control Server is running. Connect using WebSocket.",
      {
        status: 200,
      },
    );
  }

  return new Response("Not Found", { status: 404 });
}
