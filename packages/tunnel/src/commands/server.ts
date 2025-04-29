import type { CommandModule } from "yargs";
import type { ServerWebSocket, Server } from "bun";
import { logger } from "../utils/logger";
import { humanId } from "human-id";
import { randomUUID } from "crypto";

interface PendingRequest {
  controller: AbortController;
  resolver: (response: Response) => void;
  timestamp: number;
}

interface ClientData {
  type: string;
  subdomain?: string;
  desiredSubdomain?: string;
  requests?: Map<string, PendingRequest>;
}

interface ServerCommandArgs {
  port: number;
  domain: string;
  controlDomain: string;
}

export const serverCommand: CommandModule<{}, ServerCommandArgs> = {
  command: "server",
  describe:
    "Start Chara Codes Tunnel, expose the localhost to public, add a chara codes panel.",
  builder: (yargs) =>
    yargs
      .option("port", {
        alias: "p",
        type: "number",
        description: "Port to listen on",
        default: 1337,
      })
      .option("domain", {
        type: "string",
        description: "Root domain for generating subdomains",
        default: "chara-ai.dev",
      })
      .option("controlDomain", {
        type: "string",
        description: "Control domain for websocket connections",
        default: "control.chara-ai.dev",
      }),
  handler: async (argv) => {
    const { port, domain, controlDomain } = argv;
    logger.debug(`Starting server on port ${port}`);
    logger.debug(`Root domain: ${domain}`);
    logger.debug(`Control domain: ${controlDomain}`);

    // Store client connections with their assigned subdomains
    const clients = new Map<string, ServerWebSocket<ClientData>>();

    // Generate a unique human-readable subdomain for a client
    const generateSubdomain = (): string => {
      // Generate a friendly, readable ID like "brave-golden-wolf"
      const id = humanId({
        separator: "-",
        capitalize: false,
      });
      return `chara-${id}`;
    };

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
            // Upgrade the request to WebSocket if it's a WebSocket request
            if (
              server.upgrade(req, {
                data: { type: "control", desiredSubdomain: desiredSubdomain },
              })
            ) {
              return;
            }

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

        logger.info("subdomainMatch", subdomain);

        if (subdomain && clients.has(subdomain)) {
          const client = clients.get(subdomain)!;
          // Initialize the requests map if it doesn't exist
          if (!client.data.requests) {
            client.data.requests = new Map<string, PendingRequest>();
          }

          // Generate a unique request ID
          const requestId = randomUUID();

          // Create a promise that will be resolved when we get a response
          return new Promise<Response>(async (resolve) => {
            // Set up timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
              controller.abort();
            }, 30000); // 30 seconds timeout

            // Store the pending request
            client.data.requests?.set(requestId, {
              controller,
              resolver: resolve,
              timestamp: Date.now(),
            });

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

              // Wait for controller abort (timeout) or resolver to be called
              controller.signal.addEventListener("abort", () => {
                client.data.requests?.delete(requestId);
                clearTimeout(timeoutId);
                resolve(
                  new Response("Request timeout after 30 seconds", {
                    status: 504,
                  }),
                );
              });
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

          if (typedWs.data && typedWs.data.type === "control") {
            // Initialize the requests map
            typedWs.data.requests = new Map<string, PendingRequest>();

            // Check if client requested a specific subdomain
            let desiredSubdomain = typedWs.data.desiredSubdomain;
            let subdomain = "";
            let usedRequestedSubdomain = false;

            if (desiredSubdomain) {
              // Validate the requested subdomain
              desiredSubdomain = desiredSubdomain.toLowerCase().trim();
              const isValidSubdomain = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(
                desiredSubdomain,
              );

              if (isValidSubdomain && !clients.has(desiredSubdomain)) {
                // Use the requested subdomain if valid and available
                subdomain = desiredSubdomain;
                usedRequestedSubdomain = true;
                logger.info(`Using client-requested subdomain: ${subdomain}`);
              } else {
                // Log why we're not using the requested subdomain
                if (!isValidSubdomain) {
                  logger.warning(
                    `Requested subdomain "${desiredSubdomain}" is invalid, generating a random one instead`,
                  );
                } else {
                  logger.warning(
                    `Requested subdomain "${desiredSubdomain}" is already in use, generating a random one instead`,
                  );
                }
                subdomain = generateSubdomain();
              }
            } else {
              // Generate a random subdomain if none was requested
              subdomain = generateSubdomain();
            }

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

            if (data.type === "http_response" && data.id) {
              // Handle HTTP response from client
              const typedWs = ws as ServerWebSocket<ClientData>;
              const pendingRequest = typedWs.data.requests?.get(data.id);

              if (pendingRequest) {
                const { resolver } = pendingRequest;

                // Build response from the data sent by the client
                const responseHeaders = new Headers(data.headers || {});
                const responseInit = {
                  status: data.status || 200,
                  headers: responseHeaders,
                };

                const response = new Response(data.body || "", responseInit);
                resolver(response);

                // Clean up the pending request
                typedWs.data.requests?.delete(data.id);
                logger.debug(`Completed request ${data.id}`);
              } else {
                logger.warning(
                  `Received response for unknown request ID: ${data.id}`,
                );
              }
            } else {
              // Echo other messages back
              ws.send(message);
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
          for (const [subdomain, client] of clients.entries()) {
            if (client === ws) {
              // Reject any pending requests
              const typedWs = ws as ServerWebSocket<ClientData>;
              if (typedWs.data.requests) {
                for (const [
                  requestId,
                  pendingRequest,
                ] of typedWs.data.requests.entries()) {
                  pendingRequest.resolver(
                    new Response("Client disconnected", { status: 503 }),
                  );
                }
              }
              clients.delete(subdomain);
              logger.info(`Removed subdomain ${subdomain}.${domain}`);
              break;
            }
          }
          logger.info("WebSocket connection closed");
        },
      },
    });

    logger.server(`Server running at http://${controlDomain}:${server.port}`);
  },
};
