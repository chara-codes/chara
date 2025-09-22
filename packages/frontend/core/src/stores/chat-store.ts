"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import type React from "react";
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

// Throttle utility for preventing excessive updates
interface ThrottleState {
  lastUpdate: number;
  timeout: NodeJS.Timeout | null;
  pendingMessages: UIMessage[] | null;
}

const createThrottledMessageUpdater = (
  setState: (updater: (state: ChatState) => ChatState) => void,
  delay: number = 500
) => {
  const throttleState: ThrottleState = {
    lastUpdate: 0,
    timeout: null,
    pendingMessages: null,
  };

  return (messages: UIMessage[]) => {
    const now = Date.now();

    // Store the latest messages
    throttleState.pendingMessages = messages;

    // If we're within the throttle window, schedule an update
    if (now - throttleState.lastUpdate < delay) {
      if (throttleState.timeout) {
        clearTimeout(throttleState.timeout);
      }

      throttleState.timeout = setTimeout(() => {
        if (throttleState.pendingMessages) {
          setState((state) => ({
            ...state,
            currentMessages: throttleState.pendingMessages,
          }));
          throttleState.lastUpdate = Date.now();
          throttleState.pendingMessages = null;
          throttleState.timeout = null;
        }
      }, delay - (now - throttleState.lastUpdate));

      return;
    }

    // Update immediately if enough time has passed
    setState((state) => ({ ...state, currentMessages: messages }));
    throttleState.lastUpdate = now;
    throttleState.pendingMessages = null;
  };
};

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

  // Get configuration for beautify chat using useChat hook
  getBeautifyChatConfig: () => {
    api: string;
    transport: DefaultChatTransport<UIMessage>;
    generateId: () => string;
    id?: string;
  };

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
  setMessagesImmediate: (messages: UIMessage[]) => void;
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
      (set, get) => {
        // Create throttled message updater to prevent infinite loops
        const throttledSetMessages = createThrottledMessageUpdater(set, 500);

        return {
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
            set({ isLoading: true, loadError: null });

            try {
              const chats = await fetchChats();
              set({
                chats: chats.length > 0 ? chats : [],
                isLoading: false,
              });

              // Load messages for persisted activeChat
              const currentState = get();
              if (currentState.activeChat) {
                try {
                  await get().loadChatHistory(currentState.activeChat);
                } catch (error) {
                  console.error(
                    "Chat Store: Failed to load messages for persisted activeChat:",
                    error
                  );
                  // Don't fail initialization, just clear the activeChat
                  set({ activeChat: null });
                }
              }
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
            if (chatId === get().activeChat) {
              return;
            }

            set({ activeChat: chatId, currentMessages: [] });

            if (chatId) {
              try {
                await get().loadChatHistory(chatId);
              } catch (error) {
                console.error(
                  "Chat Store: Failed to load chat history:",
                  error
                );
                set({ loadError: "Failed to load chat history" });
              }
            }
          },

          createNewChat: async (title: string = "New Chat") => {
            try {
              const newChat = await createChat(title);
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
            try {
              const updatedChat = await updateChat(chatId, updates);

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
            try {
              const { chats, currentMessages, activeChat } = get();
              const chat = chats.find((c) => c.id === chatId);

              if (!chat) {
                return;
              }

              if (!isDefaultChatTitle(chat.title)) {
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
                return;
              }

              // Generate title from message content
              const title = generateTitleFromContent(messageContent);

              if (title.length === 0) {
                return;
              }

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
            try {
              const result = await fetchChatHistory(chatId);
              // Convert server messages to proper UIMessage format with typed roles
              const uiMessages: UIMessage[] = result.history.map(
                (msg: ServerMessage) => ({
                  ...msg,
                  role: msg.role as "system" | "user" | "assistant",
                  parts: msg.parts as UIMessage["parts"], // Cast to satisfy UIMessage type requirements
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
            // Use throttled updates to prevent infinite loops during streaming
            throttledSetMessages(messages);
          },

          setMessagesImmediate: (messages: UIMessage[]) => {
            // Immediate update for critical operations (bypasses throttling)
            set({ currentMessages: messages });
          },

          onChatFinish: async (_message: UIMessage) => {
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
              id: `ctx_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2)}`,
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
            set({ mode });
          },

          setModel: (model: string) => {
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
            // This function provides configuration for components to use with useChat
            // The actual implementation should be done in React components using useBeautifyChat hook

            console.warn(
              "beautifyPromptStream: Consider using useBeautifyChat hook in React components for better integration with AI SDK"
            );

            // Fallback implementation using fetch for backward compatibility
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
                  throw new Error(
                    `Beautify request failed: ${response.status}`
                  );
                }

                const reader = response.body?.getReader();
                if (!reader) {
                  throw new Error("No response stream available");
                }

                let fullText = "";
                const decoder = new TextDecoder();

                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });

                    // Handle AI SDK UI stream format
                    const lines = chunk
                      .split("\n")
                      .filter((line) => line.trim());

                    for (const line of lines) {
                      try {
                        const data = JSON.parse(line);

                        // Handle UIMessage format from AI SDK
                        if (data.type === "text-delta" && data.textDelta) {
                          const delta = data.textDelta;
                          fullText += delta;
                          onTextDelta(delta);
                        } else if (data.type === "finish") {
                          break;
                        }
                      } catch {
                        // Skip malformed JSON or handle plain text chunks
                        if (chunk.trim()) {
                          fullText += chunk;
                          onTextDelta(chunk);
                        }
                      }
                    }
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

          // Get configuration for beautify chat using useChat hook
          getBeautifyChatConfig: () => {
            const { model, activeChat } = get();
            const agentsUrl =
              import.meta.env?.VITE_AGENTS_BASE_URL || "http://localhost:3031/";
            const beautifyUrl = `${agentsUrl}api/beautify`;

            return {
              api: beautifyUrl,
              transport: new DefaultChatTransport({
                api: beautifyUrl,
                body: {
                  model,
                  chatId: activeChat,
                },
                headers: {
                  "Content-Type": "application/json",
                },
              }),
              generateId: () =>
                `beautify_${Date.now()}_${Math.random()
                  .toString(36)
                  .substring(2)}`,
              id: activeChat || undefined,
            };
          },
        };
      },
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
 * Hook for beautifying prompts using useChat from AI SDK
 * This provides a React hook interface for prompt beautification with streaming
 *
 * Usage:
 * ```ts
 * const beautifyChat = useBeautifyChat();
 *
 * const handleBeautify = () => {
 *   beautifyChat.sendMessage({ text: "Make this prompt better" });
 * };
 *
 * // Monitor streaming updates
 * useEffect(() => {
 *   const lastMessage = beautifyChat.messages[beautifyChat.messages.length - 1];
 *   if (lastMessage?.role === "assistant") {
 *     // Handle streaming text updates
 *     const text = lastMessage.parts
 *       .filter(part => part.type === "text")
 *       .map(part => part.text)
 *       .join("");
 *     // Update UI with text
 *   }
 * }, [beautifyChat.messages]);
 * ```
 */
export const useBeautifyChat = (): {
  messages: UIMessage[];
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (event?: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  error: Error | undefined;
  beautifyPrompt: (prompt: string) => void;
} => {
  const store = useChatStore();
  const config = store.getBeautifyChatConfig();

  const chatHook = useChat({
    transport: config.transport,
    generateId: config.generateId,
    id: config.id,
  });

  return {
    ...chatHook,
    beautifyPrompt: (prompt: string) => {
      return chatHook.sendMessage({
        text: prompt,
      });
    },
  };
};

/**
 * Default export for backward compatibility
 */
export { useChatStore as default };
