export type ChatMode = "write" | "diff" | "command";

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  contextItems?: ContextItem[];
  filesToChange?: string[];
  commandsToExecute?: string[];
  executedCommands?: string[];
  fileDiffs?: FileDiff[];
  thinkingContent?: string;
  isThinking?: boolean;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
}

export interface FileDiff {
  id: string;
  filename: string;
  diff: string;
  status: "pending" | "kept" | "reverted";
}

export interface Chat {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

export interface ContextItem {
  id: string;
  name: string;
  type: "file" | "folder" | "text" | "image";
  data: string;
}
