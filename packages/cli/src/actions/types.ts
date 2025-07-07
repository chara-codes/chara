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
  R = void,
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
