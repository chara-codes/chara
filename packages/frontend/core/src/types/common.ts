export type Theme = "light" | "dark" | "system";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface StreamCallbacks {
  onTextDelta: (delta: string) => void;
  onThinkingDelta?: (delta: string) => void;
  onToolCall?: (toolCall: unknown) => void;
  onStructuredData?: (data: Record<string, any>) => void;
  onStreamError?: (errorMsg: string) => void;
  onStreamClose?: (aborted: boolean) => void;
  onCompletion?: (data: Record<string, any>) => void;
}

export interface StreamRequestPayload {
  messages: {
    role: string;
    content: string;
    tool_calls?: any[];
  }[];
  model: string;
  [key: string]: any;
}
