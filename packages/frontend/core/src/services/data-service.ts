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
  id: number;
  title: string;
  createdAt: number;
  updatedAt: number;
  parentId: number | null;
}

interface ModelsResponse {
  models: Model[];
  recentModels: string[];
}

interface ChatsWithPagination {
  chats: Chat[];
  hasMore: boolean;
}

// Update the fetchChats function to use tRPC getChatList route
export async function fetchChats(_options?: {
  limit?: number;
  offset?: number;
  parentId?: number | null;
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
  parentId?: number | null;
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

// Update the fetchModels function to use the imported mock data as a fallback
export async function fetchModels(): Promise<{
  models: Model[];
  recentModels: string[];
}> {
  const agentsUrl = import.meta.env?.VITE_AGENTS_BASE_URL
    ? `${import.meta.env.VITE_AGENTS_BASE_URL}api/models`
    : "http://localhost:3031/api/models";
  try {
    const response = await fetch(agentsUrl);
    if (!response.ok) {
      console.error(`Failed to fetch models: Status ${response.status}`);
      throw new Error(`Failed to fetch models: ${response.status}`);
    }
    const data: ModelsResponse = await response.json();
    console.log("Successfully fetched models data");
    return {
      models: data.models.map((model) => {
        return { ...model, id: `${model.provider}:::${model.id}` };
      }),
      recentModels: data.recentModels,
    };
  } catch (error) {
    console.error("Error fetching models:", error);
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

// Function to save a message to a chat
export async function saveMessage(
  chatId: string,
  content: string,
  role: "user" | "assistant",
  context?: any,
  toolCalls?: any
): Promise<{
  id: string;
  content: string;
  role: string;
  timestamp: number;
  context?: any;
  toolCalls?: any;
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
  }
): Promise<{
  chatId: string;
  history: Array<{
    id: string;
    message: string;
    role: string;
    timestamp: number;
    context?: any;
    toolCalls?: Record<string, any>;
    commit?: string;
  }>;
  hasMore: boolean;
}> {
  try {
    const client = getVanillaTrpcClient();
    const result = await client.chat.getHistory.query({
      chatId: parseInt(chatId),
      lastMessageId: options?.lastMessageId,
      limit: options?.limit,
    });

    return {
      chatId: result.chatId.toString(),
      history: result.history,
      hasMore: result.hasMore,
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
