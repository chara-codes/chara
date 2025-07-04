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

export type ActionFunction<T extends ActionOptions = ActionOptions> = (
  options?: T,
) => Promise<void>;

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
}
