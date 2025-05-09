import type { ServerWebSocket } from "bun";
import { logger } from "@chara/logger";
import { allocateSubdomain } from "../../utils/subdomain";
import type { ClientData, ClientMap, ServerConfig } from "../../types/server.types";

/**
 * Handles a new WebSocket connection, assigning a subdomain to the client
 * @param ws The WebSocket connection
 * @param clients Map of active clients by subdomain
 * @param config Server configuration
 */
export function handleOpen(
  ws: ServerWebSocket<ClientData>,
  clients: ClientMap,
  config: ServerConfig,
): void {
  logger.debug(`New WebSocket connection opened: ${ws.remoteAddress}`);

  // Only handle clients connecting to the control channel
  if (ws.data?.type !== "control") {
    logger.debug(`Ignoring non-control connection from ${ws.remoteAddress}`);
    return;
  }

  // Initialize the requests map for this client
  ws.data.requests = new Map();

  // Check if client requested a specific subdomain
  const desiredSubdomain = ws.data.desiredSubdomain;

  // Allocate a subdomain for the client
  const { subdomain, usedRequestedSubdomain } = allocateSubdomain(
    desiredSubdomain,
    clients
  );
  
  logger.debug(
    `Allocated subdomain: ${subdomain}, requested: ${desiredSubdomain || "none"}, used requested: ${usedRequestedSubdomain}`,
  );

  // Create the full domain name and store it in the client data
  const fullDomain = `${subdomain}.${config.domain}`;
  ws.data.subdomain = fullDomain;

  // Store client connection mapped to subdomain
  clients.set(subdomain, ws);

  // Send the assigned subdomain to the client
  ws.send(
    JSON.stringify({
      type: "subdomain_assigned",
      subdomain: fullDomain,
      requested: usedRequestedSubdomain,
    }),
  );

  logger.info(`Assigned subdomain ${fullDomain} to client`);
}

/**
 * Handles WebSocket close event, cleaning up resources and pending requests
 * @param ws The WebSocket connection that's closing
 * @param clients Map of active clients by subdomain
 */
export function handleClose(
  ws: ServerWebSocket<ClientData>,
  clients: ClientMap,
): void {
  logger.debug(`WebSocket connection closing: ${ws.remoteAddress}`);

  // Log cleanup information
  if (ws.data?.subdomain) {
    logger.debug(`Cleaning up resources for subdomain: ${ws.data.subdomain}`);
  }

  // Handle pending requests if any
  if (ws.data?.requests?.size) {
    logger.debug(
      `Client has ${ws.data.requests.size} pending requests to clean up`,
    );
    
    // Resolve all pending requests with a client disconnected message
    for (const [requestId, pendingRequest] of ws.data.requests.entries()) {
      logger.debug(`Resolving pending request ${requestId} due to client disconnect`);
      
      // Close the stream controller if it exists
      if (pendingRequest.streamController) {
        try {
          pendingRequest.streamController.close();
        } catch (e) {
          logger.error(`Error closing stream controller: ${e}`);
        }
      }

      // Resolve the request with an error response
      pendingRequest.resolver(
        new Response("Client disconnected", { status: 503 })
      );
    }
  }

  // Remove the client from the clients map if it has a subdomain
  if (ws.data?.subdomain) {
    const [subdomain = "", domain = ""] = ws.data.subdomain.split(".", 2);
    clients.delete(subdomain);
    logger.info(`Removed subdomain ${subdomain}.${domain}`);
  }
  
  logger.info("WebSocket connection closed");
}