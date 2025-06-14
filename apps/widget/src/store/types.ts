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
  filesToChange?: string[]; // Add files to change
  commandsToExecute?: string[]; // Add commands to execute
  executedCommands?: ExecutedCommand[]; // Add executed commands
  fileDiffs?: FileDiff[]; // Add file diffs
  diffStatuses?: { id: string; status: "pending" | "kept" | "reverted" }[]; // Add diff statuses
  thinkingContent?: string; // Store thinking content separately
  isThinking?: boolean; // Track if message is currently in thinking mode
  toolCalls?: ToolCall[]; // Add tool calls
  segments?: Array<{
    type: "text" | "tool-call";
    content: string;
    toolCall?: ToolCall;
  }> // Add message segments for inline tool call rendering
}

export interface Chat {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

export type ContextItem = {
  // Add the properties that should be in this type
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

// New type for executed commands
export type ExecutedCommand = {
  id: string;
  command: string;
  output?: string;
  status: "pending" | "success" | "error" | string;
  timestamp: string;
};

// File diff types using original and patch approach
export interface FileDiff {
  id: string;
  filePath: string;
  fileName: string;
  language?: string;
  originalContent?: string; // The original file content
  patchContent?: string; // The patch/diff content in unified diff format
  newContent?: string; // Optional - the resulting content after applying patch
  status: "pending" | "kept" | "reverted";
  stats?: DiffStats; // Optional statistics about the diff
  // Legacy support for hunks structure
  hunks?: DiffHunk[]; // Optional - legacy hunks structure for backwards compatibility
}

export interface DiffStats {
  additions: number;
  deletions: number;
  modifications: number;
  totalLines: number;
}

// Legacy interfaces - kept for backwards compatibility
// These may be removed in a future version
export interface DiffHunk {
  id: string;
  header: string;
  changes: DiffChange[];
  startLine: number;
  endLine: number;
}

export interface DiffChange {
  type: "addition" | "deletion" | "context" | string;
  content: string;
  lineNumber?: number;
  oldLineNumber?: number;
  newLineNumber?: number;
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
