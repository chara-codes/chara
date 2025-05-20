import WebSocket from 'ws';
import { logger } from '@chara/logger';
import EventEmitter from 'eventemitter3';
import type { TunnelClientOptions, TunnelMessage } from '../types/client.types';

/**
 * WebSocketHandler manages the WebSocket connection and related events
 */
export class WebSocketHandler extends EventEmitter {
  private ws: WebSocket | null = null;
  private options: TunnelClientOptions;
  private pingInterval: NodeJS.Timeout | null = null;

  /**
   * Create a new WebSocketHandler
   */
  constructor(options: TunnelClientOptions) {
    super();
    this.options = options;
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
  public isWebSocketOpen(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Send a message through the WebSocket connection
   */
  public sendMessage(message: TunnelMessage): void {
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
        // Forward the request to be handled by RequestHandler
        this.emit("http_request", message);
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
  private handleSubdomainAssigned(message: { type: "subdomain_assigned"; subdomain: string }): void {
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
}