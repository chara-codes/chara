import WebSocket from "ws";
import { logger } from "./utils/logger";
import type { TunnelClientOptions } from "./types/client.types";

export class TunnelClient {
  private ws: WebSocket | null = null;
  private options: TunnelClientOptions;

  constructor(options: Partial<TunnelClientOptions> = {}) {
    this.options = {
      port: options.port ?? 3000,
      host: options.host ?? "localhost",
      remoteHost: options.remoteHost ?? "control.localhost:1337",
      secure: options.secure ?? true,
      subdomain: options.subdomain,
    };
    logger.debug(
      `TunnelClient initialized with options: ${JSON.stringify(this.options, null, 2)}`,
    );
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { port, host, remoteHost, secure } = this.options;

      logger.info(`Connecting to tunnel server at ${remoteHost}...`);

      const protocol = secure ? "wss://" : "ws://";
      let wsUrl = `${protocol}${remoteHost}/_chara/connect`;
      if (this.options.subdomain) {
        wsUrl += `?subdomain=${encodeURIComponent(this.options.subdomain)}`;
        logger.info(`Requesting subdomain: ${this.options.subdomain}`);
      }

      logger.debug(`Connecting to WebSocket URL: ${wsUrl}`);
      logger.debug(
        `Connection details: protocol=${protocol}, host=${host}, port=${port}, secure=${secure}`,
      );

      this.ws = new WebSocket(wsUrl);

      this.ws.on("open", () => {
        logger.success(`Connected to tunnel server at ${remoteHost}`);
        logger.debug(
          `WebSocket connection established (readyState: ${this.ws?.readyState})`,
        );
        resolve();
      });

      // Set up ping interval to keep the connection alive
      const pingInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          logger.debug(`Sending ping to keep connection alive`);
          this.ws.send(JSON.stringify({ type: "ping" }));
        } else {
          logger.debug(
            `Skipping ping - WebSocket not open (state: ${this.ws?.readyState})`,
          );
        }
      }, 30000); // Send ping every 30 seconds

      // Clear interval when connection closes
      this.ws.on("close", () => {
        clearInterval(pingInterval);
      });

      this.ws.on("message", async (data) => {
        logger.debug(`Received message from server: ${data.toString()}`);
        const messageStr = data.toString();
        logger.debug(`Message size: ${messageStr.length} bytes`);

        try {
          const message = JSON.parse(data.toString());
          // Log received pong messages
          if (message.type === "pong") {
            logger.debug(`Received pong from server`);
            return;
          }

          // Handle subdomain assignment
          if (message.type === "subdomain_assigned") {
            logger.success(
              `Assigned subdomain: ${message.subdomain}, forwarding traffic from ${message.subdomain} to ${host}:${port}`,
            );
          }
          // Handle HTTP requests that need to be forwarded to local server
          else if (message.type === "http_request") {
            await this.handleHttpRequest(message);
          }
        } catch (error) {
          logger.error(`Failed to parse message: ${error}`);
        }
      });

      this.ws.on("error", (error) => {
        logger.error(`WebSocket error: ${error.message}`);
        reject(error);
      });

      this.ws.on("close", (code, reason) => {
        logger.warning(`Connection closed: ${code} - ${reason}`);
      });
    });
  }

  private async handleHttpRequest(message: {
    id: string;
    method: string;
    path: string;
    headers: Record<string, string>;
    body: string | null;
  }): Promise<void> {
    const { id: requestId, method, path, headers, body } = message;
    const { host, port } = this.options;

    try {
      logger.info(`Forwarding request: ${method} ${path}`);
      logger.debug(
        `Request details: ID=${requestId}, Headers=${JSON.stringify(headers)}`,
      );
      logger.debug(`Request body size: ${body ? body.length : 0} bytes`);

      // Create URL for the local server
      const url = `http://${host}:${port}${path}`;

      // Remove headers that might cause issues
      const filteredHeaders: Record<string, string> = { ...headers };
      delete filteredHeaders.host;
      delete filteredHeaders.connection;
      delete filteredHeaders["content-length"];

      // Make the request to the local server
      const response = await fetch(url, {
        method,
        headers: filteredHeaders,
        body: body || undefined,
      });
      logger.debug(
        `Received response from local server with status: ${response.status}`,
      );
      logger.debug(
        `Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`,
      );

      // Extract headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Check if WebSocket is open
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        logger.error("WebSocket connection is not open");
        return;
      }

      // Send the response headers and status first
      this.ws.send(
        JSON.stringify({
          type: "http_response_start",
          id: requestId,
          status: response.status,
          headers: responseHeaders,
        }),
      );

      // Stream the response body
      if (response.body) {
        const reader = response.body.getReader();

        logger.debug(
          `Starting to stream response body for request ${requestId}`,
        );

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            // Send each chunk as it arrives
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              logger.debug(`WebSocket state: ${this.ws?.readyState}`);
              // Convert Uint8Array to Base64 string for safe JSON transport
              const base64Chunk = Buffer.from(value).toString("binary");

              logger.debug(
                `Streaming chunk: ${value.length} bytes for request ${requestId}`,
              );

              this.ws.send(
                JSON.stringify({
                  type: "http_data",
                  id: requestId,
                  data: base64Chunk,
                  encoding: "base64",
                }),
              );
            } else {
              break;
            }
          }
        } catch (error) {
          logger.error(`Error streaming response: ${error}`);
        } finally {
          logger.debug(`Response stream completed for request ${requestId}`);
          // Send end of response signal
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(
              JSON.stringify({
                type: "http_response_end",
                id: requestId,
              }),
            );
          }
        }
      }

      logger.info(
        `Response streamed for ${method} ${path} with status ${response.status}`,
      );
    } catch (error) {
      logger.error(`Error forwarding request: ${error}`);
      logger.debug(
        `Error details: ${error instanceof Error ? error.stack : String(error)}`,
      );

      // Send error response back to the tunnel server
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // First send the response headers
        this.ws.send(
          JSON.stringify({
            type: "http_response_start",
            id: requestId,
            status: 502,
            headers: { "content-type": "text/plain" },
          }),
        );

        // Send the error message as data
        const errorData = Buffer.from(
          "Bad Gateway: Could not connect to local server",
        ).toString("base64");
        this.ws.send(
          JSON.stringify({
            type: "http_data",
            id: requestId,
            data: errorData,
            encoding: "base64",
          }),
        );

        // End the response
        this.ws.send(
          JSON.stringify({
            type: "http_response_end",
            id: requestId,
          }),
        );
      }
    }
  }
  public disconnect(): void {
    if (this.ws) {
      logger.debug(`Disconnecting from tunnel server`);
      this.ws.close();
      this.ws = null;
      logger.debug(`Disconnected and cleaned up WebSocket reference`);
    } else {
      logger.debug(
        `Disconnect called but no active WebSocket connection exists`,
      );
    }
  }
}
