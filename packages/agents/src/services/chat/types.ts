/** biome-ignore-all lint/suspicious/noExplicitAny: events from external services */
import type { ModelMessage, StepResult, UIMessage } from "ai";
import type { ServerWebSocket } from "bun";

export interface ChatAgentCallbacks {
  onChunk?: (chunk: any) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
  onFinish?: (result: any) => void | Promise<void>;
  onStepFinish?: (step: StepResult<any>) => void | Promise<void>;
}

export interface ChatSubscription {
  ws: ServerWebSocket<unknown>;
  subscriptionId: string;
  subscribedAt: number;
}

export interface ChatStatus {
  chatId: string;
  status: "idle" | "in_progress" | "completed" | "error";
  startedAt?: number;
  completedAt?: number;
  error?: string;
  mode?: "ask" | "write";
  model?: string;
}

export interface ChatSubscribeEvent {
  event: "chat:subscribe";
  data: {
    chatId: string;
  };
}

export interface ChatUnsubscribeEvent {
  event: "chat:unsubscribe";
  data: {
    chatId: string;
  };
}

export interface ChatUnsubscribeAllEvent {
  event: "chat:unsubscribe-all";
  data?: Record<string, never>;
}

export interface ChatSendEvent {
  event: "chat:send";
  data: {
    chatId: string;
    model: string;
    messages: UIMessage[];
    mode: "write" | "ask";
  };
}

export interface ChatCancelEvent {
  event: "chat:cancel";
  data: {
    chatId: string;
  };
}

export interface ChatChunkEvent {
  event: "chat:chunk";
  data: {
    chatId: string;
    assistantMessageId: string | null;
    chunk: string;
    type: "text" | "tool-call" | "tool-result";
  };
}

export interface ChatCompleteEvent {
  event: "chat:complete";
  data: {
    chatId: string;
    assistantMessageId: string | null;
    usage?: unknown;
  };
}

export interface ChatErrorEvent {
  event: "chat:error";
  data: {
    chatId: string;
    assistantMessageId: string | null;
    error: string;
    code?: string;
  };
}

export interface ChatStatusEvent {
  event: "chat:status";
  data: ChatStatus;
}

export interface ChatUIMessageEvent {
  event: "chat:ui-message";
  data: {
    chatId: string;
    message: UIMessage;
  };
}

export type ChatEvent =
  | ChatChunkEvent
  | ChatCompleteEvent
  | ChatErrorEvent
  | ChatStatusEvent
  | ChatUIMessageEvent;

export interface ChatHooks {
  onChatStart?: (chatId: string, data: ChatSendEvent["data"]) => Promise<void>;
  onChatComplete?: (
    chatId: string,
    response: string,
    usage?: unknown
  ) => Promise<void>;
  onChatError?: (chatId: string, error: string) => Promise<void>;
  onChatCancel?: (chatId: string) => Promise<void>;
  onStatusUpdate?: (status: ChatStatus) => Promise<void>;
  onMessageUpdate?: (messageId: string, commit?: string) => Promise<void>;
}

export interface ChatAgentHooks extends ChatAgentCallbacks {
  // Chat agent specific hooks for global pointcuts
}
