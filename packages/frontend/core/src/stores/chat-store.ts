"use client";

import type { UIMessage } from "ai";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  createChat,
  fetchChatHistory,
  fetchChats,
  getSuggestedPrompts,
  resetToCommit,
  updateChat,
} from "../services";
import type { Chat, ChatMode, ContextItem } from "../types";
import {
  generateTitleFromContent,
  isDefaultChatTitle,
} from "../utils/chat-utils";

/**
 * Interface for messages returned from the server
 */
interface ServerMessage {
  id: string;
  role: string;
  parts: Array<{
    type: string;
    text?: string;
    [key: string]: unknown;
  }>;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

/**
 * Chat store state interface using AI SDK patterns
 * This store manages chat sessions, messages in UIMessage format, and context items
 */
interface ChatState {
  // Chat data
  chats: Chat[];
  activeChat: string | null;
  currentMessages: UIMessage[];
  contextItems: ContextItem[];

  // UI state
  mode: ChatMode;
  model: string;
  isLoading: boolean;
  loadError: string | null;

  // Actions
  initializeStore: () => Promise<void>;
  setActiveChat: (chatId: string | null) => Promise<void>;
  createNewChat: (title: string) => Promise<string>;
  updateChat: (
    chatId: string,
    updates: {
      title?: string;
      status?: "idle" | "in_progress" | "completed" | "error";
    }
  ) => Promise<void>;
  updateChatTitleFromFirstMessage: (
    chatId: string,
    messageContent: string
  ) => Promise<void>;
  addContextItem: (item: Omit<ContextItem, "id">) => void;
  removeContextItem: (id: string) => void;
  setMode: (mode: ChatMode) => void;
  setModel: (model: string) => void;
  clearContextItems: () => void;
  loadChatHistory: (chatId: string) => Promise<void>;
  getSuggestedPrompts: () => Promise<string[]>;
  resetToCommit: (commitHash: string) => Promise<void>;
  beautifyPromptStream: (
    currentPrompt: string,
    onTextDelta: (delta: string) => void,
    onComplete: (finalText: string) => void,
    onError: (error: Error) => void
  ) => void;

  // Chat hook integration
  getChatConfig: () => {
    api: string;
    onFinish: (message: UIMessage) => Promise<void>;
    generateId: () => string;
    body: {
      chatId: string;
      model: string;
      mode: ChatMode;
    };
    headers: {
      "Content-Type": string;
    };
  };

  // Message management
  setMessages: (messages: UIMessage[]) => void;
  onChatFinish: (message: UIMessage) => Promise<void>;
}

/**
 * Zustand store for managing chat state with AI SDK integration
 *
 * Features:
 * - UIMessage format compatibility with @ai-sdk/react
 * - Message persistence through tRPC
 * - Context items management
 * - Direct API integration with /api/chat endpoint
 *
 * Usage:
 * ```ts
 * const { activeChat, currentMessages, setActiveChat } = useChatStore();
 * const chatConfig = getChatHookConfig(activeChat, model, mode, onFinish);
 * const chat = useChat(chatConfig);
 * ```
 */
export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        chats: [],
        activeChat: null,
        currentMessages: [],
        contextItems: [],
        mode: "write" as ChatMode,
        model: "openai:::gpt-4o-mini", // Default model
        isLoading: true,
        loadError: null,

        initializeStore: async () => {
          console.log("Chat Store: Starting initialization...");
          set({ isLoading: true, loadError: null });

          try {
            console.log("Chat Store: Fetching chats...");
            const chats = await fetchChats();
            console.log(
              "Chat Store: Chats fetched successfully, count:",
              chats.length
            );

            set({
              chats: chats.length > 0 ? chats : [],
              isLoading: false,
            });

            // Load messages for persisted activeChat
            const currentState = get();
            if (currentState.activeChat) {
              console.log(
                "Chat Store: Found persisted activeChat, loading messages for:",
                currentState.activeChat
              );
              try {
                await get().loadChatHistory(currentState.activeChat);
                console.log(
                  "Chat Store: Messages loaded for persisted activeChat"
                );
              } catch (error) {
                console.error(
                  "Chat Store: Failed to load messages for persisted activeChat:",
                  error
                );
                // Don't fail initialization, just clear the activeChat
                set({ activeChat: null });
              }
            }

            console.log("Chat Store: Initialization completed successfully");
          } catch (error) {
            console.error("Chat Store: Failed to initialize:", error);
            set({
              loadError:
                error instanceof Error
                  ? error.message
                  : "Failed to initialize chat store",
              isLoading: false,
            });
          }
        },

