export interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp?: string
  contextItems?: ContextItem[] // Add context items to messages
  filesToChange?: string[] // Add files to change
  commandsToExecute?: string[] // Add commands to execute
  executedCommands?: ExecutedCommand[] // Add executed commands
  fileDiffs?: FileDiff[] // Add file diffs
  diffStatuses?: { id: string; status: "pending" | "kept" | "reverted" }[] // Add diff statuses
}

export interface Chat {
  id: string
  title: string
  timestamp: string
  messages: Message[]
}

export type ContextItem = {
  // Add the properties that should be in this type
  id: string
  name: string
  type: string
  data?: unknown
}

export type ChatMode = "write" | "ask"

export interface Model {
  id: string
  name: string
  provider: string
}

// New types for file structure
export interface FileNode {
  name: string
  path: string
  type: "file" | "directory"
  children?: FileNode[]
  content?: string
  language?: string
  hasChanges?: boolean // Indicate if file has changes
}

// New type for executed commands
export type ExecutedCommand = {
  id: string
  command: string
  output?: string
  status: "pending" | "success" | "error" | string
  timestamp: string
}

// New types for file diffs
export interface FileDiff {
  id: string
  filePath: string
  fileName: string
  language?: string
  hunks: DiffHunk[]
  originalContent?: string
  newContent?: string
  status: "pending" | "kept" | "reverted" // Add status directly to FileDiff
}

export interface DiffHunk {
  id: string
  header: string
  changes: DiffChange[]
  startLine: number
  endLine: number
}

export interface DiffChange {
  type: "addition" | "deletion" | "context" | string
  content: string
  lineNumber?: number
  oldLineNumber?: number
  newLineNumber?: number
}
