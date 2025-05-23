"use client"

import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import type { Chat, ChatMode, ContextItem, Message, ExecutedCommand, FileDiff } from "./types"
import { fetchChats } from "../services/data-service"
import { mockResponse } from "../data/mock-data" // Import the mock response directly

// Add throttling utility
const throttle = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0

  return (...args: any[]) => {
    const currentTime = Date.now()

    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(
        () => {
          func(...args)
          lastExecTime = Date.now()
        },
        delay - (currentTime - lastExecTime),
      )
    }
  }
}

// Fallback data in case fetch fails
const fallbackChats: Chat[] = [
  {
    id: "fallback-1",
    title: "Fallback Chat (Data Load Failed)",
    timestamp: new Date().toLocaleString(),
    messages: [],
  },
]

interface ChatState {
  // Chat data
  chats: Chat[]
  activeChat: string | null
  messages: Message[]
  contextItems: ContextItem[]

  // UI state
  mode: ChatMode
  model: string
  isResponding: boolean
  isLoading: boolean
  loadError: string | null

  // Actions
  initializeStore: () => Promise<void>
  setActiveChat: (chatId: string | null) => void
  createNewChat: () => void
  sendMessage: (content: string) => void
  addAIResponse: (
    content: string,
    options?: {
      filesToChange?: string[]
      commandsToExecute?: string[]
      executedCommands?: ExecutedCommand[]
      fileDiffs?: FileDiff[]
    },
  ) => void
  setIsResponding: (isResponding: boolean) => void
  stopResponse: () => void
  addContextItem: (item: Omit<ContextItem, "id">) => void
  removeContextItem: (id: string) => void
  setMode: (mode: ChatMode) => void
  setModel: (model: string) => void
  clearContextItems: () => void
  updateDiffStatus: (messageId: string, diffId: string, status: "pending" | "kept" | "reverted") => void
  updateAllDiffStatuses: (messageId: string, status: "kept" | "reverted") => void
  deleteMessage: (messageId: string) => void
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
        model: "claude-3.7-sonnet",
        isResponding: false,
        isLoading: true,
        loadError: null,

        // Initialize the store with data from JSON files
        initializeStore: async () => {
          set({ isLoading: true, loadError: null })
          try {
            const chats = await fetchChats()
            set({
              chats: chats.length > 0 ? chats : fallbackChats,
              isLoading: false,
            })
          } catch (error) {
            console.error("Failed to initialize store:", error)
            set({
              chats: fallbackChats,
              isLoading: false,
              loadError: error instanceof Error ? error.message : "Failed to load data",
            })
          }
        },

        // Actions
        setActiveChat: (chatId) => {
          set({ activeChat: chatId })

          // If we have a valid chat ID, load its messages
          if (chatId) {
            const chat = get().chats.find((c) => c.id === chatId)
            if (chat) {
              set({ messages: chat.messages })
            }
          } else {
            // Clear messages when no chat is selected
            set({ messages: [] })
          }
        },

        createNewChat: () => {
          set({
            activeChat: null,
            messages: [],
            contextItems: [],
          })
        },

        sendMessage: async (content) => {
          const state = get()
          const { activeChat, chats, messages, contextItems } = state

          // Create a copy of the current context items to attach to the message
          const messageContextItems = contextItems.length > 0 ? [...contextItems] : undefined

          // Create a deep copy of the messages array to avoid mutation issues
          const updatedMessages = [...messages]

          // Find the last AI message with diffs more efficiently
          for (let i = updatedMessages.length - 1; i >= 0; i--) {
            const msg = updatedMessages[i]
            if (!msg.isUser && msg.fileDiffs && msg.fileDiffs.length > 0) {
              // Update all pending diffs to kept
              updatedMessages[i] = {
                ...msg,
                fileDiffs: msg.fileDiffs.map((diff) => ({
                  ...diff,
                  status: diff.status === "pending" ? "kept" : diff.status,
                })),
              }
              break
            }
          }

          const newMessage = {
            id: Date.now().toString(),
            content,
            isUser: true,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            contextItems: messageContextItems,
          }

          // Add the new message
          updatedMessages.push(newMessage)

          // Batch state updates to prevent multiple re-renders
          const updates: Partial<ChatState> = {
            messages: updatedMessages,
            isResponding: true,
            contextItems: [], // Clear context items
          }

          // If this is a new chat, create it
          if (!activeChat) {
            const newChatId = "new-" + Date.now()
            const newChat = {
              id: newChatId,
              title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
              timestamp: new Date().toLocaleString([], {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }),
              messages: updatedMessages,
            }

            updates.chats = [newChat, ...chats]
            updates.activeChat = newChatId
          } else {
            // Update existing chat
            updates.chats = chats.map((chat) =>
              chat.id === activeChat ? { ...chat, messages: updatedMessages } : chat,
            )
          }

          // Apply all updates at once
          set(updates)

          // Use the mock response with throttled updates
          setTimeout(() => {
            try {
              const fileDiffsWithStatus = mockResponse.fileDiffs
                ? mockResponse.fileDiffs.map((diff) => ({
                    ...diff,
                    status: "pending" as "pending" | "kept" | "reverted",
                  }))
                : undefined

              get().addAIResponse(mockResponse.content, {
                filesToChange: mockResponse.filesToChange,
                commandsToExecute: mockResponse.commandsToExecute,
                executedCommands: (mockResponse.executedCommands || []) as ExecutedCommand[],
                fileDiffs: (fileDiffsWithStatus || []) as FileDiff[],
              })
            } catch (error) {
              console.error("Unexpected error in mock response handling:", error)
              get().addAIResponse("Sorry, I encountered an unexpected error. Please try again.")
            }
          }, 2000)
        },

