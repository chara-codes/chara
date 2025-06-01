"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Chat, ChatMode, ContextItem, Message } from "./types";
import { fetchChats } from "../services/data-service";
import {
  processChatStream,
  type StreamRequestPayload,
} from "../services/stream-service"; // Import the new service

// Fallback data in case fetch fails
const fallbackChats: Chat[] = [
  {
    id: "fallback-1",
    title: "Fallback Chat (Data Load Failed)",
    timestamp: new Date().toLocaleString(),
    messages: [],
  },
];

interface ChatState {
  // Chat data
  chats: Chat[];
  activeChat: string | null;
  messages: Message[];
  contextItems: ContextItem[];

  // UI state
  mode: ChatMode;
  model: string;
  isResponding: boolean;
  isLoading: boolean;
  loadError: string | null;
  abortController: AbortController | null; // For stopping fetch requests

  // Actions
  initializeStore: () => Promise<void>;
  setActiveChat: (chatId: string | null) => void;
  createNewChat: () => void;
  sendMessage: (content: string) => Promise<void>; // Now async
  setIsResponding: (isResponding: boolean) => void;
  stopResponse: () => void;
  addContextItem: (item: Omit<ContextItem, "id">) => void;
  removeContextItem: (id: string) => void;
  setMode: (mode: ChatMode) => void;
  setModel: (model: string) => void;
  clearContextItems: () => void;
  updateDiffStatus: (
    messageId: string,
    diffId: string,
    status: "pending" | "kept" | "reverted",
  ) => void;
  updateAllDiffStatuses: (
    messageId: string,
    status: "kept" | "reverted",
  ) => void;
  deleteMessage: (messageId: string) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        chats: [],
        activeChat: null,
        messages: [],
        contextItems: [],
        mode: "write" as ChatMode,
        model: "claude-3.7-sonnet", // Default model
        isResponding: false,
        isLoading: true,
        loadError: null,
        abortController: null,

        initializeStore: async () => {
          set({ isLoading: true, loadError: null });
          try {
            const chats = await fetchChats();
            set({
              chats: chats.length > 0 ? chats : fallbackChats,
              isLoading: false,
            });
          } catch (error) {
            console.error("Failed to initialize store:", error);
            set({
              chats: fallbackChats,
              isLoading: false,
              loadError:
                error instanceof Error ? error.message : "Failed to load data",
            });
          }
        },

        setActiveChat: (chatId) => {
          get().stopResponse(); // Stop any ongoing response when switching chats
          set({ activeChat: chatId });
          if (chatId) {
            const chat = get().chats.find((c) => c.id === chatId);
            set({ messages: chat ? chat.messages : [] });
          } else {
            set({ messages: [] });
          }
        },

        createNewChat: () => {
          get().stopResponse(); // Stop any ongoing response
          set({
            activeChat: null,
            messages: [],
            contextItems: [],
          });
        },

