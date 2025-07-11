// Import the mock data at the top of the file
import { mockChats, mockModels, mockResponse } from "../data";
import type { Chat, FileNode, Model } from "../types";
import { getVanillaTrpcClient } from "./trpc";

export function convertServerChatToFrontendChat(serverChat: ServerChat): Chat {
  return {
    id: serverChat.id.toString(),
    title: serverChat.title,
    timestamp: new Date(serverChat.updatedAt).toISOString(),
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

interface ChatListResponse {
  chats: ServerChat[];
  hasMore: boolean;
}

interface ModelsResponse {
  models: Model[];
  recentModels: string[];
}

interface MockResponseData {
  content: string;
  fileStructure: FileNode;
}

interface ChatsWithPagination {
  chats: Chat[];
  hasMore: boolean;
}

// Update the fetchChats function to use tRPC getChatList route
export async function fetchChats(options?: {
  limit?: number;
  offset?: number;
  parentId?: number | null;
}): Promise<Chat[]> {
  try {
    const client = getVanillaTrpcClient();
    const result = await client.chat.getChatList.query({});
    return result.chats.map((chat: ServerChat) =>
      convertServerChatToFrontendChat(chat)
    );
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
    console.log("Attempting to fetch chats with pagination using tRPC");
    const client = getVanillaTrpcClient();
    const result = (await (client as any).chat.getChatList.query(
      options || {}
    )) as ChatListResponse;

    console.log("Successfully fetched chats data with pagination via tRPC");
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
    : "/data/models.json";
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

// Completely revise the fetchMockResponse function to handle the error more robustly
export async function fetchMockResponse(): Promise<MockResponseData> {
  // Skip the fetch attempt entirely and use the imported mock data directly
  console.log("Using imported mock response data directly");
  return mockResponse;
}
