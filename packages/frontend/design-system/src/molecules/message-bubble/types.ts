export interface MessageBubbleProps {
  content: string;
  timestamp?: string;
  isUser: boolean;
  isThinking?: boolean;
  thinkingContent?: string;
  className?: string;
  actions?: React.ReactNode;
}
