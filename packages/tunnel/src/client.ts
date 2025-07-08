import { logger } from "@apk/logger";
import EventEmitter from "eventemitter3";
import type { TunnelClientOptions, RouteOptions, HttpRequestMessage, TunnelMessage, RedirectConfig } from "./types/client.types";
import { WebSocketHandler } from "./client/websocket-handler";
import { RequestHandler } from "./client/request-handler";
import { RouteMatcher } from "./client/route-matcher";

/**
 * TunnelClient creates a secure tunnel between a local server and a remote host.
 * It forwards HTTP requests received from the tunnel server to the local server,
 * and streams responses back to the tunnel server.
 * 
 * It can also act as an API proxy by redirecting specific routes to external APIs
 * with custom headers, allowing you to hide API keys from client-side code.
 * 
 * This class has been refactored to use specialized modules for:
 * - WebSocket management
 * - Route matching and handling
 * - Request processing
 */
export class TunnelClient extends EventEmitter {
  private wsHandler: WebSocketHandler;
  private requestHandler: RequestHandler;
  private options: TunnelClientOptions;

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
    
    // Create WebSocket handler
    this.wsHandler = new WebSocketHandler(this.options);
    
    // Create Request handler
    this.requestHandler = new RequestHandler(this.options, this.wsHandler);
    
    // Set up event forwarding
    this.setupEventForwarding();
  }

  /**
   * Connect to the tunnel server
   */
  public connect(): void {
    logger.debug(`Connecting to tunnel server at ${this.options.remoteHost}...`);
    this.wsHandler.connect();
  }

  /**
   * Disconnect from the tunnel server
   */
  public disconnect(): void {
    logger.debug(`Disconnecting from tunnel server`);
    this.wsHandler.disconnect();
  }

  /**
   * Register a custom route handler or redirected route
   * 
   * @example Custom route handler
   * ```
   * client.route({
   *   method: 'GET',
   *   url: '/status',
   *   handler: async (request, reply) => {
   *     return { status: 'online' };
   *   }
   * });
   * ```
   * 
   * @example Redirected route (API proxy)
   * ```
   * client.route({
   *   method: 'POST',
   *   url: '/api/v1/:path*',
   *   redirect: {
   *     url: 'https://api.example.com/v1',
   *     headers: {
   *       'Authorization': 'Bearer API_KEY',
   *       'Content-Type': 'application/json'
   *     }
   *   }
   * });
   * ```
   */
  public route(options: RouteOptions): void {
    this.requestHandler.registerRoute(options);
  }

  /**
   * Redirect all HTTP methods from a source path to a target URL
   * 
   * This is a convenience method for creating redirects that handle any HTTP method.
   * 
   * @example Redirect all methods to external API
   * ```
   * client.redirectAll('/api/:path*', {
   *   url: 'https://api.example.com',
   *   headers: {
   *     'Authorization': 'Bearer API_KEY'
   *   }
   * });
   * ```
   */
  public redirectAll(sourcePath: string, redirectConfig: RedirectConfig): void {
    this.route({
      url: sourcePath,
      redirect: redirectConfig
    });
  }

  /**
   * Forward events from internal modules to TunnelClient listeners
   */
  private setupEventForwarding(): void {
    // Forward WebSocketHandler events
    this.wsHandler.on("open", () => this.emit("open"));
    this.wsHandler.on("close", (data) => this.emit("close", data));
    this.wsHandler.on("error", (error) => this.emit("error", error));
    this.wsHandler.on("pong", () => this.emit("pong"));
    this.wsHandler.on("subdomain_assigned", (data) => this.emit("subdomain_assigned", data));
    
    // Forward RequestHandler events
    this.requestHandler.on("error", (error) => this.emit("error", error));
    this.requestHandler.on("http_error", (data) => this.emit("http_error", data));
    this.requestHandler.on("http_response_start", (data) => this.emit("http_response_start", data));
    this.requestHandler.on("http_response_end", (data) => this.emit("http_response_end", data));
    
    // Handle HTTP requests
    this.wsHandler.on("http_request", (message: HttpRequestMessage) => {
      this.emit("http_request", message);
      this.requestHandler.handleRequest(message);
    });
  }
}