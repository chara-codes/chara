import { EventEmitter } from 'eventemitter3';
import { logger } from '@chara/logger';
import { URL } from 'url';
import type { 
  TunnelClientOptions, 
  HttpRequestMessage, 
  HttpResponseStartMessage,
  HttpDataMessage,
  HttpResponseEndMessage,
  RouteOptions,
  RouteRequest,
  RouteReply
} from '../types/client.types';
import { RouteMatcher } from './route-matcher';
import { WebSocketHandler } from './websocket-handler';

/**
 * RequestHandler processes incoming HTTP requests from the tunnel
 * and either forwards them to the local server or handles them with custom routes
 */
export class RequestHandler extends EventEmitter {
  private options: TunnelClientOptions;
  private websocketHandler: WebSocketHandler;
  private routeMatcher: RouteMatcher;

  /**
   * Create a new RequestHandler
   */
  constructor(options: TunnelClientOptions, websocketHandler: WebSocketHandler) {
    super();
    this.options = options;
    this.websocketHandler = websocketHandler;
    this.routeMatcher = new RouteMatcher();
  }

  /**
   * Register a custom route handler
   */
  public registerRoute(options: RouteOptions): void {
    this.routeMatcher.addRoute(options);
  }

  /**
   * Handle an HTTP request from the tunnel
   */
  public async handleRequest(message: HttpRequestMessage): Promise<void> {
    const { id: requestId, method, path, headers, body } = message;
    const { host, port } = this.options;

    try {
      logger.debug(`Received request: ${method} ${path}`);
      
      // Check if there's a matching custom route handler
      const routeMatch = this.routeMatcher.findMatch(method, path);
      
      if (routeMatch) {
        logger.debug(`Using custom handler for route: ${method} ${path}`);
        await this.handleCustomRoute(requestId, routeMatch.route, method, path, headers, body, routeMatch.params);
      } else {
        logger.debug(`Forwarding request: ${method} ${path}`);
        logger.debug(`Request details: ID=${requestId}, Headers=${JSON.stringify(headers, null, 2)}`);
        logger.debug(`Request body size: ${body ? body.length : 0} bytes`);

        const url = `http://${host}:${port}${path}`;
        const response = await this.makeLocalRequest(url, method, headers, body);
        
        await this.streamResponseToTunnel(requestId, response);
      }
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
    if (!this.websocketHandler.isWebSocketOpen()) {
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
    this.websocketHandler.sendMessage({
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
    this.websocketHandler.sendMessage({
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
        if (!this.websocketHandler.isWebSocketOpen()) {
          break;
        }

        // Convert Uint8Array to Binary string for safe JSON transport
        const chunk = Buffer.from(value).toString("binary");
        logger.debug(`Streaming chunk: ${value.length} bytes for request ${requestId}`);

        this.websocketHandler.sendMessage({
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
   * Handle a request with a custom route handler
   */
  private async handleCustomRoute(
    requestId: string,
    route: RouteOptions,
    method: string,
    path: string,
    headers: Record<string, string>,
    requestBody: string | null,
    params: Record<string, string> = {}
  ): Promise<void> {
    // Parse URL to get query parameters
    const url = new URL(`http://dummy${path}`);
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });
    
    // Parse body if present
    let parsedBody = null;
    if (requestBody) {
      try {
        parsedBody = JSON.parse(requestBody);
      } catch (e) {
        // If not JSON, use the raw body
        parsedBody = requestBody;
      }
    }
    
    // Create request object
    const request: RouteRequest = {
      method,
      path,
      query,
      headers,
      body: parsedBody,
      params: params
    };
    
    // Prepare response object
    let statusCode = 200;
    let responseHeaders: Record<string, string> = {
      'content-type': 'application/json'
    };
    let responseSent = false;
    
    const reply: RouteReply = {
      status: (code: number) => {
        statusCode = code;
        return reply;
      },
      headers: (newHeaders: Record<string, string>) => {
        responseHeaders = { ...responseHeaders, ...newHeaders };
        return reply;
      },
      send: async (payload: any) => {
        if (responseSent) return;
        responseSent = true;
        
        // Start response
        this.websocketHandler.sendMessage({
          type: "http_response_start",
          id: requestId,
          status: statusCode,
          headers: responseHeaders
        });
        
        // Send response body
        if (payload !== undefined) {
          let responseData: string;
          
          if (typeof payload === 'string') {
            responseData = payload;
          } else {
            responseData = JSON.stringify(payload);
          }
          
          const chunk = Buffer.from(responseData).toString("binary");
          this.websocketHandler.sendMessage({
            type: "http_data",
            id: requestId,
            data: chunk
          });
        }
        
        // End response
        this.websocketHandler.sendMessage({
          type: "http_response_end",
          id: requestId
        });
      }
    };
    
    // Execute preHandler if defined
    if (route.preHandler) {
      try {
        await route.preHandler(request, reply);
      } catch (error) {
        logger.error(`Error in preHandler: ${error}`);
        return this.handleRequestError(requestId, error);
      }
    }
    
    // If response wasn't sent in preHandler, execute main handler
    if (!responseSent) {
      try {
        const result = await route.handler(request, reply);
        
        // If the handler returned a value and didn't call reply.send(),
        // automatically send the response
        if (!responseSent && result !== undefined) {
          reply.send(result);
        }
      } catch (error) {
        logger.error(`Error in route handler: ${error}`);
        if (!responseSent) {
          return this.handleRequestError(requestId, error);
        }
      }
    }
  }

  /**
   * Handle errors during request forwarding
   */
  private handleRequestError(requestId: string, error: unknown): void {
    logger.error(`Error handling request: ${error}`);
    logger.debug(
      `Error details: ${error instanceof Error ? error.stack : String(error)}`,
    );

    this.emit("error", error);

    // Send error response if WebSocket is open
    if (this.websocketHandler.isWebSocketOpen()) {
      // Send response start with error status
      this.websocketHandler.sendMessage({
        type: "http_response_start",
        id: requestId,
        status: 502,
        headers: { "content-type": "text/plain" },
      });

      // Send error message as data
      const errorData = Buffer.from(
        "Bad Gateway: Could not connect to local server",
      ).toString("binary");
      
      this.websocketHandler.sendMessage({
        type: "http_data",
        id: requestId,
        data: errorData,
      });

      // End the response
      this.websocketHandler.sendMessage({
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