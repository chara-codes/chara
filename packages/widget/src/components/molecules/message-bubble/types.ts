import type { ContextItem, ExecutedCommand, FileDiff, ToolCall } from "../../../store/types"

export interface MessageBubbleProps {
  id?: string
  content: string
  isUser: boolean
  timestamp?: string
  thinkingContent?: string
  isThinking?: boolean
  contextItems?: ContextItem[]
  filesToChange?: string[]
  commandsToExecute?: string[]
  executedCommands?: ExecutedCommand[]
  fileDiffs?: FileDiff[]
  toolCalls?: ToolCall[]
  onKeepAllDiffs?: () => void
  onRevertAllDiffs?: () => void
  onKeepDiff?: (diffId: string) => void
  onRevertDiff?: (diffId: string) => void
  onDeleteMessage?: (messageId: string) => void
}

export type TooltipPositionType = "top" | "right" | "bottom" | "left"

export interface TooltipPosition {
  top: number
  left: number
  position: TooltipPositionType
}
