/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  chatService,
  createChat,
  deleteMessages,
  fetchChatHistory,
  fetchChats,
  fetchFirstMessageFromRecentChats,
  getSuggestedPrompts,
  resetToCommit,
  saveMessage,
  webSocketService,
  type WebSocketChatCallbacks,
} from "../services";
import type {
  Chat,
  ChatMode,
  ContextItem,
  Message,
  MessageContent,
  ToolCall,
} from "../types";
import { THINKING_TAG_REGEX } from "../utils";

// Fallback data in case fetch fails
const fallbackChats: Chat[] = [];

// Predefined prompts for immediate display while loading
// Note: These prompts are also used in conversation-suggestions.tsx as placeholder content
export const PREDEFINED_PROMPTS = [
  "Help me brainstorm ideas for a new mobile app that helps people track their daily habits",
  "How do I implement a debounce function in JavaScript?",
  "Write a professional email to request a meeting with a potential client",
  "Explain the concept of React hooks and how they improve component development",
  "Give me feedback on my website design and suggest improvements",
  "What are the best practices for optimizing database queries?",
  "Help me debug this code that's causing a memory leak in my Node.js application",
  "Create a plan for launching a new product in the next quarter",
  "Summarize this article about artificial intelligence trends",
  "Compare and contrast microservices vs monolithic architecture",
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
  isThinking: boolean;
  isLoading: boolean;
  loadError: string | null;
  wsConnected: boolean;
  wsReconnecting: boolean;
  wsError: string | null;

  // Message queue for offline scenarios
  messageQueue: Array<{
    chatId: number;
    content: string;
    timestamp: number;
  }>;

  // Actions
  initializeStore: () => Promise<void>;
  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => void;
  retryConnection: () => Promise<void>;
  processMessageQueue: () => Promise<void>;
  setActiveChat: (chatId: string | null) => Promise<void>;
  createNewChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  createChatCallbacks: (
    chatId: number,
    aiMessageId?: string,
    currentActiveChatId?: string | null,
    savedUserMessageId?: string,
    assistantMessageSaved?: boolean
  ) => WebSocketChatCallbacks;
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
  getSuggestedPrompts: () => Promise<string[]>;
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
        wsConnected: false,
        wsReconnecting: false,
        wsError: null,
        messageQueue: [],

        connectWebSocket: async () => {
          try {
            console.log("Chat Store: Connecting to WebSocket service...");
            set({ wsReconnecting: true, wsError: null });

            await chatService.connect();
            console.log("Chat Store: WebSocket service connected");

            // Subscribe to connection status changes from shared service
            const unsubscribe = webSocketService.onStatusChange((status) => {
              console.log("Chat Store: WebSocket status changed:", status);
              set({
                wsConnected: status.connected,
                wsReconnecting: status.reconnecting,
                wsError: status.error,
              });
            });

            // Store unsubscribe function for cleanup
            (get() as any).statusUnsubscribe = unsubscribe;

            // Process any queued messages after successful connection
            await get().processMessageQueue();

            console.log("Chat Store: WebSocket connection setup complete");
          } catch (error) {
            console.error("Failed to connect to WebSocket:", error);
            const errorMessage =
              error instanceof Error ? error.message : "Connection failed";
            set({
              wsConnected: false,
              wsReconnecting: false,
              wsError: errorMessage,
            });
            throw error;
          }
        },

        disconnectWebSocket: () => {
          // Cleanup status subscription
          const state = get() as any;
          if (state.statusUnsubscribe) {
            state.statusUnsubscribe();
            delete state.statusUnsubscribe;
          }

          chatService.disconnect();
          set({
            wsConnected: false,
            wsReconnecting: false,
            wsError: null,
          });
        },

        retryConnection: async () => {
          console.log("Chat Store: Retrying WebSocket connection...");
          try {
            await chatService.reconnect();
          } catch (error) {
            console.error("Chat Store: Retry connection failed:", error);
            // Don't throw here, let the user try again
          }
        },

        processMessageQueue: async () => {
          const { messageQueue, wsConnected } = get();

          if (!wsConnected || messageQueue.length === 0) {
            return;
          }

          console.log(
            `Chat Store: Processing ${messageQueue.length} queued messages`
          );

          // Process messages in order
          for (const queuedMessage of messageQueue) {
            try {
              // Re-send the message via WebSocket
              chatService.sendMessage({
                chatId: queuedMessage.chatId,
                model: get().model,
                messages: [
                  {
                    role: "user",
                    content: queuedMessage.content,
                  },
                ],
                mode:
                  get().mode === "none"
                    ? "write"
                    : (get().mode as "write" | "ask"),
              });
            } catch (error) {
              console.error("Failed to process queued message:", error);
              // Don't break the loop, try the next message
            }
          }

          // Clear the queue after processing
          set({ messageQueue: [] });
        },

        initializeStore: async () => {
          console.log("Chat Store: Starting initialization...");
          set({ isLoading: true, loadError: null });

          let wsConnectionFailed = false;

          // Connect to WebSocket first with timeout - but don't block initialization
          try {
            console.log("Chat Store: Starting WebSocket connection...");

            // Add timeout to WebSocket connection
            const connectPromise = get().connectWebSocket();
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error("WebSocket connection timeout")),
                5000 // Reduced timeout to 5 seconds
              )
            );

            await Promise.race([connectPromise, timeoutPromise]);
            console.log("Chat Store: WebSocket connected successfully");
          } catch (error) {
            wsConnectionFailed = true;
            console.warn(
              "Chat Store: WebSocket connection failed during initialization, continuing without real-time features:",
              error
            );
            // Set WebSocket state to failed but continue initialization
            set({
              wsConnected: false,
              wsReconnecting: false,
              wsError:
                error instanceof Error ? error.message : "Connection failed",
            });
          }

          // Always proceed with chat data loading regardless of WebSocket status
          try {
            console.log("Chat Store: Fetching chats...");

            // Add timeout to fetch as well
            const fetchPromise = fetchChats();
            const fetchTimeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Fetch chats timeout")), 8000)
            );

            const chats = await Promise.race([
              fetchPromise,
              fetchTimeoutPromise,
            ]);
            console.log(
              "Chat Store: Chats fetched successfully, count:",
              chats.length
            );

            set({
              chats: chats.length > 0 ? chats : fallbackChats,
              isLoading: false,
            });

            // If WebSocket failed but data loaded successfully, show warning
            if (wsConnectionFailed) {
              set({
                loadError: "Real-time features unavailable - using cached data",
              });
            }
          } catch (error) {
            console.error("Chat Store: Failed to fetch chats:", error);
            const errorMessage =
              error instanceof Error ? error.message : "Failed to load data";

            set({
              chats: fallbackChats,
              isLoading: false,
              loadError: wsConnectionFailed
                ? `Connection and data loading failed: ${errorMessage}`
                : errorMessage,
            });
          }

          console.log("Chat Store: Initialization complete");
        },

        setActiveChat: async (chatId) => {
          get().stopResponse(); // Stop any ongoing response when switching chats

          // Unsubscribe from previous chat if any
          const currentActiveChat = get().activeChat;
          if (currentActiveChat) {
            chatService.unsubscribeFromChat(parseInt(currentActiveChat));
          }

          set({ activeChat: chatId, isLoading: true });

          if (chatId) {
            try {
              // Subscribe to new chat
              const numericChatId = parseInt(chatId);
              chatService.subscribeToChat(numericChatId, {});

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

          // Unsubscribe from current chat
          const currentActiveChat = get().activeChat;
          if (currentActiveChat) {
            chatService.unsubscribeFromChat(parseInt(currentActiveChat));
          }

          set({
            activeChat: null,
            messages: [],
            contextItems: [],
            isThinking: false,
          });
        },

        sendMessage: async (content) => {
          const state = get();
          const {
            activeChat,
            chats,
            messages,
            contextItems,
            model,
            mode,
            wsConnected,
          } = state;

          // Check WebSocket connection and attempt to connect if needed
          if (!wsConnected) {
            try {
              await get().connectWebSocket();
            } catch (error) {
              console.error(
                "Failed to establish WebSocket connection for message sending:",
                error
              );
              // Continue with local message handling, queue the message for later
            }
          }

          set({
            isResponding: true,
            isThinking: false,
          });

          // Create a deep copy of the messages array to avoid mutation issues
          const updatedMessages = [...messages];

          // Create message content - automatically include context if available
          const messageContent: MessageContent[] = [
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
          let numericChatId: number;

          if (!currentActiveChatId) {
            try {
              const title =
                content.slice(0, 30) + (content.length > 30 ? "..." : "");
              const newChat = await createChat(title);
              currentActiveChatId = newChat.id;
              numericChatId = parseInt(newChat.id);

              updates.activeChat = newChat.id;
              updates.chats = [
                {
                  ...newChat,
                  messages: updatedMessages,
                },
                ...chats,
              ];

              // Subscribe to the new chat
              chatService.subscribeToChat(
                numericChatId,
                get().createChatCallbacks(numericChatId)
              );
            } catch (error) {
              console.error("Failed to create chat:", error);
              // Fallback to local chat creation
              const newChatId = `chat-${Date.now()}`;
              currentActiveChatId = newChatId;
              numericChatId = parseInt(newChatId);

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

              // Subscribe to the new chat
              chatService.subscribeToChat(
                numericChatId,
                get().createChatCallbacks(numericChatId)
              );
            }
          } else {
            numericChatId = parseInt(currentActiveChatId);
            updates.chats = chats.map((chat) =>
              chat.id === currentActiveChatId
                ? { ...chat, messages: updatedMessages }
                : chat
            );
          }
          set(updates);

          // Save user message to database and update ID if successful
          let savedUserMessageId: string | undefined;
          if (currentActiveChatId) {
            try {
              const savedMessage = await saveMessage(
                currentActiveChatId,
                typeof messageContent === "string"
                  ? messageContent
                  : JSON.stringify(messageContent),
                "user",
                contextItems.length > 0
                  ? JSON.stringify(contextItems)
                  : undefined
              );

              // Update the user message with the saved ID
              const updatedMessageId = savedMessage.id;
              savedUserMessageId = updatedMessageId;
              set((currentState) => {
                const updatedMessages = currentState.messages.map((msg) =>
                  msg.id === userMessage.id
                    ? { ...msg, id: updatedMessageId }
                    : msg
                );
                return {
                  messages: updatedMessages,
                  chats: currentState.chats.map((chat) =>
                    chat.id === currentActiveChatId
                      ? { ...chat, messages: updatedMessages }
                      : chat
                  ),
                };
              });
            } catch (error) {
              console.error("Failed to save user message:", error);
              // Continue with the flow even if saving fails
            }
          }

          const aiMessageId = `${Date.now().toString()}-ai`;
          const assistantMessageSaved = false; // Flag to prevent duplicate saves
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
            const finalActiveChatId = currentState.activeChat;
            return {
              messages: [...currentState.messages, initialAiMessage],
              chats: currentState.chats.map((chat) =>
                chat.id === finalActiveChatId
                  ? { ...chat, messages: [...chat.messages, initialAiMessage] }
                  : chat
              ),
            };
          });

          // Update chat callbacks to handle this specific message
          chatService.updateChatCallbacks(
            numericChatId,
            get().createChatCallbacks(
              numericChatId,
              aiMessageId,
              currentActiveChatId,
              savedUserMessageId,
              assistantMessageSaved
            )
          );

          // Send message via WebSocket or queue if offline
          const currentState = get();
          if (currentState.wsConnected) {
            try {
              chatService.sendMessage({
                chatId: numericChatId,
                model,
                messages: updatedMessages.map((m) => ({
                  role: m.isUser ? "user" : "assistant",
                  content: Array.isArray(m.content)
                    ? m.content
                    : [{ type: "text", text: m.content }],
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
                userMessageId: savedUserMessageId,
                mode: mode === "none" ? "write" : mode,
              });
            } catch (error) {
              console.error("Failed to send WebSocket message:", error);

              // Queue the message for retry when connection is restored
              set((state) => ({
                messageQueue: [
                  ...state.messageQueue,
                  {
                    chatId: numericChatId,
                    content:
                      typeof content === "string"
                        ? content
                        : JSON.stringify(content),
                    timestamp: Date.now(),
                  },
                ],
                isResponding: false,
                isThinking: false,
              }));

              // Update AI message with offline status
              set((currentState) => {
                const currentMsgs = [...currentState.messages];
                const aiMsgIdx = currentMsgs.findIndex(
                  (m) => m.id === aiMessageId
                );
                if (aiMsgIdx !== -1) {
                  currentMsgs[aiMsgIdx] = {
                    ...currentMsgs[aiMsgIdx],
                    content: `Message queued for delivery when connection is restored. Error: ${
                      error instanceof Error
                        ? error.message
                        : "Connection failed"
                    }`,
                  };
                }
                return {
                  messages: currentMsgs,
                  chats: currentState.chats.map((c) =>
                    c.id === currentState.activeChat
                      ? { ...c, messages: currentMsgs }
                      : c
                  ),
                };
              });
            }
          } else {
            // WebSocket not connected, queue the message
            console.log("WebSocket not connected, queueing message");
            set((state) => ({
              messageQueue: [
                ...state.messageQueue,
                {
                  chatId: numericChatId,
                  content:
                    typeof content === "string"
                      ? content
                      : JSON.stringify(content),
                  timestamp: Date.now(),
                },
              ],
              isResponding: false,
              isThinking: false,
            }));

            // Update AI message with queued status
            set((currentState) => {
              const currentMsgs = [...currentState.messages];
              const aiMsgIdx = currentMsgs.findIndex(
                (m) => m.id === aiMessageId
              );
              if (aiMsgIdx !== -1) {
                currentMsgs[aiMsgIdx] = {
                  ...currentMsgs[aiMsgIdx],
                  content:
                    "Message queued for delivery when connection is restored.",
                };
              }
              return {
                messages: currentMsgs,
                chats: currentState.chats.map((c) =>
                  c.id === currentState.activeChat
                    ? { ...c, messages: currentMsgs }
                    : c
                ),
              };
            });
          }
        },

        // Helper method to create chat callbacks
        createChatCallbacks: (
          chatId: number,
          aiMessageId?: string,
          currentActiveChatId?: string | null,
          _savedUserMessageId?: string,
          assistantMessageSaved?: boolean
        ): WebSocketChatCallbacks => {
          const updateAIMessageInStore = (
            updater: (currentAIMsg: Message) => Partial<Message>
          ) => {
            if (!aiMessageId) return;

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

          const processTextWithThinkingTags = (text: string) => {
            const thinkingTagRegex = new RegExp(
              THINKING_TAG_REGEX.source,
              THINKING_TAG_REGEX.flags
            );
            let isThinking = false;
            let currentIndex = 0;
            let match: RegExpExecArray | null;
            const partialTagRegex = /<\/?think(?:ing)?(?:\s[^>]*)?$/i;
            const partialMatch = partialTagRegex.exec(text);
            let textToProcess = text;
            if (partialMatch) {
              textToProcess = text.slice(0, partialMatch.index);
            }

            match = thinkingTagRegex.exec(textToProcess);
            while (match !== null) {
              if (match.index > currentIndex) {
                const beforeTag = textToProcess.slice(
                  currentIndex,
                  match.index
                );
                if (beforeTag) {
                  if (isThinking) {
                    updateAIMessageInStore((msg) => ({
                      thinkingContent: (msg.thinkingContent || "") + beforeTag,
                      isThinking: true,
                    }));
                    set({ isThinking: true });
                  } else {
                    updateAIMessageInStore((msg) => ({
                      content: (msg.content || "") + beforeTag,
                      isThinking: false,
                    }));
                    set({ isThinking: false });
                  }
                }
              }

              const tagContent = match[0].toLowerCase().trim();
              if (
                tagContent.startsWith("<think>") ||
                tagContent.startsWith("<thinking>") ||
                tagContent.startsWith("<think ") ||
                tagContent.startsWith("<thinking ")
              ) {
                isThinking = true;
              } else if (
                tagContent.startsWith("</think>") ||
                tagContent.startsWith("</thinking>") ||
                tagContent.startsWith("</think") ||
                tagContent.startsWith("</thinking")
              ) {
                isThinking = false;
              }
              currentIndex = match.index + match[0].length;
              match = thinkingTagRegex.exec(textToProcess);
            }

            if (currentIndex < textToProcess.length) {
              const remainingText = textToProcess.slice(currentIndex);
              if (remainingText) {
                if (isThinking) {
                  updateAIMessageInStore((msg) => ({
                    thinkingContent:
                      (msg.thinkingContent || "") + remainingText,
                    isThinking: true,
                  }));
                  set({ isThinking: true });
                } else {
                  updateAIMessageInStore((msg) => ({
                    content: (msg.content || "") + remainingText,
                    isThinking: false,
                  }));
                  set({ isThinking: false });
                }
              }
            }
          };

          return {
            onChatStatus: (status) => {
              console.log(`Chat ${chatId} status:`, status);
              if (status.status === "in_progress") {
                set({ isResponding: true, wsError: null });
              } else if (
                status.status === "completed" ||
                status.status === "error"
              ) {
                set({ isResponding: false, isThinking: false });
                if (status.status === "error" && status.error) {
                  set({ wsError: status.error });
                }
              }
            },
            onTextDelta: (delta) => {
              processTextWithThinkingTags(delta);
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

                // Create new Record with updated tool call
                const updatedToolCalls = { ...existingToolCalls };
                const existingToolCall = updatedToolCalls[incomingToolCall.id];

                updatedToolCalls[incomingToolCall.id] = incomingToolCall;

                // Generate content based on tool call status
                let toolContent = "";
                if (!existingToolCall) {
                  // New tool call - add the required tag format
                  toolContent = `[toolCall:${incomingToolCall.id},${incomingToolCall.name}]`;
                } else if (incomingToolCall.status === "success") {
                  // Tool completed successfully
                  console.log(
                    "Store: Tool call success, adding result:",
                    toolContent
                  );
                } else if (incomingToolCall.status === "error") {
                  console.log(
                    "Store: Tool call error, adding error:",
                    toolContent
                  );
                }

                const newContent = existingToolCall
                  ? (msg.content || "") + toolContent // Update with result
                  : (msg.content || "") + toolContent;

                console.log("Store: Updated message content:", newContent);

                return {
                  toolCalls: updatedToolCalls,
                  content: newContent,
                };
              });
            },
            onChatComplete: async (data) => {
              console.log("Chat Store: WebSocket chat completed", data);
              set({ isResponding: false, isThinking: false });
            },
            onChatError: (error, code) => {
              console.error(`Chat ${chatId} error:`, error, code);

              updateAIMessageInStore((msg) => ({
                content: `${msg.content || ""}\n\nError: ${error}`,
              }));

              set({ isResponding: false, isThinking: false });
            },
            onConnectionOpen: () => {
              console.log("Chat Store: WebSocket connection opened");
              set({
                wsConnected: true,
                wsReconnecting: false,
                wsError: null,
              });

              // Process any queued messages
              get()
                .processMessageQueue()
                .catch((error) => {
                  console.error("Failed to process message queue:", error);
                });
            },
            onConnectionClose: (wasClean) => {
              console.log("Chat Store: WebSocket connection closed", {
                wasClean,
              });
              set({
                wsConnected: false,
                wsReconnecting: false,
                isResponding: false,
                isThinking: false,
              });

              if (!wasClean) {
                // Set reconnecting state and attempt to reconnect
                set({ wsReconnecting: true });
                setTimeout(() => {
                  get().retryConnection();
                }, 2000);
              }
            },
            onConnectionError: (error) => {
              console.error("Chat Store: WebSocket connection error:", error);
              set({
                wsConnected: false,
                wsReconnecting: false,
                wsError: "Connection error occurred",
                isResponding: false,
                isThinking: false,
              });
            },
          };
        },

        setIsResponding: (isResponding) => {
          set({ isResponding });
        },

        setIsThinking: (isThinking) => {
          set({ isThinking });
        },

        stopResponse: () => {
          const activeChat = get().activeChat;
          if (activeChat && get().wsConnected) {
            const numericChatId = parseInt(activeChat);
            try {
              // Send cancel message to abort chat agent execution
              chatService.cancelMessage(numericChatId);
            } catch (error) {
              console.error("Failed to cancel response:", error);

              // Fallback: unsubscribe and resubscribe to stop the response
              try {
                chatService.unsubscribeFromChat(numericChatId);
                chatService.subscribeToChat(
                  numericChatId,
                  get().createChatCallbacks(numericChatId)
                );
              } catch (fallbackError) {
                console.error(
                  "Failed to stop response via fallback:",
                  fallbackError
                );
              }
            }
          }
          set({ isResponding: false, isThinking: false });
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
          _onTextDelta,
          onComplete,
          onError
        ) => {
          // For beautify, we might still use HTTP since it's a simple one-off request
          // Or we could implement it via WebSocket if the backend supports it
          const state = get();
          if (!currentPrompt.trim()) {
            onComplete(currentPrompt);
            return;
          }

          // For now, keeping the existing HTTP implementation for beautify
          // This could be migrated to WebSocket later if needed
          try {
            const agentBaseUrl =
              import.meta.env?.VITE_AGENTS_BASE_URL || "http://localhost:3031/";
            const apiUrl = `${agentBaseUrl}api/beautify`;

            // Use recent messages for context (last 5 messages max)
            const recentMessages = state.messages.slice(-5).map((message) => ({
              role: message.isUser ? ("user" as const) : ("assistant" as const),
              content: message.content,
            }));

            const payload = {
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

            const response = await fetch(apiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              throw new Error(`Beautify request failed: ${response.status}`);
            }

            const result = await response.text();
            onComplete(result.trim() || currentPrompt);
          } catch (error) {
            console.error("Failed to beautify prompt:", error);
            onError(
              new Error(
                error instanceof Error
                  ? `Failed to beautify text: ${error.message}`
                  : "Failed to beautify text"
              )
            );
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
              let message: string | MessageContent[];
              try {
                const parsed = JSON.parse(msg.message);
                message = Array.isArray(parsed) ? parsed[0].text : parsed;
              } catch {
                message = msg.message;
              }

              const messageObj: Message = {
                id: msg.id,
                content: message as string | MessageContent[],
                isUser: msg.role === "user",
                timestamp: new Date(msg.timestamp).toLocaleTimeString(
                  undefined,
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                ),
              };

              if (msg.context) {
                messageObj.contextItems = JSON.parse(
                  msg.context
                ) as ContextItem[];
                if (typeof messageObj.contextItems === "string") {
                  messageObj.contextItems = JSON.parse(messageObj.contextItems);
                }
              }

              if (msg.toolCalls) {
                messageObj.toolCalls =
                  typeof msg.toolCalls === "string"
                    ? (JSON.parse(msg.toolCalls) as Record<string, ToolCall>)
                    : (msg.toolCalls as Record<string, ToolCall>);
              }

              return messageObj;
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

        getSuggestedPrompts: async () => {
          try {
            const { model } = get();

            // Extract first messages from recent chats using the new method
            const recentChatsWithFirstMessages =
              await fetchFirstMessageFromRecentChats({
                chatLimit: 10,
              });

            const previousMessages: Array<{ role: string; content: string }> =
              [];

            for (const { firstMessage } of recentChatsWithFirstMessages) {
              if (firstMessage) {
                previousMessages.push({
                  role: firstMessage.role,
                  content: firstMessage.content,
                });
              }
            }

            // If no previous messages, add a default context message
            if (previousMessages.length === 0) {
              previousMessages.push({
                role: "user",
                content:
                  "I need suggestions for what to work on next in my project.",
              });
            }

            const suggestions = await getSuggestedPrompts(
              model,
              previousMessages,
              10
            );

            return suggestions.length > 0 ? suggestions : PREDEFINED_PROMPTS;
          } catch (error) {
            console.error("Error getting suggested prompts:", error);
            return PREDEFINED_PROMPTS;
          }
        },
      }),
      {
        name: "ai-chat-storage-v3", // Updated version for WebSocket migration
        partialize: (state) => ({
          chats: state.chats,
          activeChat: state.activeChat,
          contextItems: state.contextItems,
          mode: state.mode,
          model: state.model,
        }),
      }
    )
  )
);
