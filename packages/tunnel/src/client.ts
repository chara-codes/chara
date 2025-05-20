import WebSocket from "ws";
import { logger } from "@chara/logger";
import type { TunnelClientOptions } from "./types/client.types";
import EventEmitter from "eventemitter3";

// Message type definitions for better type safety
interface PingMessage {
  type: "ping";
}

interface PongMessage {
  type: "pong";
}

interface SubdomainAssignedMessage {
  type: "subdomain_assigned";
  subdomain: string;
}

interface HttpRequestMessage {
  type: "http_request";
  id: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string | null;
}

interface HttpResponseStartMessage {
  type: "http_response_start";
  id: string;
  status: number;
  headers: Record<string, string>;
}

interface HttpDataMessage {
  type: "http_data";
  id: string;
  data: string;
}

interface HttpResponseEndMessage {
  type: "http_response_end";
  id: string;
}

type TunnelMessage =
  | PingMessage
  | PongMessage
  | SubdomainAssignedMessage
  | HttpRequestMessage
  | HttpResponseStartMessage
  | HttpDataMessage
  | HttpResponseEndMessage;

/**
 * TunnelClient creates a secure tunnel between a local server and a remote host.
 * It forwards HTTP requests received from the tunnel server to the local server,
 * and streams responses back to the tunnel server.
 */
