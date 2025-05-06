import { createReplacementStream } from "./replacement-stream";
import {
  createCompressionStream,
  prepareHeadersForCompression,
} from "../compression";
import type { ServerConfig } from "../../types/server.types";
import { isTextResponse } from "../../utils/content-type";
import { logger } from "../../utils/logger";

/**
 * Processes a stream with optional text replacements and compression
 *
 * @param stream The original stream to process
 * @param status The HTTP status code
 * @param headers The HTTP response headers
 * @param resolver The function to resolve the pending request
 * @param requestId The request ID for logging purposes
 * @param config Server configuration containing replacements (if needed)
 * @param compressionType The type of compression to apply (if any)
 */
export function processStream(
  stream: ReadableStream<Uint8Array>,
  status: number,
  headers: Headers,
  resolver: (response: Response) => void,
  requestId: string,
  config?: ServerConfig,
  compressionType?: string,
): void {
  let processedStream = stream;
  let responseHeaders = new Headers(headers);

  // Apply text replacements if configured and content type is appropriate
  const shouldApplyReplacements =
    config?.replacements &&
    config.replacements.length > 0 &&
    isTextResponse(responseHeaders);

  if (shouldApplyReplacements) {
    logger.debug(
      `Applying text replacements to response for request ${requestId}`,
    );
    processedStream = createReplacementStream(processedStream, config);
  }

  // Apply compression if requested
  if (compressionType) {
    logger.debug(
      `Applying ${compressionType} compression to response for request ${requestId}`,
    );

    try {
      // Update headers for compression
      responseHeaders = prepareHeadersForCompression(
        responseHeaders,
        compressionType,
      );

      // Apply compression
      processedStream = createCompressionStream(
        processedStream,
        compressionType,
      );

      logger.debug(
        `Successfully applied ${compressionType} compression to response`,
      );
    } catch (error) {
      logger.error(
        `Error applying ${compressionType} compression: ${error}, skipping compression`,
      );
    }
  }

  // Create the final response
  resolver(
    new Response(processedStream, {
      status,
      headers: responseHeaders,
    }),
  );
}
