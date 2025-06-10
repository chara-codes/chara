import type {
  Chat,
  Model,
  FileDiff,
  FileNode,
  ExecutedCommand,
} from "../store/types";
// Import the mock data at the top of the file
import { mockChats, mockModels, mockResponse } from "../data/mock-data";

interface ChatsResponse {
  chats: Chat[];
}

interface ModelsResponse {
  models: Model[];
  recentModels: string[];
}

interface MockResponseData {
  content: string;
  filesToChange: string[];
  commandsToExecute: string[];
  fileStructure: FileNode;
  executedCommands: ExecutedCommand[];
  fileDiffs: FileDiff[];
}

// Update the fetchChats function to use the imported mock data as a fallback
export async function fetchChats(): Promise<Chat[]> {
  try {
    console.log("Attempting to fetch chats from: /data/chats.json");
    const response = await fetch("/data/chats.json");

    if (!response.ok) {
      console.error(`Failed to fetch chats: Status ${response.status}`);
      throw new Error(`Failed to fetch chats: ${response.status}`);
    }

    const data: ChatsResponse = await response.json();
    console.log("Successfully fetched chats data");
    return data.chats;
  } catch (error) {
    console.error("Error fetching chats:", error);
    console.log("Using imported mock chats data instead");
    return mockChats;
  }
}

// Update the fetchModels function to use the imported mock data as a fallback
export async function fetchModels(): Promise<{
  models: Model[];
  recentModels: string[];
}> {
  const agentsUrl = import.meta?.env?.VITE_AGENTS_BASE_URL
    ? `${import.meta?.env?.VITE_AGENTS_BASE_URL}api/models`
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
