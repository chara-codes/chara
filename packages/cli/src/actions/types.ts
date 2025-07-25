import type { TextReplacement } from "@chara-codes/tunnel";

export type { TextReplacement } from "@chara-codes/tunnel";

export interface ActionOptions {
  verbose?: boolean;
}

export interface ActionResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

export interface ActionContext {
  verbose: boolean;
  force?: boolean;
}

export type ActionFunction<
  T extends ActionOptions = ActionOptions,
  R = void
> = (options?: T) => Promise<R>;

export interface BaseAction {
  name: string;
  description: string;
  execute: ActionFunction;
}

export interface InitActionOptions extends ActionOptions {
  force?: boolean;
}

export interface ResetActionOptions extends ActionOptions {
  confirm?: boolean;
}

export interface ShowActionOptions extends ActionOptions {
  format?: "table" | "json" | "yaml";
}

export interface DefaultModelActionOptions extends ActionOptions {
  port?: number;
  serverUrl?: string;
}

export interface StartAgentsActionOptions extends ActionOptions {
  port?: number;
  mcp?: boolean;
  runner?: boolean;
  websocket?: boolean;
  silent?: boolean;
}

export interface StopAgentsActionOptions extends ActionOptions {
  server?: any;
  silent?: boolean;
}

export interface SetupLoggingActionOptions extends ActionOptions {
  trace?: boolean;
}

export interface SetupProjectActionOptions extends ActionOptions {
  projectDir?: string;
}

export interface LoadConfigActionOptions extends ActionOptions {}

export interface ConnectMcpActionOptions extends ActionOptions {
  mcpServers?: Record<string, any>;
}

export interface ConnectEventsActionOptions extends ActionOptions {}

export interface InitApiActionOptions extends ActionOptions {}

export interface InitMcpClientActionOptions extends ActionOptions {}

export interface InitializeConfigActionOptions extends ActionOptions {
  configFile?: string;
}

export interface StartServerActionOptions extends ActionOptions {
  port?: number;
  host?: string;
  mcpEnabled?: boolean;
  mcpTransport?: string;
  websocketEnabled?: boolean;
  websocketPath?: string;
  corsEnabled?: boolean;
  corsOrigin?: string;
  loggingEnabled?: boolean;
  silent?: boolean;
}

export interface StopServerActionOptions extends ActionOptions {
  server?: any;
  silent?: boolean;
  force?: boolean;
}

export interface StopServeStaticActionOptions extends ActionOptions {
  server?: any;
  silent?: boolean;
  verbose?: boolean;
}

export interface ServeStaticActionOptions extends ActionOptions {
  port?: number;
  directory?: string;
  directories?: Record<string, string | Response>;
  index?: string;
  host?: string;
  cors?: boolean;
  silent?: boolean;
  development?:
    | boolean
    | {
        hmr?: boolean;
        console?: boolean;
      };
}

export interface StartTunnelServerActionOptions extends ActionOptions {
  port?: number;
  domain?: string;
  controlDomain?: string;
  configFile?: string;
  replacements?: TextReplacement[];
  silent?: boolean;
}

export interface StopTunnelServerActionOptions extends ActionOptions {
  server?: any;
  silent?: boolean;
  force?: boolean;
}

export interface StartTunnelClientActionOptions extends ActionOptions {
  port?: number;
  host?: string;
  remoteHost?: string;
  secure?: boolean;
  subdomain?: string;
  silent?: boolean;
}

export interface StopTunnelClientActionOptions extends ActionOptions {
  client?: any;
  silent?: boolean;
  force?: boolean;
}
