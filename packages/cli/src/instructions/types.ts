export enum ActionType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  RENAME = "rename",
  SHELL = "shell",
}

export interface Action {
  type: ActionType;
  target?: string;
  content?: string;
  newName?: string;
  command?: string;
  metadata?: Record<string, any>;
}

export interface Instructions {
  actions: Action[];
  projectRoot: string;
}

export enum ActionStatus {
  SUCCESS = "success",
  FAILURE = "failure",
  SKIPPED = "skipped",
}

export interface ActionResult {
  type: ActionType;
  target?: string;
  status: ActionStatus;
  message: string;
  error?: string;
  command?: string;
}

export interface InstructionsResult {
  actions: ActionResult[];
  projectRoot: string;
  success: boolean;
  timestamp: number;
}
