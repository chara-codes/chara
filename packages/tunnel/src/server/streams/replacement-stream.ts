import type { ServerConfig } from "../../types/server.types";
import { logger } from "@chara-codes/logger";
import { applyReplacements } from "../../utils/replacements";

/**
 * Creates a transform stream that applies text replacements to chunks of data
 *
 * @param stream The original stream
 * @param config Server configuration containing replacements
 * @returns A new stream with text replacements applied
 */
export function createReplacementStream(
  stream: ReadableStream<Uint8Array>,
  config: ServerConfig,
): ReadableStream<Uint8Array> {
  if (!config.replacements || config.replacements.length === 0) {
    return stream; // No replacements needed, return original stream
  }

  // Create text decoder/encoder for handling the conversion
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  // Buffer to handle potential pattern matches across chunk boundaries
  let buffer = "";
  // Maximum buffer size to maintain (should be larger than your longest possible pattern)
  const MAX_BUFFER_SIZE = 1024;

  // Create a transform stream that applies replacements on the fly
  const replacementTransform = new TransformStream({
    transform(chunk: Uint8Array, controller) {
      try {
        // Decode the chunk and add to buffer
        const text = decoder.decode(chunk, { stream: true });
        buffer += text;

        // Only process complete chunks, keeping a buffer for patterns that might cross boundaries
        const safeToProcessLength =
          buffer.length > MAX_BUFFER_SIZE ? buffer.length - MAX_BUFFER_SIZE : 0;

        if (safeToProcessLength > 0) {
          // Process the safe portion of the buffer
          const textToProcess = buffer.substring(0, safeToProcessLength);
          const modifiedText = applyReplacements(
            textToProcess,
            config.replacements!,
          );

          // Send the processed text
          controller.enqueue(encoder.encode(modifiedText));

          // Keep the remainder in the buffer
          buffer = buffer.substring(safeToProcessLength);
        }
      } catch (error) {
        logger.error(`Error in replacement transform stream: ${error}`);
        controller.error(error);
      }
    },
    flush(controller) {
      try {
        // Process any remaining text in the buffer
        if (buffer.length > 0) {
          const modifiedText = applyReplacements(buffer, config.replacements!);
          controller.enqueue(encoder.encode(modifiedText));
        }
      } catch (error) {
        logger.error(`Error in replacement transform stream flush: ${error}`);
        controller.error(error);
      }
    },
  });

  // Pipe the original stream through the replacement transform
  return stream.pipeThrough(replacementTransform);
}
