import type { ServerWebSocket, Server } from "bun";

export interface PendingRequest {
  // Stream-related fields
  streamController?: ReadableStreamDefaultController<Uint8Array>;
  resolver: (response: Response) => void;
  timestamp: number;
  status?: number;
  statusText?: string;
  headers?: Headers;
  stream?: ReadableStream<Uint8Array>;
}

export interface ClientData {
  type: string;
  subdomain?: string;
  desiredSubdomain?: string;
  requests?: Map<string, PendingRequest>;
}

export interface TextReplacement {
  pattern: string | RegExp;
  replacement: string;
}

export interface ServerConfig {
  port: number;
  domain: string;
  controlDomain: string;
  replacements?: TextReplacement[];
}

export type ClientMap = Map<string, ServerWebSocket<ClientData>>;