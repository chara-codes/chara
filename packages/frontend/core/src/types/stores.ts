export interface MessageContent {
  type: "text" | "file";
  text?: string;
  data?: string; // base64 encoded file data
  mimeType?: string;
}

export interface Message {
  id: string;
  content: string | MessageContent[]; // Support both legacy string and new multi-part content
  isUser: boolean;
  timestamp?: string;
  contextItems?: ContextItem[]; // Add context items to messages
  diffStatuses?: { id: string; status: "pending" | "kept" | "reverted" }[]; // Add diff statuses
  thinkingContent?: string; // Store thinking content separately
  isThinking?: boolean; // Track if message is currently in thinking mode
  toolCalls?: ToolCall[]; // Add tool calls
  segments?: Array<{
    type: "text" | "tool-call";
    content: string;
    toolCall?: ToolCall;
  }>; // Add message segments for inline tool call rendering
}

export interface Chat {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

export type ContextItem = {
  id: string;
  name: string;
  type: string;
  data?: unknown;
  content?: string; // File content (text or base64 for binary files)
  mimeType?: string; // MIME type of the file
};

export type ChatMode = "write" | "ask";

export interface Model {
  id: string;
  name: string;
  provider: string;
}

// New types for file structure
export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  content?: string;
  language?: string;
  hasChanges?: boolean; // Indicate if file has changes
}

// Tool call types
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: "pending" | "in-progress" | "success" | "error";
  result?: ToolResult;
  timestamp: string;
}

export interface ToolResult {
  content?: string;
  data?: unknown;
  error?: string;
}
