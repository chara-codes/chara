import type { ContextItem, MessageContent, ToolCall } from "@chara-codes/core";

export interface MessageBubbleProps {
  id?: string;
  content: string | MessageContent[];
  isUser: boolean;
  timestamp?: string;
  thinkingContent?: string;
  isThinking?: boolean;
  contextItems?: ContextItem[];
  toolCalls?: Record<string, ToolCall>;
  onDeleteMessage?: (messageId: string) => void;
}

export type TooltipPositionType = "top" | "right" | "bottom" | "left";

export interface TooltipPosition {
  top: number;
  left: number;
  position: TooltipPositionType;
}
