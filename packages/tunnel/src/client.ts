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

      this.ws = new WebSocket(wsUrl);

      this.ws.on("open", () => {
        logger.success(`Connected to tunnel server at ${remoteHost}`);
        resolve();
      });

      // Set up ping interval to keep the connection alive
      const pingInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000); // Send ping every 30 seconds

      // Clear interval when connection closes
      this.ws.on("close", () => {
        clearInterval(pingInterval);
      });

      this.ws.on("message", async (data) => {
        logger.debug(`Received message from server: ${data.toString()}`);

        try {
          const message = JSON.parse(data.toString());

          // Handle subdomain assignment
          if (message.type === "subdomain_assigned") {
            logger.success(
              `Assigned subdomain: ${message.subdomain}, forwarding traffic from ${host}:${port} to ${message.subdomain}`,
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

      // Read response body
      const responseBody = await response.text();

      // Extract headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Send the response back to the tunnel server
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: "http_response",
            id: requestId,
            status: response.status,
            headers: responseHeaders,
            body: responseBody,
          }),
        );

        logger.info(
          `Response sent for ${method} ${path} with status ${response.status}`,
        );
      } else {
        logger.error("WebSocket connection is not open");
      }
    } catch (error) {
      logger.error(`Error forwarding request: ${error}`);

      // Send error response back to the tunnel server
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: "http_response",
            id: requestId,
            status: 502,
            headers: { "content-type": "text/plain" },
            body: "Bad Gateway: Could not connect to local server",
          }),
        );
      }
    }
  }
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
