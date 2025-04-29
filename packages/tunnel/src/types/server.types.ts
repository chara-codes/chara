import type { ServerWebSocket } from "bun";

export interface PendingRequest {
  controller: AbortController;
  resolver: (response: Response) => void;
  timestamp: number;
}

export interface ClientData {
  type: string;
  subdomain?: string;
  desiredSubdomain?: string;
  requests?: Map<string, PendingRequest>;
}

export interface ServerConfig {
  port: number;
  domain: string;
  controlDomain: string;
}