        setActiveChat: async (chatId: string | null) => {
          console.log("Chat Store: Setting active chat to:", chatId);

          if (chatId === get().activeChat) {
            console.log("Chat Store: Chat already active, skipping");
            return;
          }

          set({ activeChat: chatId, currentMessages: [] });

          if (chatId) {
            try {
              await get().loadChatHistory(chatId);
            } catch (error) {
              console.error("Chat Store: Failed to load chat history:", error);
              set({ loadError: "Failed to load chat history" });
            }
          }
        },

        createNewChat: async (title: string = "New Chat") => {
          try {
            const newChat = await createChat(title);
            console.log("Chat Store: New chat created:", newChat);

            // Add to chats list
            set((state) => ({
              chats: [newChat, ...state.chats],
              activeChat: newChat.id,
              currentMessages: [],
              loadError: null,
            }));

            return newChat.id;
          } catch (error) {
            console.error("Chat Store: Failed to create new chat:", error);
            set({
              loadError:
                error instanceof Error
                  ? error.message
                  : "Failed to create new chat",
            });
            throw error;
          }
        },

        updateChat: async (
          chatId: string,
          updates: {
            title?: string;
            status?: "idle" | "in_progress" | "completed" | "error";
          }
        ) => {
          console.log("Chat Store: Updating chat:", chatId, updates);
          try {
            const updatedChat = await updateChat(chatId, updates);
            console.log("Chat Store: Chat updated successfully:", updatedChat);

            // Update the chat in the store
            set((state) => ({
              chats: state.chats.map((chat) =>
                chat.id === chatId
                  ? {
                      ...chat,
                      title: updatedChat.title,
                      timestamp: updatedChat.timestamp,
                    }
                  : chat
              ),
              loadError: null,
            }));
          } catch (error) {
            console.error("Chat Store: Failed to update chat:", error);
            set({
              loadError:
                error instanceof Error
                  ? error.message
                  : "Failed to update chat",
            });
            throw error;
          }
        },

        updateChatTitleFromFirstMessage: async (
          chatId: string,
          messageContent: string
        ) => {
          console.log(
            "Chat Store: Checking if title should be updated for chat:",
            chatId
          );
          try {
            const { chats, currentMessages, activeChat } = get();
            const chat = chats.find((c) => c.id === chatId);

            if (!chat) {
              console.log("Chat Store: Chat not found, skipping title update");
              return;
            }

            if (!isDefaultChatTitle(chat.title)) {
              console.log(
                "Chat Store: Chat title is not default, skipping update"
              );
              return;
            }

            // Check if this is the first message by checking local messages first
            let messageCount = 0;
            if (activeChat === chatId && currentMessages.length > 0) {
              messageCount = currentMessages.length;
            } else {
              // Fallback to API call if not in current chat or no local messages
              const result = await fetchChatHistory(chatId);
              messageCount = result.history.length;
            }

            if (messageCount > 1) {
              console.log(
                "Chat Store: Chat already has messages, skipping title update"
              );
              return;
            }

            // Generate title from message content
            const title = generateTitleFromContent(messageContent);

            if (title.length === 0) {
              console.log(
                "Chat Store: Empty message content, skipping title update"
              );
              return;
            }

            console.log("Chat Store: Updating chat title to:", title);
            await get().updateChat(chatId, { title });
          } catch (error) {
            console.error(
              "Chat Store: Failed to update chat title from first message:",
              error
            );
            // Don't throw error - this is a non-critical operation
          }
        },

        loadChatHistory: async (chatId: string) => {
          console.log("Chat Store: Loading chat history for:", chatId);
          try {
            const result = await fetchChatHistory(chatId);
            console.log(
              "Chat Store: Chat history loaded, message count:",
              result.history.length
            );

            // Convert server messages to proper UIMessage format with typed roles
            const uiMessages: UIMessage[] = result.history.map(
              (msg: ServerMessage) => ({
                ...msg,
                role: msg.role as "system" | "user" | "assistant",
                parts: msg.parts as any, // Cast to satisfy UIMessage type requirements
              })
            );
            set({ currentMessages: uiMessages, loadError: null });
          } catch (error) {
            console.error("Chat Store: Failed to load chat history:", error);
            set({
              loadError:
                error instanceof Error
                  ? error.message
                  : "Failed to load chat history",
              currentMessages: [],
            });
          }
        },

        setMessages: (messages: UIMessage[]) => {
          set({ currentMessages: messages });
        },

        onChatFinish: async (message: UIMessage) => {
          console.log("Chat Store: Chat finished, saving message:", message.id);

          const { activeChat, chats } = get();
          if (!activeChat) {
            console.warn("Chat Store: No active chat to save message to");
            return;
          }

          try {
            // Update the chat's timestamp
            const updatedChats = chats.map((chat) =>
              chat.id === activeChat
                ? { ...chat, timestamp: new Date().toISOString() }
                : chat
            );

            set({ chats: updatedChats });
            console.log("Chat Store: Message saved and chat updated");
          } catch (error) {
            console.error(
              "Chat Store: Failed to update chat after message:",
              error
            );
          }
        },