        addAIResponse: (content, options = {}) => {
          const state = get()
          const { activeChat, chats, messages } = state
          const { filesToChange, commandsToExecute, executedCommands, fileDiffs } = options

          if (!activeChat) return

          const aiResponse: Message = {
            id: Date.now().toString(),
            content,
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            filesToChange,
            commandsToExecute,
            executedCommands,
            fileDiffs,
          }

          const updatedMessages = [...messages, aiResponse]

          // Batch all updates
          const updates = {
            messages: updatedMessages,
            isResponding: false,
            chats: chats.map((chat) => (chat.id === activeChat ? { ...chat, messages: updatedMessages } : chat)),
          }

          set(updates)
        },

        setIsResponding: (isResponding) => {
          set({ isResponding })
        },

        stopResponse: () => {
          set({ isResponding: false })
        },

        addContextItem: (item) => {
          const newContextItem: ContextItem = {
            id: Date.now().toString(),
            ...item,
          }

          set((state) => ({
            contextItems: [...state.contextItems, newContextItem],
          }))
        },

        removeContextItem: (id) => {
          set((state) => ({
            contextItems: state.contextItems.filter((item) => item.id !== id),
          }))
        },

        clearContextItems: () => {
          set({ contextItems: [] })
        },

        setMode: (mode) => {
          set({ mode })
        },

        setModel: (model) => {
          set({ model })
        },

        updateDiffStatus: (messageId, diffId, status) => {
          const { messages, chats, activeChat } = get()

          // Find the message and update the status of the specific diff
          const updatedMessages = messages.map((message) => {
            if (message.id === messageId && message.fileDiffs) {
              // Create a new fileDiffs array with the updated status
              const updatedFileDiffs = message.fileDiffs.map((diff) =>
                diff.id === diffId ? { ...diff, status } : diff,
              )

              return {
                ...message,
                fileDiffs: updatedFileDiffs,
              }
            }
            return message
          })

          // Update the store
          set({ messages: updatedMessages })

          // Update the chat with the new messages
          if (activeChat) {
            const updatedChats = chats.map((chat) =>
              chat.id === activeChat ? { ...chat, messages: updatedMessages } : chat,
            )
            set({ chats: updatedChats })
          }
        },

        updateAllDiffStatuses: (messageId, status) => {
          const { messages, chats, activeChat } = get()

          // Find the message and update all diff statuses
          const updatedMessages = messages.map((message) => {
            if (message.id === messageId && message.fileDiffs) {
              // Create a new fileDiffs array with all statuses updated
              const updatedFileDiffs = message.fileDiffs.map((diff) => ({
                ...diff,
                status,
              }))

              return {
                ...message,
                fileDiffs: updatedFileDiffs,
              }
            }
            return message
          })

          // Update the store
          set({ messages: updatedMessages })

          // Update the chat with the new messages
          if (activeChat) {
            const updatedChats = chats.map((chat) =>
              chat.id === activeChat ? { ...chat, messages: updatedMessages } : chat,
            )
            set({ chats: updatedChats })
          }
        },

        deleteMessage: (messageId) => {
          const { messages, chats, activeChat } = get()

          // Find the index of the message to delete
          const messageIndex = messages.findIndex((msg) => msg.id === messageId)

          if (messageIndex === -1) return // Message not found

          // Remove the message and all subsequent messages
          const updatedMessages = messages.slice(0, messageIndex)

          // Update the store
          set({ messages: updatedMessages })

          // Update the chat with the new messages
          if (activeChat) {
            const updatedChats = chats.map((chat) =>
              chat.id === activeChat ? { ...chat, messages: updatedMessages } : chat,
            )
            set({ chats: updatedChats })
          }
        },
      }),
      {
        name: "ai-chat-storage",
        partialize: (state) => ({
          chats: state.chats,
          model: state.model,
          mode: state.mode,
        }),
      },
    ),
  ),
)
