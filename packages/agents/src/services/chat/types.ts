/** biome-ignore-all lint/suspicious/noExplicitAny: events from external services */
import type { CoreMessage, StepResult } from "ai";
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
  chatId: number;
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
    chatId: number;
  };
}

export interface ChatUnsubscribeEvent {
  event: "chat:unsubscribe";
  data: {
    chatId: number;
  };
}

export interface ChatUnsubscribeAllEvent {
  event: "chat:unsubscribe-all";
  data?: Record<string, never>;
}

export interface ChatSendEvent {
  event: "chat:send";
  data: {
    chatId: number;
    model: string;
    messages: CoreMessage[];
    userMessageId?: number;
    mode: "write" | "ask";
  };
}

export interface ChatCancelEvent {
  event: "chat:cancel";
  data: {
    chatId: number;
  };
}

export interface ChatChunkEvent {
  event: "chat:chunk";
  data: {
    chatId: number;
    assistantMessageId: number | null;
    chunk: string;
    type: "text" | "tool-call" | "tool-result";
  };
}

export interface ChatCompleteEvent {
  event: "chat:complete";
  data: {
    chatId: number;
    assistantMessageId: number | null;
    usage?: unknown;
  };
}

export interface ChatErrorEvent {
  event: "chat:error";
  data: {
    chatId: number;
    assistantMessageId: number | null;
    error: string;
    code?: string;
  };
}

export interface ChatStatusEvent {
  event: "chat:status";
  data: ChatStatus;
}

export type ChatEvent =
  | ChatChunkEvent
  | ChatCompleteEvent
  | ChatErrorEvent
  | ChatStatusEvent;

export interface ChatHooks {
  onChatStart?: (chatId: number, data: ChatSendEvent["data"]) => Promise<void>;
  onChatComplete?: (
    chatId: number,
    response: string,
    usage?: unknown
  ) => Promise<void>;
  onChatError?: (chatId: number, error: string) => Promise<void>;
  onChatCancel?: (chatId: number) => Promise<void>;
  onStatusUpdate?: (status: ChatStatus) => Promise<void>;
  onMessageUpdate?: (messageId: number, commit?: string) => Promise<void>;
}

export interface ChatAgentHooks extends ChatAgentCallbacks {
  // Chat agent specific hooks for global pointcuts
}
