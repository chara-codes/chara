export interface TunnelClientOptions {
  port: number;
  host: string;
  remoteHost: string;
  secure: boolean;
  subdomain?: string;
}

// Schema definition for route validation
export interface RouteSchema {
  querystring?: Record<string, any>;
  body?: Record<string, any>;
  response?: Record<number, Record<string, any>>;
}

// Configuration for custom route handlers
export interface RouteOptions {
  method: string;
  url: string;
  schema?: RouteSchema;
  preHandler?: (request: RouteRequest, reply: RouteReply) => Promise<void>;
  handler: (request: RouteRequest, reply: RouteReply) => Promise<any>;
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