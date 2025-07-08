import * as zlib from "zlib";
import { Writable } from "stream";
import { logger } from "@apk/logger";

/**
 * Determines the compression type to use based on Content-Encoding header
 *
 * @param headers The HTTP response headers
 * @returns The compression type to use, or undefined if no compression should be applied
 */
export function getCompressionType(headers: Headers): string | undefined {
  // Check if response is already compressed
  const contentEncoding = headers.get("content-encoding");

  logger.debug("header - content-encoding", contentEncoding);

  if (contentEncoding) {
    return contentEncoding;
  }
  return undefined; // No compression
}

/**
 * Creates a compression stream using Bun's Node.js compatibility layer
 *
 * @param stream The original stream to compress
 * @param compressionType The type of compression to apply ('gzip', 'deflate', or 'br')
 * @returns A compressed ReadableStream
 */
export function createCompressionStream(
  stream: ReadableStream<Uint8Array>,
  compressionType: string,
): ReadableStream<Uint8Array> {
  // Create a new ReadableStream that will emit compressed data
  return new ReadableStream({
    start(controller) {
      // Create the appropriate compression object based on the type
      let compressor: zlib.Gzip | zlib.Deflate | zlib.BrotliCompress;

      if (compressionType === "gzip") {
        compressor = zlib.createGzip();
      } else if (compressionType === "deflate") {
        compressor = zlib.createDeflate();
      } else if (compressionType === "br") {
        compressor = zlib.createBrotliCompress();
      } else {
        throw new Error(`Unsupported compression type: ${compressionType}`);
      }

      // Create a writable stream that feeds into the compressor
      const writableNodeStream = new Writable({
        write(chunk, encoding, callback) {
          compressor.write(chunk, callback);
        },
        final(callback) {
          compressor.end();
          callback();
        },
      });

      // Handle the compressed data coming from the compressor
      compressor.on("data", (chunk) => {
        controller.enqueue(new Uint8Array(chunk));
      });

      compressor.on("end", () => {
        controller.close();
      });

      compressor.on("error", (err) => {
        controller.error(err);
      });

      // Create a reader from the incoming stream
      const reader = stream.getReader();

      // Function to pump data from the reader to the writable stream
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              writableNodeStream.end();
              break;
            }

            // Write the chunk to our writable stream
            const writeResult = writableNodeStream.write(value);

            // Handle backpressure if the write buffer is full
            if (!writeResult) {
              await new Promise((resolve) =>
                writableNodeStream.once("drain", resolve),
              );
            }
          }
        } catch (err) {
          controller.error(err);
        }
      };

      // Start pumping data
      pump();
    },
  });
}

/**
 * Prepares headers for compression by setting Content-Encoding
 * and removing Content-Length
 *
 * @param headers The HTTP response headers to modify
 * @param compressionType The type of compression being applied
 * @returns The modified headers
 */
export function prepareHeadersForCompression(
  headers: Headers,
  compressionType: string,
): Headers {
  const newHeaders = new Headers(headers);

  // Set the Content-Encoding header
  newHeaders.set("content-encoding", compressionType);

  // Remove Content-Length header as it will change with compression
  newHeaders.delete("content-length");

  return newHeaders;
}
