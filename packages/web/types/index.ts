export interface FileDiff {
  oldContent: string
  newContent: string
}

export interface FileChange {
  id: string
  filename: string
  type: "add" | "delete" | "modify"
  description: string
  version?: number
  diff?: FileDiff
}

export interface Command {
  id: string
  command: string
  description?: string
}

export interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  url: string // In a real app, this would be a blob URL or a server URL
}

export interface Message {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
  regenerations?: string[]
  currentRegenerationIndex?: number
  fileChanges?: FileChange[]
  commands?: Command[]
  attachments?: FileAttachment[]
}