        getChatConfig: () => {
          const { activeChat, model, mode } = get();

          if (!activeChat) {
            throw new Error("No active chat selected");
          }

          const agentsUrl =
            import.meta.env?.VITE_AGENTS_BASE_URL || "http://localhost:3031/";
          const apiUrl = `${agentsUrl}api/chat`;

          return {
            api: apiUrl,
            onFinish: get().onChatFinish,
            generateId: () =>
              `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            body: {
              chatId: activeChat,
              model,
              mode,
            },
            headers: {
              "Content-Type": "application/json",
            },
          };
        },

        addContextItem: (item: Omit<ContextItem, "id">) => {
          const newItem: ContextItem = {
            ...item,
            id: `ctx_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          };
          set((state) => ({
            contextItems: [...state.contextItems, newItem],
          }));
        },

        removeContextItem: (id: string) => {
          set((state) => ({
            contextItems: state.contextItems.filter((item) => item.id !== id),
          }));
        },

        setMode: (mode: ChatMode) => {
          console.log("Chat Store: Setting mode to:", mode);
          set({ mode });
        },

        setModel: (model: string) => {
          console.log("Chat Store: Setting model to:", model);
          set({ model });
        },

        clearContextItems: () => {
          set({ contextItems: [] });
        },

        getSuggestedPrompts: async () => {
          try {
            const { model } = get();
            const prompts = await getSuggestedPrompts(model, [], 10);
            return prompts;
          } catch (error) {
            console.error(
              "Chat Store: Failed to get suggested prompts:",
              error
            );
            return [];
          }
        },

        resetToCommit: async (commitHash: string) => {
          try {
            await resetToCommit(commitHash);
            console.log(
              "Chat Store: Successfully reset to commit:",
              commitHash
            );
          } catch (error) {
            console.error("Chat Store: Failed to reset to commit:", error);
            throw error;
          }
        },

        beautifyPromptStream: (
          currentPrompt: string,
          onTextDelta: (delta: string) => void,
          onComplete: (finalText: string) => void,
          onError: (error: Error) => void
        ) => {
          // Implementation for beautifying prompts using streaming
          const agentsUrl =
            import.meta.env?.VITE_AGENTS_BASE_URL || "http://localhost:3031/";
          const beautifyUrl = `${agentsUrl}api/beautify`;

          fetch(beautifyUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: currentPrompt,
              model: get().model,
            }),
          })
            .then(async (response) => {
              if (!response.ok) {
                throw new Error(`Beautify request failed: ${response.status}`);
              }

              const reader = response.body?.getReader();
              if (!reader) {
                throw new Error("No response stream available");
              }

              let fullText = "";
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  const chunk = new TextDecoder().decode(value);
                  fullText += chunk;
                  onTextDelta(chunk);
                }
                onComplete(fullText);
              } finally {
                reader.releaseLock();
              }
            })
            .catch((error) => {
              console.error("Chat Store: Beautify stream failed:", error);
              onError(
                error instanceof Error ? error : new Error(String(error))
              );
            });
        },
      }),
      {
        name: "chat-store",
        partialize: (state) => ({
          activeChat: state.activeChat,
          mode: state.mode,
          model: state.model,
          contextItems: state.contextItems,
        }),
      }
    ),
    {
      name: "chat-store",
    }
  )
);

/**
 * Helper function to create configuration for @ai-sdk/react useChat hook
 *
 * @param activeChat - Current active chat ID
 * @param model - AI model to use (e.g., "openai:::gpt-4o-mini")
 * @param mode - Chat mode ("ask" or "write")
 * @param onFinish - Callback when chat completes
 * @returns Configuration object for useChat hook
 *
 * @example
 * ```ts
 * const store = useChatStore();
 * const config = getChatHookConfig(
 *   store.activeChat,
 *   store.model,
 *   store.mode,
 *   store.onChatFinish
 * );
 * const chat = useChat(config);
 * ```
 */
export const getChatHookConfig = (
  activeChat: string | null,
  model: string,
  mode: ChatMode,
  onFinish: (message: UIMessage) => Promise<void>
) => {
  if (!activeChat) {
    return null;
  }

  const agentsUrl =
    import.meta.env?.VITE_AGENTS_BASE_URL || "http://localhost:3031/";
  const apiUrl = `${agentsUrl}api/chat`;

  return {
    api: apiUrl,
    id: activeChat,
    body: {
      chatId: activeChat,
      model,
      mode,
    },
    headers: {
      "Content-Type": "application/json",
    },
    generateId: () =>
      `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    onFinish,
  };
};

/**
 * Default export for backward compatibility
 */
export { useChatStore as default };
