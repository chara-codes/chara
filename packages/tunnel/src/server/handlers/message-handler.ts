import type { ServerWebSocket } from "bun";
import { logger } from "@apk/logger";
import { handleHttpResponseStart } from "./response-start-handler.js";
import { handleHttpData } from "./data-handler.js";
import { handleHttpResponseEnd } from "./response-end-handler.js";
import type { ClientData, ClientMap, ServerConfig } from "../index.js";

/**
 * Main entry point for handling WebSocket messages
 * Routes messages to the appropriate handlers based on their type
 *
 * @param ws The WebSocket connection
 * @param message The raw message received from the client
 * @param clients Map of active clients by subdomain
 * @param config Server configuration
 */
export function handleMessage(
  ws: ServerWebSocket<ClientData>,
  message: string | Uint8Array,
  clients: ClientMap,
  config: ServerConfig,
): void {
  try {
    // Parse the message as JSON
    const data = parseMessage(message);
    logger.debug("Received message:", data);

    // Route the message based on its type
    switch (data.type) {
      case "ping":
        handlePing(ws);
        break;

      case "http_response_start":
        if (data.id) {
          handleHttpResponseStart(ws, data);
        }
        break;

      case "http_data":
        if (data.id) {
          handleHttpData(ws, data);
        }
        break;

      case "http_response_end":
        if (data.id) {
          handleHttpResponseEnd(ws, data, config);
        }
        break;

      default:
        logger.warning(`Received unknown message type: ${data.type}`);
        ws.send(
          JSON.stringify({
            type: "error",
            message: `Unknown message type: ${data.type}`,
          }),
        );
    }
  } catch (e) {
    // Handle parsing errors
    logger.error("Error processing message:", e);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Invalid message format",
      }),
    );
  }
}

/**
 * Parse a raw WebSocket message into a JSON object
 *
 * @param message The raw message from the client
 * @returns The parsed message data
 */
function parseMessage(message: string | Uint8Array): any {
  if (typeof message === "string") {
    return JSON.parse(message);
  } else {
    return JSON.parse(new TextDecoder().decode(message));
  }
}

/**
 * Handle a ping message by sending a pong response
 *
 * @param ws The WebSocket connection
 */
function handlePing(ws: ServerWebSocket<ClientData>): void {
  logger.debug("Received ping from client");
  ws.send(JSON.stringify({ type: "pong" }));
}
