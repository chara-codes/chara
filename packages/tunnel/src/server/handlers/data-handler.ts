import type { ServerWebSocket } from "bun";
import { logger } from "@chara/logger";
import type { ClientData } from "../../types/server.types";

/**
 * Handles HTTP data chunks sent from the client over WebSocket
 * Adds the data to the appropriate stream for the pending request
 * 
 * @param ws The WebSocket connection
 * @param data The parsed message data containing the chunk data
 */
export function handleHttpData(
  ws: ServerWebSocket<ClientData>,
  data: any
): void {
  const requestId = data.id;
  const pendingRequest = ws.data.requests?.get(requestId);

  // Check if we have a pending request with a stream controller
  if (!pendingRequest || !pendingRequest.streamController) {
    logger.warning(
      `Received data for unknown or non-streaming request ID: ${requestId}`
    );
    return;
  }

  try {
    // Convert data from binary/base64 format to Uint8Array
    const chunk = typeof data.data === "string"
      ? new Uint8Array(Buffer.from(data.data, "binary"))
      : new Uint8Array(data.data);

    // Add the chunk to the stream
    pendingRequest.streamController.enqueue(chunk);
    
    logger.debug(
      `Added ${chunk.length} bytes to stream for request ${requestId}`
    );
  } catch (error) {
    logger.error(
      `Error processing data chunk for request ${requestId}:`,
      error
    );
  }
}