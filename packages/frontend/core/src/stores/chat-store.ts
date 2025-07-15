/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  createChat,
  deleteMessages,
  fetchChatHistory,
  fetchChats,
  processChatStream,
  resetToCommit,
  type StreamCallbacks,
  type StreamRequestPayload,
  saveMessage,
} from "../services"; // Import the new service
import type {
  Chat,
  ChatMode,
  ContextItem,
  Message,
  MessageContent,
  ToolCall,
} from "../types";

// Fallback data in case fetch fails
const fallbackChats: Chat[] = [];

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
  isThinking: boolean;
  isLoading: boolean;
  loadError: string | null;
  abortController: AbortController | null; // For stopping fetch requests

  // Actions
  initializeStore: () => Promise<void>;
  setActiveChat: (chatId: string | null) => Promise<void>;
  createNewChat: () => void;
  sendMessage: (content: string) => Promise<void>; // Now async
  setIsResponding: (isResponding: boolean) => void;
  setIsThinking: (isThinking: boolean) => void;
  stopResponse: () => void;
  addContextItem: (item: Omit<ContextItem, "id">) => void;
  removeContextItem: (id: string) => void;
  setMode: (mode: ChatMode) => void;
  setModel: (model: string) => void;
  clearContextItems: () => void;
  deleteMessage: (messageId: string) => void;
  beautifyPromptStream: (
    currentPrompt: string,
    onTextDelta: (delta: string) => void,
    onComplete: (finalText: string) => void,
    onError: (error: Error) => void
  ) => void;
  saveMessageToChat: (
    chatId: string,
    content: string,
    role: "user" | "assistant",
    context?: any,
    toolCalls?: any
  ) => Promise<void>;
  loadChatHistory: (chatId: string) => Promise<void>;
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
        isThinking: false,
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

        setActiveChat: async (chatId) => {
          get().stopResponse(); // Stop any ongoing response when switching chats
          set({ activeChat: chatId, isLoading: true });

          if (chatId) {
            try {
              // Load chat history from server
              await get().loadChatHistory(chatId);
            } catch (error) {
              console.error("Failed to load chat history:", error);
              // Fallback to local messages if server fails
              const chat = get().chats.find((c) => c.id === chatId);
              set({ messages: chat ? chat.messages : [], isLoading: false });
            }
          } else {
            set({ messages: [], isLoading: false });
          }
        },

        createNewChat: () => {
          get().stopResponse(); // Stop any ongoing response
          set({
            activeChat: null,
            messages: [],
            contextItems: [],
            isThinking: false,
          });
        },

        sendMessage: async (content) => {
          const state = get();
          const { activeChat, chats, messages, contextItems, model, mode } =
            state;

          // Abort any existing request
          if (state.abortController) {
            state.abortController.abort();
          }
          const newAbortController = new AbortController();
          set({
            abortController: newAbortController,
            isResponding: true,
            isThinking: false,
          });

          // Create a deep copy of the messages array to avoid mutation issues
          const updatedMessages = [...messages];

          // Update pending diffs in the last AI message to "kept"
          // No longer need to process fileDiffs since they're removed

          // Create message content - automatically include context if available
          let messageContent: string | MessageContent[];

          if (contextItems.length > 0) {
            // Create multi-part content with text and context items
            messageContent = [
              {
                type: "text",
                text: content,
              },
              ...contextItems.map((item) => {
                if (item.type === "file" && item.data) {
                  if (item.mimeType?.startsWith("image/")) {
                    return {
                      ...item,
                      type: "image" as const,
                      image: item.data,
                      mimeType: item.mimeType,
                    } as any;
                  }
                }
                return {
                  ...item,
                  type: "text" as const,
                  text: `Context: ${item.name}\n${
                    typeof item.data === "string"
                      ? item.data
                      : JSON.stringify(item.data)
                  }`,
                };
              }),
            ];
          } else {
            // Use simple string content if not including context
            messageContent = content;
          }

          const userMessage: Message = {
            id: Date.now().toString(),
            content: messageContent,
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
            try {
              const title =
                content.slice(0, 30) + (content.length > 30 ? "..." : "");
              const newChat = await createChat(title);
              currentActiveChatId = newChat.id;
              updates.activeChat = newChat.id;
              updates.chats = [
                {
                  ...newChat,
                  messages: updatedMessages,
                },
                ...chats,
              ];
            } catch (error) {
              console.error("Failed to create chat:", error);
              // Fallback to local chat creation
              const newChatId = `chat-${Date.now()}`;
              currentActiveChatId = newChatId;
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
            }
          } else {
            updates.chats = chats.map((chat) =>
              chat.id === currentActiveChatId
                ? { ...chat, messages: updatedMessages }
                : chat
            );
          }
          set(updates);

          const aiMessageId = `${Date.now().toString()}-ai`;
          let assistantMessageSaved = false; // Flag to prevent duplicate saves
          const initialAiMessage: Message = {
            id: aiMessageId,
            content: "",
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            thinkingContent: "",
            isThinking: false,
          };

          // Add placeholder for AI's response
          set((currentState) => {
            const finalActiveChatId = currentState.activeChat; // Re-fetch activeChat in case it was set above
            return {
              messages: [...currentState.messages, initialAiMessage],
              chats: currentState.chats.map((chat) =>
                chat.id === finalActiveChatId
                  ? { ...chat, messages: [...chat.messages, initialAiMessage] }
                  : chat
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
              content: Array.isArray(m.content)
                ? m.content
                : [{ type: "text", text: m.content }],
              // Include tool calls in message history
              toolCalls: m.toolCalls
                ? Object.values(m.toolCalls).map((tc) => ({
                    id: tc.id,
                    type: "function",
                    function: {
                      name: tc.name,
                      arguments: JSON.stringify(tc.arguments),
                    },
                  }))
                : undefined,
            })),
            model: model, // Send selected model
            chatId: currentActiveChatId,
            // You might need to send contextItems, mode, etc., depending on agent's API
            // context_items: contextItems.map(item => ({ name: item.name, type: item.type, data: item.data })),
          };

          const updateAIMessageInStore = (
            updater: (currentAIMsg: Message) => Partial<Message>
          ) => {
            set((currentState) => {
              const finalActiveChatId = currentState.activeChat;
              const currentMsgs = [...currentState.messages];
              const aiMsgIdx = currentMsgs.findIndex(
                (m) => m.id === aiMessageId
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
                    : c
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
                    isThinking: false,
                  }));
                  set({ isThinking: false });
                },
                onThinkingDelta: (delta) => {
                  updateAIMessageInStore((msg) => ({
                    thinkingContent: (msg.thinkingContent || "") + delta,
                    isThinking: true,
                  }));
                  set({ isThinking: true });
                },
                onToolCall: (toolCall) => {
                  console.log("Store: Tool Call received", toolCall);

                  const incomingToolCall = toolCall as ToolCall;

                  updateAIMessageInStore((msg) => {
                    const existingToolCalls =
                      msg.toolCalls || ({} as Record<string, ToolCall>);
                    console.log("Store: Current tool calls", existingToolCalls);

                    // Create new Record with updated tool call
                    const updatedToolCalls = { ...existingToolCalls };
                    const existingToolCall =
                      updatedToolCalls[incomingToolCall.id];

                    console.log("Store: Existing tool call", existingToolCall);

                    updatedToolCalls[incomingToolCall.id] = incomingToolCall;
                    console.log("Store: Updated tool calls", updatedToolCalls);

                    return {
                      toolCalls: updatedToolCalls,
                      content: existingToolCall
                        ? msg.content // Don't append if updating existing
                        : (msg.content || "") +
                          `[toolCall:${incomingToolCall.id},${incomingToolCall.name}]`,
                    };
                  });
                },
                onStructuredData: (data) => {
                  updateAIMessageInStore((msg) => {
                    const newPartial: Partial<Message> = {};
                    return newPartial;
                  });
                },
                onStreamError: (errorMsg) => {
                  updateAIMessageInStore((msg) => ({
                    content: `${
                      msg.content || ""
                    }\n\nStream Error: ${errorMsg}`,
                  }));
                  set({
                    isResponding: false,
                    isThinking: false,
                    abortController: null,
                  }); // Stop on stream error
                },
                onStreamClose: (aborted) => {
                  if (aborted) {
                    updateAIMessageInStore((msg) => ({
                      content: `${
                        msg.content || ""
                      }\n(Response cancelled by user)`,
                    }));
                  }
                  set({ isThinking: false });
                  // Final state update handled in finally block of sendMessage
                },
                onCompletion: async (data) => {
                  console.log("Chat Store: Stream completed", data);
                  // Handle completion with usage statistics
                  // data contains: finishReason, usage (promptTokens, completionTokens), isContinued

                  // Save assistant message to database if we have an active chat (only once)
                  if (
                    currentActiveChatId &&
                    !assistantMessageSaved &&
                    data.finishReason === "stop"
                  ) {
                    assistantMessageSaved = true; // Set flag to prevent duplicate saves
                    try {
                      const currentState = get();
                      const aiMessage = currentState.messages.find(
                        (m) => m.id === aiMessageId
                      );
                      if (aiMessage) {
                        await saveMessage(
                          currentActiveChatId,
                          aiMessage.content as string,
                          "assistant",
                          undefined,
                          aiMessage.toolCalls
                        );
                      }
                    } catch (error) {
                      console.error("Failed to save assistant message:", error);
                      // Continue with the flow even if saving fails
                    }
                  }
                },
              },
              newAbortController.signal,
              mode
            );
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          } catch (error: any) {
            // Catch errors from processChatStream if it throws directly (should be rare)
            console.error(
              "Chat Store: Error calling processChatStream:",
              error
            );
            updateAIMessageInStore((msg) => ({
              content: `${msg.content || ""}\n\nError: ${
                error.message || "Failed to process response."
              }`,
            }));
          } finally {
            // Ensure isResponding and isThinking are set to false and controller is cleared
            if (
              get().isResponding ||
              get().abortController ||
              get().isThinking
            ) {
              // Check if not already set by onStreamError
              set({
                isResponding: false,
                isThinking: false,
                abortController: null,
              });
            }
          }
        },

        setIsResponding: (isResponding) => {
          set({ isResponding });
        },

        setIsThinking: (isThinking) => {
          set({ isThinking });
        },

        stopResponse: () => {
          if (get().abortController) {
            get().abortController?.abort();
          } else {
            set({ isResponding: false, isThinking: false });
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
        deleteMessage: async (messageId) => {
          const state = useChatStore.getState();
          if (!state.activeChat) return;

          try {
            // Call the delete service
            const result = await deleteMessages(state.activeChat, messageId);

            // Update the state optimistically
            set((state) => {
              const messageIndex = state.messages.findIndex(
                (msg) => msg.id === messageId
              );
              if (messageIndex === -1) return {};
              const updatedMessages = state.messages.slice(0, messageIndex);
              return {
                messages: updatedMessages,
                chats: state.chats.map((chat) =>
                  chat.id === state.activeChat
                    ? { ...chat, messages: updatedMessages }
                    : chat
                ),
              };
            });

            // Reset to commit if available from the server response
            if (result.commitToReset) {
              await resetToCommit(result.commitToReset);
            }
          } catch (error) {
            console.error("Error deleting message:", error);
            // Could add error handling here, like showing a toast notification
          }
        },

        beautifyPromptStream: async (
          currentPrompt,
          onTextDelta,
          onComplete,
          onError
        ) => {
          const state = get();
          if (!currentPrompt.trim()) {
            onComplete(currentPrompt);
            return;
          }

          const abortController = new AbortController();
          const timeoutId = setTimeout(() => {
            abortController.abort();
          }, 30000); // 30 second timeout

          try {
            const agentBaseUrl =
              import.meta.env?.VITE_AGENTS_BASE_URL || "http://localhost:3031/";
            const apiUrl = `${agentBaseUrl}api/beautify`;

            // Use recent messages for context (last 5 messages max)
            const recentMessages = state.messages.slice(-5).map((message) => ({
              role: message.isUser ? ("user" as const) : ("assistant" as const),
              content: message.content,
            }));

            const payload: StreamRequestPayload = {
              messages: [
                ...recentMessages,
                {
                  role: "user",
                  content: `Please improve and beautify the following text while preserving its meaning and intent. Return only the improved text without any additional explanation:\n\n${currentPrompt}`,
                },
              ],
              model: state.model,
              chatId: String(state.activeChat),
            };

            let beautifiedText = "";
            let streamError: string | null = null;

            const callbacks: StreamCallbacks = {
              onTextDelta: (delta: string) => {
                beautifiedText += delta;
                onTextDelta(delta);
              },
              onThinkingDelta: () => {
                // Ignore thinking content for beautification
              },
              onToolCall: () => {
                // Not expected for beautification
              },
              onStructuredData: () => {
                // Not expected for beautification
              },
              onStreamError: (error: string) => {
                streamError = error;
              },
              onStreamClose: (aborted: boolean) => {
                if (aborted && !abortController.signal.aborted) {
                  streamError = "Stream was unexpectedly closed";
                }
              },
              onCompletion: () => {
                // Stream completed successfully
                const result = beautifiedText.trim() || currentPrompt;
                onComplete(result);
              },
            };

            await processChatStream(
              apiUrl,
              payload,
              callbacks,
              abortController.signal
            );

            // Check for errors after stream completion
            if (streamError) {
              throw new Error(`Beautify stream error: ${streamError}`);
            }

            if (abortController.signal.aborted) {
              throw new Error("Beautify request timed out");
            }
          } catch (error) {
            console.error("Failed to beautify prompt:", error);

            // Handle errors appropriately
            if (error instanceof Error && error.name === "AbortError") {
              onError(new Error("Beautify request timed out"));
            } else {
              onError(
                new Error(
                  error instanceof Error
                    ? `Failed to beautify text: ${error.message}`
                    : "Failed to beautify text"
                )
              );
            }
          } finally {
            clearTimeout(timeoutId);
          }
        },

        saveMessageToChat: async (
          chatId,
          content,
          role,
          context,
          toolCalls
        ) => {
          try {
            await saveMessage(chatId, content, role, context, toolCalls);
          } catch (error) {
            console.error("Failed to save message to chat:", error);
            throw error;
          }
        },

        loadChatHistory: async (chatId) => {
          try {
            const historyData = await fetchChatHistory(chatId);

            // Convert server history format to frontend Message format
            const messages: Message[] = historyData.history.map((msg) => {
              let message: string | any[];
              try {
                message = JSON.parse(msg.message);
                message = message[0].text;
              } catch (_e) {
                message = msg.message;
              }

              return {
                id: msg.id,
                content: message,
                isUser: msg.role === "user",
                timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                contextItems: msg.context ? JSON.parse(msg.context) : [],
                toolCalls: msg.toolCalls ? JSON.parse(msg.toolCalls) : {},
              };
            });

            set({
              messages,
              isLoading: false,
            });

            // Update the chat in the chats array with loaded messages
            set((state) => ({
              chats: state.chats.map((chat) =>
                chat.id === chatId ? { ...chat, messages } : chat
              ),
            }));
          } catch (error) {
            console.error("Failed to load chat history:", error);
            set({ isLoading: false });
            throw error;
          }
        },
      }),
      {
        name: "ai-chat-storage-v2", // Consider versioning storage name if state shape changes significantly
        partialize: (state) => ({
          chats: state.chats,
          model: state.model,
          mode: state.mode,
        }),
      }
    )
  )
);
