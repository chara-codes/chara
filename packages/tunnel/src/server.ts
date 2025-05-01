import type { ServerWebSocket, Server } from "bun";
import { logger } from "./utils/logger";
import { randomUUID } from "crypto";
import { allocateSubdomain } from "./utils/subdomain";
import type {
  PendingRequest,
  ClientData,
  ServerConfig,
} from "./types/server.types";

export function startServer(config: ServerConfig): Server {
  const { port, domain, controlDomain } = config;
  logger.debug(`Starting tunnel server on port ${port}`);
  logger.debug(`Root domain: ${domain}`);
  logger.debug(`Control domain: ${controlDomain}`);
  logger.debug(`Server configuration: ${JSON.stringify(config, null, 2)}`);

  // Store client connections with their assigned subdomains
  const clients = new Map<string, ServerWebSocket<ClientData>>();

  const server = Bun.serve({
    port,
    routes: {
      "/_chara/connect": (req) => {
        const url = new URL(req.url);
        const hostname = url.hostname;
        const host = req.headers.get("host") || "";
        const desiredSubdomain = url.searchParams.get("subdomain");

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
            return;
          }

          logger.debug(`Failed to upgrade connection to WebSocket`);

          return new Response(
            "Chara Codes Control Server is running. Connect using WebSocket.",
            {
              status: 200,
            },
          );
        }
      },
    },
    fetch(req) {
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
    },
    websocket: {
      open(ws) {
        const typedWs = ws as ServerWebSocket<ClientData>;
        logger.debug(`New WebSocket connection opened: ${ws.remoteAddress}`);

        if (typedWs.data && typedWs.data.type === "control") {
          // Initialize the requests map
          typedWs.data.requests = new Map<string, PendingRequest>();

          // Check if client requested a specific subdomain
          let desiredSubdomain = typedWs.data.desiredSubdomain;
          let usedRequestedSubdomain = false;

          // Allocate a subdomain for the client
          const { subdomain, usedRequestedSubdomain: didUseRequested } =
            allocateSubdomain(desiredSubdomain, clients);
          logger.debug(
            `Allocated subdomain: ${subdomain}, requested: ${desiredSubdomain || "none"}, used requested: ${didUseRequested}`,
          );

          usedRequestedSubdomain = didUseRequested;

          const fullDomain = `${subdomain}.${domain}`;
          typedWs.data.subdomain = fullDomain;

          // Store client connection mapped to subdomain
          clients.set(subdomain, typedWs);

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
      },
      message(ws, message) {
        try {
          // Try to parse as JSON
          const data =
            typeof message === "string"
              ? JSON.parse(message)
              : JSON.parse(new TextDecoder().decode(message as Uint8Array));

          logger.debug("Received message:", data);

          if (data.type === "ping") {
            logger.debug(`Received ping from client`);
            ws.send(JSON.stringify({ type: "pong" }));
            return;
          }

          if (data.type === "http_response_start" && data.id) {
            // Handle HTTP response start from client (streaming)
            const typedWs = ws as ServerWebSocket<ClientData>;
            const pendingRequest = typedWs.data.requests?.get(data.id);

            if (pendingRequest) {
              logger.debug(
                `Setting up streaming response for request ${data.id}`,
              );
              pendingRequest.headers = new Headers(data.headers || {});
              pendingRequest.status =
                data.statusCode || pendingRequest.status || 200;
              logger.debug(
                `HTTP response starting for request ${data.id}, status: ${pendingRequest.status}`,
              );
              logger.debug(
                `Response headers: ${JSON.stringify(Object.fromEntries(pendingRequest.headers.entries()), null, 2)}`,
              );
            } else {
              logger.warning(
                `Received response start for unknown request ID: ${data.id}`,
              );
            }
          } else if (data.type === "http_data" && data.id) {
            // Handle streaming data chunks from client
            const typedWs = ws as ServerWebSocket<ClientData>;
            const pendingRequest = typedWs.data.requests?.get(data.id);

            if (pendingRequest && pendingRequest.streamController) {
              try {
                // Convert data from binary/base64 format to Uint8Array
                const chunk =
                  typeof data.data === "string"
                    ? new Uint8Array(Buffer.from(data.data, "binary"))
                    : new Uint8Array(data.data);

                // Add the chunk to the stream
                pendingRequest.streamController.enqueue(chunk);
                logger.debug(
                  `Added ${chunk.length} bytes to stream for request ${data.id}`,
                );
              } catch (e) {
                logger.error(
                  `Error processing data chunk for request ${data.id}:`,
                  e,
                );
              }
            } else {
              logger.warning(
                `Received data for unknown or non-streaming request ID: ${data.id}`,
              );
            }
          } else if (data.type === "http_response_end" && data.id) {
            // Handle HTTP response from client
            const typedWs = ws as ServerWebSocket<ClientData>;
            const pendingRequest = typedWs.data.requests?.get(data.id);

            if (pendingRequest) {
              const { resolver } = pendingRequest;

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
                  } catch (e) {
                    logger.error(`Error adding final chunk to stream: ${e}`);
                  }
                }
                // Close the stream
                pendingRequest.streamController.close();
                logger.debug(`Closed stream for request ${data.id}`);
              }
              resolver(
                new Response(pendingRequest.stream, {
                  status: pendingRequest.status || data.status || 200,
                  headers:
                    pendingRequest.headers || new Headers(data.headers || {}),
                }),
              );

              // Clean up the pending request
              typedWs.data.requests?.delete(data.id);
              logger.debug(`Completed request ${data.id}`);
            } else {
              logger.warning(
                `Received response for unknown request ID: ${data.id}`,
              );
            }
          }
        } catch (e) {
          logger.error("Error processing message:", e);
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid message format",
            }),
          );
        }
      },
      close(ws) {
        // Find and remove this client's subdomain
        const typedWs = ws as ServerWebSocket<ClientData>;
        logger.debug(`WebSocket connection closing: ${ws.remoteAddress}`);

        if (typedWs.data?.subdomain) {
          logger.debug(
            `Cleaning up resources for subdomain: ${typedWs.data.subdomain}`,
          );
        }
        if (typedWs.data.requests) {
          logger.debug(
            `Client has ${typedWs.data.requests.size} pending requests to clean up`,
          );
          for (const [
            requestId,
            pendingRequest,
          ] of typedWs.data.requests.entries()) {
            logger.debug(
              `Resolving pending request ${requestId} due to client disconnect`,
            );
            // If this was a streaming request, close the stream
            if (pendingRequest.streamController) {
              try {
                pendingRequest.streamController.close();
              } catch (e) {
                logger.error(`Error closing stream controller: ${e}`);
              }
            }

            pendingRequest.resolver(
              new Response("Client disconnected", { status: 503 }),
            );
          }
          if (typedWs.data?.subdomain) {
            const [subdomain = "", domain = ""] =
              typedWs.data?.subdomain?.split(".", 2);

            clients.delete(subdomain);
            logger.info(`Removed subdomain ${subdomain}.${domain}`);
          }
        }
        logger.info("WebSocket connection closed");
      },
    },
  });

  logger.server(`Server running at http://${controlDomain}:${server.port}`);

  return server;
}
