import type { ContextItem, MessageContent, ToolCall } from "@chara/core";

export interface MessageBubbleProps {
  id?: string;
  content: string | MessageContent[];
  isUser: boolean;
  timestamp?: string;
  thinkingContent?: string;
  isThinking?: boolean;
  contextItems?: ContextItem[];
  toolCalls?: Map<string, ToolCall>;
  onDeleteMessage?: (messageId: string) => void;
}

export type TooltipPositionType = "top" | "right" | "bottom" | "left";

export interface TooltipPosition {
  top: number;
  left: number;
  position: TooltipPositionType;
}
