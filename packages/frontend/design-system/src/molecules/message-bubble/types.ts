import type { UIMessage } from "ai";

export interface ContextItem {
  type?: string;
  name: string;
  url?: string;
  id?: string;
  mediaType?: string;
  content?: string;
  data?: Record<string, unknown>;
}

export interface ToolCall {
  name: string;
  arguments?: unknown;
  status?: string;
}

export interface MessageBubbleProps {
  id?: string;
  content: string;
  isUser: boolean;
  timestamp?: string;
  thinkingContent?: string;
  isThinking?: boolean;
  contextItems?: ContextItem[];
  toolCalls?: Record<string, ToolCall>;
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
