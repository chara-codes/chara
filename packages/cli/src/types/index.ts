import { Client } from '@modelcontextprotocol/sdk/client/index.js';

/**
 * MCPServer transport object
 */
export interface MCPServer {
  /** Type of the transport SSE or STDIO */
  type: string;
  /** URL of SSE server */
  url?: string | null;
  /** Command to execute */
  command?: string | null | undefined;
  /** Arguments to pass to the command */
  args?: string[] | null;
  /** Environment variables to pass to the command */
  env?: Record<string, string> | null;
}

/**
 * Chara CLI configuration
 */
export interface CharaConfig {
  /** Host to serve on */
  host: string;
  /** Port to serve on */
  port: number;
  /** Development command */
  dev: string;
  /** Model Context Protocol servers */
  mcpServers?: Record<string, MCPServer>;
}

/**
 * Default configuration values
 */
export const defaultConfig: CharaConfig = {
  host: "localhost",
  port: 3000,
  dev: "bun dev",
  mcpServers: {},
};

export interface ActiveClient {
  client: Client;
  cleanup: () => Promise<void>;
  name: string;
}
