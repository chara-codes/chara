// Import the mock data at the top of the file
import { mockChats, mockModels } from "../data";
import type { Chat, Model } from "../types";
import { getVanillaTrpcClient } from "./trpc";

export function convertServerChatToFrontendChat(serverChat: ServerChat): Chat {
  return {
    id: serverChat.id.toString(),
    title: serverChat.title,
    timestamp: new Date(serverChat.createdAt).toISOString(),
    messages: [], // Messages will be loaded separately when needed
  };
}

interface ServerChat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  parentId: string | null;
}

interface ChatsWithPagination {
  chats: Chat[];
  hasMore: boolean;
}

// Chat message interfaces to replace any usage
export interface ChatPart {
  type: string;
  [key: string]: unknown;
}

export interface ChatMessage {
  id: string;
  role: string;
  parts: ChatPart[];
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

export interface MessageContext {
  [key: string]: unknown;
}

export interface ToolCall {
  [key: string]: unknown;
}

// Update the fetchChats function to use tRPC getChatList route
export async function fetchChats(_options?: {
  limit?: number;
  offset?: number;
  parentId?: string | null;
}): Promise<Chat[]> {
  try {
    const client = getVanillaTrpcClient();
    const result = await client.chat.getChatList.query({});
    const res = result.chats.map((chat: ServerChat) =>
      convertServerChatToFrontendChat(chat)
    );
    return res;
  } catch (error) {
    console.error("Error fetching chats via tRPC:", error);
    console.log("Using imported mock chats data instead");
    return mockChats;
  }
}

// Enhanced fetchChats function that returns pagination info
export async function fetchChatsWithPagination(options?: {
  limit?: number;
  offset?: number;
  parentId?: string | null;
}): Promise<ChatsWithPagination> {
  try {
    const client = getVanillaTrpcClient();
    const result = await client.chat.getChatList.query(options || {});
    return {
      chats: result.chats.map((chat: ServerChat) =>
        convertServerChatToFrontendChat(chat)
      ),
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error("Error fetching chats with pagination via tRPC:", error);
    console.log("Using imported mock chats data instead");
    return {
      chats: mockChats,
      hasMore: false,
    };
  }
}

// Update the fetchModels function to get enabled models from settings
export async function fetchModels(): Promise<{
  models: Model[];
  recentModels: string[];
}> {
  try {
    const client = getVanillaTrpcClient();
    const enabledModelsConfig = await client.settings.models.getEnabledWithConfig.query();

    console.log("Successfully fetched enabled models from settings");

    // Convert enabled models config to Model array
    const models: Model[] = Object.entries(enabledModelsConfig).map(([modelId, config]) => ({
      id: modelId, // Already includes provider prefix (e.g., "openrouter:::qwen/qwen3-coder")
      name: config.name,
      provider: config.provider,
      contextSize: config.contextSize,
      hasTools: config.hasTools || false,
      recommended: config.recommended || false,
      approved: config.approved !== false
    }));

    // For recent models, we'll use the most recently enabled models
    // Sort by enabledAt timestamp and take the most recent ones
    const recentModels = Object.entries(enabledModelsConfig)
      .sort(
        ([, a], [, b]) =>
          new Date(b.enabledAt).getTime() - new Date(a.enabledAt).getTime()
      )
      .slice(0, 5) // Take top 5 most recent
      .map(([modelId]) => modelId);

    return {
      models,
      recentModels,
    };
  } catch (error) {
    console.error("Error fetching enabled models from settings:", error);
    console.log("Using imported mock models data instead");
    return {
      models: mockModels,
      recentModels: ["claude-3.7-sonnet", "gpt-4o"],
    };
  }
}

// Function to create a new chat
export async function createChat(title: string): Promise<Chat> {
  try {
    const client = getVanillaTrpcClient();
    const result = await client.chat.createChat.mutate({ title });

    return {
      id: result.id.toString(),
      title: result.title,
      timestamp: result.createdAt.toString(),
      messages: [],
    };
  } catch (error) {
    console.error("Error creating chat via tRPC:", error);
    throw error;
  }
}

// Function to update a chat (title and/or status)
export async function updateChat(
  chatId: string,
  updates: {
    title?: string;
    status?: "idle" | "in_progress" | "completed" | "error";
  }
): Promise<Chat> {
  try {
    const client = getVanillaTrpcClient();
    const result = await client.chat.updateChat.mutate({
      chatId,
      ...updates,
    });

    return {
      id: result.id.toString(),
      title: result.title,
      timestamp: result.updatedAt.toString(),
      messages: [],
    };
  } catch (error) {
    console.error("Error updating chat via tRPC:", error);
    throw error;
  }
}

// Function to save a message to a chat
export async function saveMessage(
  chatId: string,
  content: string,
  role: "user" | "assistant",
  context?: MessageContext,
  toolCalls?: ToolCall[]
): Promise<{
  id: string;
  content: string;
  role: string;
  timestamp: number;
  context?: MessageContext;
  toolCalls?: ToolCall[];
}> {
  try {
    const client = getVanillaTrpcClient();
    const result = await client.chat.saveMessage.mutate({
      chatId: parseInt(chatId),
      content,
      role,
      context,
      toolCalls,
    });

    return {
      id: result.id.toString(),
      content: result.content,
      role: result.role,
      timestamp: result.timestamp,
      context: result.context,
      toolCalls: result.toolCalls,
    };
  } catch (error) {
    console.error("Error saving message via tRPC:", error);
    throw error;
  }
}

// Function to delete messages from a chat after a specific message ID
export async function deleteMessages(
  chatId: string,
  messageId: string
): Promise<{
  deletedCount: number;
  deletedMessageIds: number[];
  commitToReset: string | null;
}> {
  try {
    const client = getVanillaTrpcClient();
    const result = await client.chat.deleteMessages.mutate({
      chatId: parseInt(chatId),
      messageId: parseInt(messageId),
    });

    return {
      deletedCount: result.deletedCount,
      deletedMessageIds: result.deletedMessageIds,
      commitToReset: result.commitToReset,
    };
  } catch (error) {
    console.error("Error deleting messages via tRPC:", error);
    throw error;
  }
}

// Function to fetch chat history
export async function fetchChatHistory(
  chatId: string,
  options?: {
    lastMessageId?: string | null;
    limit?: number;
    firstMessageOnly?: boolean;
  }
): Promise<{
  chatId: string;
  history: Array<ChatMessage>;
  hasMore: boolean;
}> {
  try {
    const client = getVanillaTrpcClient();
    const result = await client.chat.getMessages.query({
      chatId: chatId,
    });

    let messages = result.messages;

    // Apply filtering based on options
    if (options?.lastMessageId) {
      const lastMessageIndex = messages.findIndex(
        (msg) => msg.id === options.lastMessageId
      );
      if (lastMessageIndex !== -1) {
        messages = messages.slice(0, lastMessageIndex);
      }
    }

    if (options?.firstMessageOnly) {
      messages = messages.slice(0, 1);
    } else if (options?.limit) {
      messages = messages.slice(-options.limit);
    }

    return {
      chatId: result.chatId,
      history: messages,
      hasMore: false, // getMessages doesn't support pagination yet
    };
  } catch (error) {
    console.error("Error fetching chat history via tRPC:", error);
    throw error;
  }
}

// Function to reset project to a specific commit
export async function resetToCommit(commit: string): Promise<{
  success: boolean;
  message: string;
  commit: string;
}> {
  const agentsUrl = import.meta.env?.VITE_AGENTS_BASE_URL
    ? `${import.meta.env.VITE_AGENTS_BASE_URL}api/git/reset`
    : "http://localhost:3031/api/git/reset";

  try {
    const response = await fetch(agentsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ commit }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Failed to reset to commit: ${response.status}`
      );
    }

    const result = await response.json();
    console.log(`Successfully reset to commit: ${commit}`);
    return result;
  } catch (error) {
    console.error("Error resetting to commit:", error);
    throw error;
  }
}

// Function to get suggested prompts
export async function getSuggestedPrompts(
  model: string,
  previousMessages: Array<{ role: string; content: string }>,
  maxSuggestions: number = 10
): Promise<string[]> {
  const agentsUrl = import.meta.env?.VITE_AGENTS_BASE_URL
    ? `${import.meta.env.VITE_AGENTS_BASE_URL}api/suggest`
    : "http://localhost:3031/api/suggest";

  try {
    const response = await fetch(
      `${agentsUrl}?maxSuggestions=${maxSuggestions}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model,
          messages: previousMessages,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Failed to get suggestions: ${response.status}`
      );
    }

    const result = await response.json();
    console.log(
      `Successfully fetched ${result.suggestions.length} suggestions`
    );
    return result.suggestions || [];
  } catch (error) {
    console.error("Error getting suggested prompts:", error);
    return [];
  }
}

// Function to get first messages from recent chats
export async function fetchFirstMessageFromRecentChats(options?: {
  chatLimit?: number;
}): Promise<
  Array<{
    chat: {
      id: string;
      title: string;
      createdAt: string;
      updatedAt: string;
    };
    firstMessage: ChatMessage | null;
  }>
> {
  try {
    const client = getVanillaTrpcClient();
    const result = await client.chat.getFirstMessageFromRecentChats.query({
      chatLimit: options?.chatLimit,
    });

    return result.map((item) => ({
      chat: {
        id: item.chat.id.toString(),
        title: item.chat.title,
        createdAt: new Date(item.chat.createdAt).toISOString(),
        updatedAt: new Date(item.chat.updatedAt).toISOString(),
      },
      firstMessage: item.firstMessage
        ? {
            id: item.firstMessage.id,
            role: item.firstMessage.role,
            parts: item.firstMessage.parts,
            metadata: item.firstMessage.metadata,
            createdAt: item.firstMessage.createdAt,
          }
        : null,
    }));
  } catch (error) {
    console.error("Error fetching first messages from recent chats:", error);
    return [];
  }
}

// Helper function to get just the first message from a chat
export async function getFirstMessage(chatId: string): Promise<ChatMessage | null> {
  try {
    const result = await fetchChatHistory(chatId, { firstMessageOnly: true });
    return result.history.length > 0 ? result.history[0] : null;
  } catch (error) {
    console.error("Error fetching first message:", error);
    return null;
  }
}
