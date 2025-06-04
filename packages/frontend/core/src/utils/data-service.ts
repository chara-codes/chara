import type { Chat } from '../types';

/**
 * Fetches chat history from the API
 */
export async function fetchChats(): Promise<Chat[]> {
  try {
    // TODO: fix
    const apiBaseUrl = /*import.meta.env?.VITE_API_BASE_URL || */"/api";
    const response = await fetch(`${apiBaseUrl}/chats`);

    if (!response.ok) {
      throw new Error(`Failed to fetch chats: ${response.statusText}`);
    }

    // @ts-ignore
    return await response.json();
  } catch (error) {
    console.error("Error fetching chats:", error);
    throw error;
  }
}

/**
 * Saves a chat to the API
 */
export async function saveChat(chat: Chat): Promise<Chat> {
  try {
    // TODO: fix
    const apiBaseUrl = /*import.meta.env?.VITE_API_BASE_URL ||*/ "/api";
    const response = await fetch(`${apiBaseUrl}/chats/${chat.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chat),
    });

    if (!response.ok) {
      throw new Error(`Failed to save chat: ${response.statusText}`);
    }

    // @ts-ignore
    return await response.json();
  } catch (error) {
    console.error("Error saving chat:", error);
    throw error;
  }
}

/**
 * Deletes a chat from the API
 */
export async function deleteChat(chatId: string): Promise<void> {
  try {
    // TODO: fix
    const apiBaseUrl = /*import.meta.env?.VITE_API_BASE_URL ||*/ "/api";
    const response = await fetch(`${apiBaseUrl}/chats/${chatId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete chat: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
}
