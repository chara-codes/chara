import type { ContextItem, MessageContent, ToolCall } from "@chara-codes/core";

export interface MessageBubbleProps {
  id?: string;
  content: string | MessageContent[] | Array<{ type: "text"; text: string }>;
  isUser: boolean;
  timestamp?: string;
  thinkingContent?: string;
  isThinking?: boolean;
  contextItems?: ContextItem[];
  toolCalls?: Record<string, ToolCall>;
  onDeleteMessage?: (messageId: string) => void;
  isGenerating?: boolean;
}

export type TooltipPositionType = "top" | "right" | "bottom" | "left";

export interface TooltipPosition {
  top: number;
  left: number;
  position: TooltipPositionType;
}
