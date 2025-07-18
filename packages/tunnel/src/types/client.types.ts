// Client configuration options
export interface TunnelClientOptions {
  port: number;
  host: string;
  remoteHost: string;
  secure: boolean;
  subdomain?: string;
}

// Message type definitions for WebSocket communication
export interface PingMessage {
  type: "ping";
}

export interface PongMessage {
  type: "pong";
}

export interface SubdomainAssignedMessage {
  type: "subdomain_assigned";
  subdomain: string;
}

export interface HttpRequestMessage {
  type: "http_request";
  id: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string | null;
}

export interface HttpResponseStartMessage {
  type: "http_response_start";
  id: string;
  status: number;
  headers: Record<string, string>;
}

export interface HttpDataMessage {
  type: "http_data";
  id: string;
  data: string;
}

export interface HttpResponseEndMessage {
  type: "http_response_end";
  id: string;
}

export type TunnelMessage =
  | PingMessage
  | PongMessage
  | SubdomainAssignedMessage
  | HttpRequestMessage
  | HttpResponseStartMessage
  | HttpDataMessage
  | HttpResponseEndMessage;

// Schema definition for route validation
export interface RouteSchema {
  querystring?: Record<string, any>;
  body?: Record<string, any>;
  response?: Record<number, Record<string, any>>;
}

// Configuration for request redirection
export interface RedirectConfig {
  url: string;
  headers?: Record<string, string>;
}

// Configuration for custom route handlers
export interface RouteOptions {
  method?: string; // Optional when redirect is used (to support all methods)
  url: string;
  schema?: RouteSchema;
  preHandler?: (request: RouteRequest, reply: RouteReply) => Promise<void>;
  handler?: (request: RouteRequest, reply: RouteReply) => Promise<any>;
  redirect?: RedirectConfig;
}

// Request object passed to route handlers
export interface RouteRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: any;
  params: Record<string, string>;
}

// Reply object passed to route handlers
export interface RouteReply {
  status: (code: number) => RouteReply;
  headers: (headers: Record<string, string>) => RouteReply;
  send: (payload: any) => void;
}

// Route matching result
export interface RouteMatch {
  route: RouteOptions;
  params: Record<string, string>;
}