        sendMessage: async (content) => {
          const state = get();
          const { activeChat, chats, messages, contextItems, model } = state;

          // Abort any existing request
          if (state.abortController) {
            state.abortController.abort();
          }
          const newAbortController = new AbortController();
          set({ abortController: newAbortController, isResponding: true });

          // Create a deep copy of the messages array to avoid mutation issues
          const updatedMessages = [...messages];

          // Update pending diffs in the last AI message to "kept"
          for (let i = updatedMessages.length - 1; i >= 0; i--) {
            const msg = updatedMessages[i];
            if (!msg.isUser && msg.fileDiffs && msg.fileDiffs.length > 0) {
              updatedMessages[i] = {
                ...msg,
                fileDiffs: msg.fileDiffs.map((diff) => ({
                  ...diff,
                  status: diff.status === "pending" ? "kept" : diff.status,
                })),
              };
              break;
            }
          }

          const userMessage: Message = {
            id: Date.now().toString(),
            content,
            isUser: true,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            contextItems:
              contextItems.length > 0 ? [...contextItems] : undefined,
          };
          updatedMessages.push(userMessage);

          const updates: Partial<ChatState> = {
            messages: updatedMessages,
            contextItems: [], // Clear context items after sending
          };

          let currentActiveChatId = activeChat;
          if (!currentActiveChatId) {
            const newChatId = `chat-${Date.now()}`;
            currentActiveChatId = newChatId; // Update currentActiveChatId for this scope
            updates.activeChat = newChatId;
            updates.chats = [
              {
                id: newChatId,
                title:
                  content.slice(0, 30) + (content.length > 30 ? "..." : ""),
                timestamp: new Date().toLocaleString([], {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                messages: updatedMessages,
              },
              ...chats,
            ];
          } else {
            updates.chats = chats.map((chat) =>
              chat.id === currentActiveChatId
                ? { ...chat, messages: updatedMessages }
                : chat,
            );
          }
          set(updates);

          const aiMessageId = Date.now().toString() + "-ai";
          const initialAiMessage: Message = {
            id: aiMessageId,
            content: "",
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            filesToChange: [],
            commandsToExecute: [],
            executedCommands: [],
            fileDiffs: [],
          };

          // Add placeholder for AI's response
          set((currentState) => {
            const finalActiveChatId = currentState.activeChat; // Re-fetch activeChat in case it was set above
            return {
              messages: [...currentState.messages, initialAiMessage],
              chats: currentState.chats.map((chat) =>
                chat.id === finalActiveChatId
                  ? { ...chat, messages: [...chat.messages, initialAiMessage] }
                  : chat,
              ),
            };
          });

          const agentBaseUrl =
            import.meta.env?.VITE_AGENTS_BASE_URL || "http://localhost:3031/"; // Default to local agent
          const apiUrl = `${agentBaseUrl}api/chat`;

          const agentPayload: StreamRequestPayload = {
            messages: updatedMessages.map((m) => ({
              // Send current message history
              role: m.isUser ? "user" : "assistant",
              content: m.content,
              // TODO: If your agent supports tool_calls/tool_results in history, map them here
            })),
            model: model, // Send selected model
            // You might need to send contextItems, mode, etc., depending on agent's API
            // context_items: contextItems.map(item => ({ name: item.name, type: item.type, data: item.data })),
          };

          const updateAIMessageInStore = (
            updater: (currentAIMsg: Message) => Partial<Message>,
          ) => {
            set((currentState) => {
              const finalActiveChatId = currentState.activeChat;
              const currentMsgs = [...currentState.messages];
              const aiMsgIdx = currentMsgs.findIndex(
                (m) => m.id === aiMessageId,
              );
              if (aiMsgIdx === -1) return {};

              const updatedAIMsgPart = updater(currentMsgs[aiMsgIdx]);
              currentMsgs[aiMsgIdx] = {
                ...currentMsgs[aiMsgIdx],
                ...updatedAIMsgPart,
              };

              return {
                messages: currentMsgs,
                chats: currentState.chats.map((c) =>
                  c.id === finalActiveChatId
                    ? { ...c, messages: currentMsgs }
                    : c,
                ),
              };
            });
          };

          try {
            await processChatStream(
              apiUrl,
              agentPayload,
              {
                onTextDelta: (delta) => {
                  updateAIMessageInStore((msg) => ({
                    content: (msg.content || "") + delta,
                  }));
                },
                onToolCall: (toolCall) => {
                  console.log("Store: Tool Call received", toolCall);
                  // updateAIMessageInStore(msg => ({ toolCalls: [...(msg.toolCalls || []), toolCall] }));
                },
                onStructuredData: (data) => {
                  updateAIMessageInStore((msg) => {
                    const newPartial: Partial<Message> = {};
                    if (data.fileDiffs) {
                      newPartial.fileDiffs = [
                        ...(msg.fileDiffs || []),
                        ...data.fileDiffs,
                      ];
                    }
                    if (data.filesToChange) {
                      newPartial.filesToChange = [
                        ...(msg.filesToChange || []),
                        ...data.filesToChange,
                      ];
                    }
                    if (data.commandsToExecute) {
                      newPartial.commandsToExecute = [
                        ...(msg.commandsToExecute || []),
                        ...data.commandsToExecute,
                      ];
                    }
                    if (data.executedCommands) {
                      newPartial.executedCommands = [
                        ...(msg.executedCommands || []),
                        ...data.executedCommands,
                      ];
                    }
                    return newPartial;
                  });
                },
                onStreamError: (errorMsg) => {
                  updateAIMessageInStore((msg) => ({
                    content:
                      (msg.content || "") + `\n\nStream Error: ${errorMsg}`,
                  }));
                  set({ isResponding: false, abortController: null }); // Stop on stream error
                },
                onStreamClose: (aborted) => {
                  if (aborted) {
                    updateAIMessageInStore((msg) => ({
                      content:
                        (msg.content || "") + "\n(Response cancelled by user)",
                    }));
                  }
                  // Final state update handled in finally block of sendMessage
                },
              },
              newAbortController.signal,
            );
          } catch (error: any) {
            // Catch errors from processChatStream if it throws directly (should be rare)
            console.error(
              "Chat Store: Error calling processChatStream:",
              error,
            );
            updateAIMessageInStore((msg) => ({
              content:
                (msg.content || "") +
                `\n\nError: ${error.message || "Failed to process response."}`,
            }));
          } finally {
            // Ensure isResponding is set to false and controller is cleared
            if (get().isResponding || get().abortController) {
              // Check if not already set by onStreamError
              set({ isResponding: false, abortController: null });
            }
          }
        },

        setIsResponding: (isResponding) => {
          set({ isResponding });
        },

        stopResponse: () => {
          if (get().abortController) {
            get().abortController!.abort();
          } else {
            set({ isResponding: false });
          }
        },

        addContextItem: (item) => {
          const newContextItem: ContextItem = {
            id: Date.now().toString(),
            ...item,
          };
          set((state) => ({
            contextItems: [...state.contextItems, newContextItem],
          }));
        },

        removeContextItem: (id) => {
          set((state) => ({
            contextItems: state.contextItems.filter((item) => item.id !== id),
          }));
        },

        clearContextItems: () => set({ contextItems: [] }),
        setMode: (mode) => set({ mode }),
        setModel: (model) => set({ model }),

        updateDiffStatus: (messageId, diffId, status) => {
          set((state) => {
            const updatedMessages = state.messages.map((message) => {
              if (message.id === messageId && message.fileDiffs) {
                return {
                  ...message,
                  fileDiffs: message.fileDiffs.map((diff) =>
                    diff.id === diffId ? { ...diff, status } : diff,
                  ),
                };
              }
              return message;
            });
            return {
              messages: updatedMessages,
              chats: state.chats.map((chat) =>
                chat.id === state.activeChat
                  ? { ...chat, messages: updatedMessages }
                  : chat,
              ),
            };
          });
        },

        updateAllDiffStatuses: (messageId, status) => {
          set((state) => {
            const updatedMessages = state.messages.map((message) => {
              if (message.id === messageId && message.fileDiffs) {
                return {
                  ...message,
                  fileDiffs: message.fileDiffs.map((diff) => ({
                    ...diff,
                    status,
                  })),
                };
              }
              return message;
            });
            return {
              messages: updatedMessages,
              chats: state.chats.map((chat) =>
                chat.id === state.activeChat
                  ? { ...chat, messages: updatedMessages }
                  : chat,
              ),
            };
          });
        },

        deleteMessage: (messageId) => {
          set((state) => {
            const messageIndex = state.messages.findIndex(
              (msg) => msg.id === messageId,
            );
            if (messageIndex === -1) return {};
            const updatedMessages = state.messages.slice(0, messageIndex);
            return {
              messages: updatedMessages,
              chats: state.chats.map((chat) =>
                chat.id === state.activeChat
                  ? { ...chat, messages: updatedMessages }
                  : chat,
              ),
            };
          });
        },
      }),
      {
        name: "ai-chat-storage-v2", // Consider versioning storage name if state shape changes significantly
        partialize: (state) => ({
          chats: state.chats,
          model: state.model,
          mode: state.mode,
        }),
      },
    ),
  ),
);
