import { randomUUID } from "crypto";
import type { ClientMap, PendingRequest } from "../../types/server.types";
import { logger } from "../../utils/logger";

/**
 * Handles incoming HTTP requests by forwarding them to the appropriate client
 * based on subdomain
 *
 * @param req The incoming HTTP request
 * @param clients Map of connected clients by subdomain
 * @param controlDomain The control domain for the tunnel server
 * @returns A Response object, either from the client or an error response
 */
export async function handleHttpRequest(
  req: Request,
  clients: ClientMap,
  controlDomain: string,
): Promise<Response> {
  const url = new URL(req.url);
  const host = req.headers.get("host") || "";

  // Check if this is a connection to a recognized subdomain
  const [subdomain] = host.split(".");
  logger.debug(`Incoming HTTP request: ${req.method} ${req.url}`);
  logger.debug(
    `Request headers: ${JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2)}`,
  );
  logger.debug(`Request ${subdomain}: ${req.method} ${req.url}`);

  if (subdomain && clients.has(subdomain)) {
    const client = clients.get(subdomain)!;
    logger.debug(`Found client for subdomain: ${subdomain}`);
    logger.debug(`Client connection status: ${client.readyState}`);

    // Initialize the requests map if it doesn't exist
    if (!client.data.requests) {
      client.data.requests = new Map<string, PendingRequest>();
    }

    // Generate a unique request ID
    const requestId = randomUUID();

    // Create a promise that will be resolved when we get a response
    return new Promise<Response>(async (resolve) => {
      const request: PendingRequest = {
        status: 200,
        headers: new Headers(),
        resolver: resolve,
        timestamp: Date.now(),
      };

      const abortController = new AbortController();

      // Initialize streaming with ReadableStream
      request.stream = new ReadableStream<Uint8Array>({
        start(controller) {
          // Store the pending request
          request.streamController = controller;
        },
        cancel() {
          logger.debug(`Stream cancelled for request ${requestId}`);
        },
      });

      client.data.requests?.set(requestId, request);

      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 30000); // 30 seconds timeout

      try {
        // Extract request data to forward to the client
        const headers: Record<string, string> = {};
        req.headers.forEach((value, key) => {
          headers[key] = value;
        });

        let body: string | undefined;
        if (req.method !== "GET" && req.method !== "HEAD") {
          body = await req.text();
        }

        logger.debug(`Preparing to forward request ${requestId} to client`);
        logger.debug(`Request body size: ${body ? body.length : 0} bytes`);

        // Send the request to the client over WebSocket
        client.send(
          JSON.stringify({
            type: "http_request",
            id: requestId,
            method: req.method,
            url: url.toString(),
            path: url.pathname + url.search,
            headers,
            body,
          }),
        );

        logger.debug(
          `Request ${requestId} sent to client, waiting for response`,
        );

        // Wait for controller abort (timeout) or resolver to be called
        abortController.signal.addEventListener("abort", () => {
          logger.debug(`Request ${requestId} timed out after 30 seconds`);
          client.data.requests?.delete(requestId);
          clearTimeout(timeoutId);
          resolve(
            new Response("Request timeout after 30 seconds", {
              status: 504,
            }),
          );
        });

        logger.debug(`Set up 30 second timeout for request ${requestId}`);
      } catch (error) {
        client.data.requests?.delete(requestId);
        clearTimeout(timeoutId);
        resolve(
          new Response(`Error processing request: ${error}`, {
            status: 500,
          }),
        );
      }
    });
  }

  return new Response(
    `Unknown domain. Please connect to ${controlDomain} for a subdomain assignment.`,
    {
      status: 404,
    },
  );
}
