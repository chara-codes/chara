import type { ServerWebSocket } from "bun";
import { logger } from "../../utils/logger";
import type { ClientData } from "../types";

/**
 * Handles HTTP response start messages from the client
 * Sets up the initial response parameters (headers, status code)
 * 
 * @param ws The WebSocket connection
 * @param data The parsed message data containing response information
 */
export function handleHttpResponseStart(
  ws: ServerWebSocket<ClientData>,
  data: any
): void {
  const requestId = data.id;
  const pendingRequest = ws.data.requests?.get(requestId);

  if (!pendingRequest) {
    logger.warning(`Received response start for unknown request ID: ${requestId}`);
    return;
  }

  // Set up headers for the response
  pendingRequest.headers = new Headers(data.headers || {});
  
  // Set up status code, with fallbacks
  pendingRequest.status = data.statusCode || pendingRequest.status || 200;
  
  // Log the response setup
  logger.debug(`Setting up streaming response for request ${requestId}`);
  logger.debug(
    `HTTP response starting for request ${requestId}, status: ${pendingRequest.status}`
  );
  logger.debug(
    `Response headers: ${JSON.stringify(
      Object.fromEntries(pendingRequest.headers.entries()), 
      null, 
      2
    )}`
  );
}