export class TunnelClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private options: TunnelClientOptions;
  private pingInterval: NodeJS.Timeout | null = null;

  /**
   * Create a new TunnelClient instance
   */
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

  /**
   * Connect to the tunnel server
   */
  public connect(): void {
    const { remoteHost, secure, subdomain } = this.options;

    logger.debug(`Connecting to tunnel server at ${remoteHost}...`);

    // Build WebSocket URL
    const wsUrl = this.buildWebSocketUrl(remoteHost, secure, subdomain);
    
    // Create and configure WebSocket
    this.ws = new WebSocket(wsUrl);
    this.setupWebSocketHandlers();
  }

  /**
   * Disconnect from the tunnel server
   */
  public disconnect(): void {
    if (this.ws) {
      logger.debug(`Disconnecting from tunnel server`);
      this.ws.close();
      this.ws = null;
      this.cleanupPingInterval();
      logger.debug(`Disconnected and cleaned up WebSocket reference`);
    } else {
      logger.debug(`Disconnect called but no active WebSocket connection exists`);
    }
  }

  /**
   * Build the WebSocket URL for connecting to the tunnel server
   */
  private buildWebSocketUrl(remoteHost: string, secure: boolean, subdomain?: string): string {
    const protocol = secure ? "wss://" : "ws://";
    let wsUrl = `${protocol}${remoteHost}/_chara/connect`;
    
    if (subdomain) {
      wsUrl += `?subdomain=${encodeURIComponent(subdomain)}`;
      logger.debug(`Requesting subdomain: ${subdomain}`);
    }
    
    logger.debug(`Connecting to WebSocket URL: ${wsUrl}`);
    
    return wsUrl;
  }

  /**
   * Setup WebSocket event handlers
   */
   private setupWebSocketHandlers(): void {
     if (!this.ws) return;

     const { host, port } = this.options;

     this.ws.on("open", () => this.handleWebSocketOpen());
     this.ws.on("message", (data) => this.handleWebSocketMessage(data));
     this.ws.on("error", (error) => this.handleWebSocketError(error));
     this.ws.on("close", (code, reason) => this.handleWebSocketClose(code, reason.toString()));

     logger.debug(`Connection details: host=${host}, port=${port}, secure=${this.options.secure}`);
   }

  /**
   * Handle WebSocket open event
   */
  private handleWebSocketOpen(): void {
    logger.debug(`Connected to tunnel server at ${this.options.remoteHost}`);
    logger.debug(`WebSocket connection established (readyState: ${this.ws?.readyState})`);

    // Emit open event
    this.emit("open");

    // Set up ping interval to keep the connection alive
    this.setupPingInterval();
  }

  /**
   * Setup the ping interval to keep the connection alive
   */
  private setupPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.isWebSocketOpen()) {
        logger.debug(`Sending ping to keep connection alive`);
        this.sendMessage({ type: "ping" });
      } else {
        logger.debug(`Skipping ping - WebSocket not open (state: ${this.ws?.readyState})`);
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Check if the WebSocket connection is open
   */
  private isWebSocketOpen(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Send a message through the WebSocket connection
   */
  private sendMessage(message: TunnelMessage): void {
    if (this.isWebSocketOpen()) {
      this.ws!.send(JSON.stringify(message));
    }
  }

  /**
   * Handle WebSocket message event
   */
  private handleWebSocketMessage(data: WebSocket.Data): void {
    const messageStr = data.toString();
    logger.debug(`Received message from server: ${messageStr}`);
    logger.debug(`Message size: ${messageStr.length} bytes`);

    try {
      const message = JSON.parse(messageStr) as TunnelMessage;
      this.processMessage(message);
    } catch (error) {
      logger.error(`Failed to parse message: ${error}`);
      this.emit("error", new Error(`Failed to parse message: ${error}`));
    }
  }

  /**
   * Process different message types from the tunnel server
   */
  private processMessage(message: TunnelMessage): void {
    switch (message.type) {
      case "pong":
        logger.debug(`Received pong from server`);
        this.emit("pong");
        break;
        
      case "subdomain_assigned":
        this.handleSubdomainAssigned(message);
        break;
        
      case "http_request":
        this.emit("http_request", message);
        this.handleHttpRequest(message);
        break;
        
      default:
        // Emit event for any other message types
        this.emit(message.type, message);
        break;
    }
  }

  /**
   * Handle subdomain assignment message
   */
  private handleSubdomainAssigned(message: SubdomainAssignedMessage): void {
    const { subdomain } = message;
    const { host, port } = this.options;
    
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

  /**
   * Handle WebSocket error event
   */
  private handleWebSocketError(error: Error): void {
    logger.error(`WebSocket error: ${error.message}`);
    this.emit("error", error);
  }

  /**
   * Handle WebSocket close event
   */
  private handleWebSocketClose(code: number, reason: string): void {
    logger.warning(`Connection closed: ${code} - ${reason}`);
    this.cleanupPingInterval();
    this.emit("close", { code, reason });
  }

  /**
   * Clean up the ping interval
   */
  private cleanupPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Handle an HTTP request that needs to be forwarded to the local server
   */
  private async handleHttpRequest(message: HttpRequestMessage): Promise<void> {
    const { id: requestId, method, path, headers, body } = message;
    const { host, port } = this.options;

    try {
      logger.debug(`Forwarding request: ${method} ${path}`);
      logger.debug(`Request details: ID=${requestId}, Headers=${JSON.stringify(headers, null, 2)}`);
      logger.debug(`Request body size: ${body ? body.length : 0} bytes`);

      const url = `http://${host}:${port}${path}`;
      const response = await this.makeLocalRequest(url, method, headers, body);
      
      await this.streamResponseToTunnel(requestId, response);
      
    } catch (error) {
      this.handleRequestError(requestId, error);
    }
  }

  /**
   * Make a request to the local server
   */
  private async makeLocalRequest(
    url: string, 
    method: string, 
    headers: Record<string, string>,
    body: string | null
  ): Promise<Response> {
    // Filter out problematic headers
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
    
    logger.debug(`Received response from local server with status: ${response.status}`);
    logger.debug(
      `Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`,
    );
    
    return response;
  }

  /**
   * Stream a response back to the tunnel server
   */
  private async streamResponseToTunnel(requestId: string, response: Response): Promise<void> {
    if (!this.isWebSocketOpen()) {
      logger.error("WebSocket connection is not open");
      this.emit("error", new Error("WebSocket connection is not open"));
      return;
    }

    // Extract and send headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Send response headers and status
    this.sendMessage({
      type: "http_response_start",
      id: requestId,
      status: response.status,
      headers: responseHeaders,
    });

    // Emit response start event
    this.emit("http_response_start", {
      id: requestId,
      status: response.status,
      headers: responseHeaders,
    });

    // Stream the response body if present
    if (response.body) {
      await this.streamResponseBody(requestId, response.body);
    }

    // Signal end of response
    this.sendMessage({
      type: "http_response_end",
      id: requestId,
    });

    // Emit response end event
    this.emit("http_response_end", { id: requestId });
  }

  /**
   * Stream response body from local server to tunnel
   */
  private async streamResponseBody(requestId: string, body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    logger.debug(`Starting to stream response body for request ${requestId}`);

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Continue only if WebSocket is open
        if (!this.isWebSocketOpen()) {
          break;
        }

        // Convert Uint8Array to Binary string for safe JSON transport
        const chunk = Buffer.from(value).toString("binary");
        logger.debug(`Streaming chunk: ${value.length} bytes for request ${requestId}`);

        this.sendMessage({
          type: "http_data",
          id: requestId,
          data: chunk,
        });
      }
    } catch (error) {
      logger.error(`Error streaming response: ${error}`);
      this.emit("error", new Error(`Error streaming response: ${error}`));
    } finally {
      logger.debug(`Response stream completed for request ${requestId}`);
    }
  }

  /**
   * Handle errors during request forwarding
   */
  private handleRequestError(requestId: string, error: unknown): void {
    logger.error(`Error forwarding request: ${error}`);
    logger.debug(
      `Error details: ${error instanceof Error ? error.stack : String(error)}`,
    );

    this.emit("error", error);

    // Send error response if WebSocket is open
    if (this.isWebSocketOpen()) {
      // Send response start with error status
      this.sendMessage({
        type: "http_response_start",
        id: requestId,
        status: 502,
        headers: { "content-type": "text/plain" },
      });

      // Send error message as data
      const errorData = Buffer.from(
        "Bad Gateway: Could not connect to local server",
      ).toString("binary");
      
      this.sendMessage({
        type: "http_data",
        id: requestId,
        data: errorData,
      });

      // End the response
      this.sendMessage({
        type: "http_response_end",
        id: requestId,
      });

      // Emit error response event
      this.emit("http_error", {
        id: requestId,
        status: 502,
        message: "Bad Gateway: Could not connect to local server",
      });
    }
  }
}