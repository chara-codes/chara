import WebSocket from "ws";
import { logger } from "@chara/logger";
import type { TunnelClientOptions } from "./types/client.types";
import EventEmitter from "eventemitter3";

export class TunnelClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private options: TunnelClientOptions;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(options: Partial<TunnelClientOptions> = {}) {
    super();

    this.options = {
      port: options.port ?? 3000,
      host: options.host ?? "localhost",
      remoteHost: options.remoteHost ?? "tunnel.chara-ai.dev",
      secure: options.secure ?? true,
      subdomain: options.subdomain,
    };

    logger.debug(
      `TunnelClient initialized with options: ${JSON.stringify(this.options, null, 2)}`,
    );
  }

  public connect(): void {
    const { port, host, remoteHost, secure } = this.options;

    logger.debug(`Connecting to tunnel server at ${remoteHost}...`);

    const protocol = secure ? "wss://" : "ws://";
    let wsUrl = `${protocol}${remoteHost}/_chara/connect`;
    if (this.options.subdomain) {
      wsUrl += `?subdomain=${encodeURIComponent(this.options.subdomain)}`;
      logger.debug(`Requesting subdomain: ${this.options.subdomain}`);
    }

    logger.debug(`Connecting to WebSocket URL: ${wsUrl}`);
    logger.debug(
      `Connection details: protocol=${protocol}, host=${host}, port=${port}, secure=${secure}`,
    );

    this.ws = new WebSocket(wsUrl);

    this.ws.on("open", () => {
      logger.debug(`Connected to tunnel server at ${remoteHost}`);
      logger.debug(
        `WebSocket connection established (readyState: ${this.ws?.readyState})`,
      );

      // Emit open event
      this.emit("open");

      // Set up ping interval to keep the connection alive
      this.pingInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          logger.debug(`Sending ping to keep connection alive`);
          this.ws.send(JSON.stringify({ type: "ping" }));
        } else {
          logger.debug(
            `Skipping ping - WebSocket not open (state: ${this.ws?.readyState})`,
          );
        }
      }, 30000); // Send ping every 30 seconds
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
          this.emit("pong");
          return;
        }

        // Handle subdomain assignment
        if (message.type === "subdomain_assigned") {
          const { subdomain } = message;
          logger.debug(
            `Assigned subdomain: ${subdomain}, forwarding traffic from https://${subdomain}/ to ${host}:${port}`,
          );

          // Emit specific subdomain_assigned event with relevant data
          this.emit("subdomain_assigned", {
            subdomain,
            url: `https://${subdomain}/`,
            localServer: `${host}:${port}`,
          });
        }
        // Handle HTTP requests that need to be forwarded to local server
        else if (message.type === "http_request") {
          // Emit http_request event with the full message
          this.emit("http_request", message);
          this.handleHttpRequest(message);
        }
        // Emit event for any other message types
        else {
          this.emit(message.type, message);
        }
      } catch (error) {
        logger.error(`Failed to parse message: ${error}`);
        this.emit("error", new Error(`Failed to parse message: ${error}`));
      }
    });

    this.ws.on("error", (error) => {
      logger.error(`WebSocket error: ${error.message}`);
      this.emit("error", error);
    });

    this.ws.on("close", (code, reason) => {
      logger.warning(`Connection closed: ${code} - ${reason}`);
      this.cleanupPingInterval();
      this.emit("close", { code, reason });
    });
  }

  private cleanupPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
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
      logger.debug(`Forwarding request: ${method} ${path}`);
      logger.debug(
        `Request details: ID=${requestId}, Headers=${JSON.stringify(headers, null, 2)}`,
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
        `Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`,
      );

      // Extract headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Check if WebSocket is open
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        logger.error("WebSocket connection is not open");
        this.emit("error", new Error("WebSocket connection is not open"));
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

      // Emit response start event
      this.emit("http_response_start", {
        id: requestId,
        status: response.status,
        headers: responseHeaders,
      });

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
              // Convert Uint8Array to Binary string for safe JSON transport
              const chunk = Buffer.from(value).toString("binary");

              logger.debug(
                `Streaming chunk: ${value.length} bytes for request ${requestId}`,
              );

              this.ws.send(
                JSON.stringify({
                  type: "http_data",
                  id: requestId,
                  data: chunk,
                }),
              );
            } else {
              break;
            }
          }
        } catch (error) {
          logger.error(`Error streaming response: ${error}`);
          this.emit("error", new Error(`Error streaming response: ${error}`));
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

            // Emit response end event
            this.emit("http_response_end", { id: requestId });
          }
        }
      }

      logger.debug(
        `Response streamed for ${method} ${path} with status ${response.status}`,
      );
    } catch (error) {
      logger.error(`Error forwarding request: ${error}`);
      logger.debug(
        `Error details: ${error instanceof Error ? error.stack : String(error)}`,
      );

      this.emit("error", error);

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
        ).toString("binary");
        this.ws.send(
          JSON.stringify({
            type: "http_data",
            id: requestId,
            data: errorData,
          }),
        );

        // End the response
        this.ws.send(
          JSON.stringify({
            type: "http_response_end",
            id: requestId,
          }),
        );

        // Emit error response events
        this.emit("http_error", {
          id: requestId,
          status: 502,
          message: "Bad Gateway: Could not connect to local server",
        });
      }
    }
  }

  public disconnect(): void {
    if (this.ws) {
      logger.debug(`Disconnecting from tunnel server`);
      this.ws.close();
      this.ws = null;
      this.cleanupPingInterval();
      logger.debug(`Disconnected and cleaned up WebSocket reference`);
    } else {
      logger.debug(
        `Disconnect called but no active WebSocket connection exists`,
      );
    }
  }
}
