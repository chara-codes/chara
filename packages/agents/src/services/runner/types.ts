export interface LogEntry {
  id: string;
  timestamp: Date;
  type: "stdout" | "stderr" | "error";
  content: string;
  processId?: string;
}

export interface ServerInfo {
  serverUrl?: string;
  host?: string;
  port?: number;
  name: string;
  status: "starting" | "active" | "stopped" | "error";
  os: string;
  shell: string;
  cwd: string;
  command: string;
  pid?: number;
  startTime?: Date;
  uptime?: number;
  logs?: LogEntry[];
}

export interface RunnerOptions {
  command: string;
  cwd?: string;
}

export interface ProcessData {
  subprocess: any;
  info: ServerInfo;
  logBuffer: LogEntry[];
}
