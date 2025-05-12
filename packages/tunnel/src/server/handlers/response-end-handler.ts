import type { ServerWebSocket } from "bun";
import { logger } from "@chara/logger";
import type { ClientData, ServerConfig } from "../../types/server.types";
import { isTextResponse } from "../../utils/content-type";
import { getCompressionType } from "../compression";
import { processStream } from "../streams";

/**
 * Handles HTTP response completion from client
 * Finalizes the response stream and applies any needed text replacements
 * and/or compression
 *
 * @param ws The WebSocket connection
 * @param data The parsed message data containing response information
 * @param config Server configuration
 */
export function handleHttpResponseEnd(
  ws: ServerWebSocket<ClientData>,
  data: any,
  config: ServerConfig,
): void {
  const requestId = data.id;
  const pendingRequest = ws.data.requests?.get(requestId);

  if (!pendingRequest) {
    logger.warning(
      `Received response end for unknown request ID: ${requestId}`,
    );
    return;
  }

  const { resolver } = pendingRequest;
  const responseHeaders =
    pendingRequest.headers || new Headers(data.headers || {});
  const status = pendingRequest.status || data.status || 200;

  // Check if this is a text/html response that should have replacements applied
  const shouldApplyReplacements =
    config.replacements &&
    config.replacements.length > 0 &&
    isTextResponse(responseHeaders);

  logger.debug("Response Headers:", responseHeaders);
  // Check if response should be compressed
  const compressionType = getCompressionType(responseHeaders);

  // For streaming responses, use the stream as the body
  if (pendingRequest.stream && pendingRequest.streamController) {
    // If there's any final data in the http_response message, add it to the stream
    if (data.body) {
      try {
        const finalChunk =
          typeof data.body === "string"
            ? new TextEncoder().encode(data.body)
            : new Uint8Array(data.body);

        pendingRequest.streamController.enqueue(finalChunk);
      } catch (error) {
        logger.error(`Error adding final chunk to stream: ${error}`);
      }
    }

    // Close the stream controller to signal end of data
    pendingRequest.streamController.close();
    logger.debug(`Closed stream for request ${requestId}`);

    // Process the stream with appropriate transformations
    processStream(
      pendingRequest.stream,
      status,
      responseHeaders,
      resolver,
      requestId,
      shouldApplyReplacements ? config : undefined,
      compressionType,
    );
  } else {
    // No stream available - create response directly from body if present
    const body = data.body || "";
    resolver(
      new Response(body, {
        status,
        headers: responseHeaders,
      }),
    );
  }

  // Clean up the pending request
  ws.data.requests?.delete(requestId);
  logger.debug(`Completed request ${requestId}`);
}