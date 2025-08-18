import type { UIMessage } from "ai";

export interface MessageBubbleProps {
  id?: string;
  content: string;
  isUser: boolean;
  timestamp?: string;
  thinkingContent?: string;
  isThinking?: boolean;
  contextItems?: any[];
  toolCalls?: Record<string, any>;
  onDeleteMessage?: (messageId: string) => void;
  isGenerating?: boolean;
  parts: UIMessage["parts"];
}

export type TooltipPositionType = "top" | "right" | "bottom" | "left";

export interface TooltipPosition {
  top: number;
  left: number;
  position: TooltipPositionType;
}
