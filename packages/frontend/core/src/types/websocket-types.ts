export interface ChatEvent {
  event:
    | "chat:subscribe"
    | "chat:unsubscribe"
    | "chat:unsubscribe-all"
    | "chat:send"
    | "chat:cancel"
    | "chat:status"
    | "chat:chunk"
    | "chat:complete"
    | "chat:error";
  data: unknown;
}

export interface ChatStatus {
  chatId: number;
  status: "idle" | "in_progress" | "completed" | "error";
  startedAt?: number;
  completedAt?: number;
  error?: string;
  mode?: "ask" | "write";
  model?: string;
}

export interface ChatServiceCallbacks {
  onChatStatus?: (data: ChatStatus) => void;
  onChatChunk?: (data: {
    chatId: number;
    assistantMessageId: number | null;
    chunk: string;
    type: "text" | "tool-call" | "tool-result";
  }) => void;
  onChatComplete?: (data: {
    chatId: number;
    assistantMessageId: number | null;
    fullResponse: string;
    usage?: Record<string, unknown>;
  }) => void;
  onChatError?: (data: {
    chatId: number;
    assistantMessageId: number | null;
    error: string;
    code?: string;
  }) => void;
  onConnectionOpen?: () => void;
  onConnectionClose?: (wasClean: boolean) => void;
  onConnectionError?: (error: Event) => void;
}

export interface RunnerEvent {
  event:
    | "runner:started"
    | "runner:stopped"
    | "runner:output"
    | "runner:error"
    | "runner:status"
    | "runner:restarted"
    | "runner:info-updated";
  data: unknown;
}

export interface RunnerServiceCallbacks {
  onRunnerStarted?: (data: {
    processId: string;
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
      pid: number;
      serverUrl?: string;
      os: string;
      shell: string;
      startTime: Date;
    };
  }) => void;
  onRunnerStopped?: (data: {
    processId: string;
    exitCode: number;
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
      uptime?: number;
    };
  }) => void;
  onRunnerOutput?: (data: {
    processId: string;
    type: "stdout" | "stderr";
    chunk: string;
    command: string;
    cwd: string;
  }) => void;
  onRunnerError?: (data: {
    processId: string;
    error: string;
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
    };
  }) => void;
  onRunnerStatus?: (data: {
    processId: string;
    status: "starting" | "active" | "stopped" | "error";
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
      pid?: number;
      uptime?: number;
      serverUrl?: string;
      host?: string;
      port?: number;
    };
    logs?: Array<{
      id: string;
      timestamp: Date;
      type: "stdout" | "stderr" | "error";
      content: string;
      processId?: string;
    }>;
  }) => void;
  onRunnerRestarted?: (data: {
    processId: string;
    oldCommand: string;
    newCommand: string;
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
      pid?: number;
    };
  }) => void;
  onRunnerInfoUpdated?: (data: {
    processId: string;
    updates: Partial<{
      name: string;
      serverUrl: string;
    }>;
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
      pid?: number;
      serverUrl?: string;
    };
  }) => void;
  onConnectionOpen?: () => void;
  onConnectionClose?: (wasClean: boolean) => void;
  onConnectionError?: (error: Event) => void;
}

export interface SharedWebSocketCallbacks
  extends ChatServiceCallbacks,
    RunnerServiceCallbacks {}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
  lastConnectedAt: number | null;
  reconnectAttempts: number;
}

export type UnifiedCallbacks = ChatServiceCallbacks & RunnerServiceCallbacks;
