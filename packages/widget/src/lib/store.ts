import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { Model, Message, ContextItem } from "@/types"
import { modelGroups } from "@/mocks/data"

interface ChatState {
  // UI State
  isOpen: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  isDragging: boolean
  isResizing: boolean
  dragOffset: { x: number; y: number }
  resizeDirection: string | null
  isEditsSummaryExpanded: boolean
  foldedCodeBlocks: Set<string>
  contextScrollPosition: number
  hasContextOverflow: boolean
  activeCategory: string | null
  searchQueries: Record<string, string>
  modelSearchQuery: string

  // Chat State
  messages: Message[]
  inputValue: string
  isGenerating: boolean
  chatType: "Write" | "Ask"
  selectedModel: Model
  activeContexts: ContextItem[]

  // Actions
  setIsOpen: (isOpen: boolean) => void
  toggleChat: () => void
  setPosition: (position: { x: number; y: number }) => void
  setSize: (size: { width: number; height: number }) => void
  setIsDragging: (isDragging: boolean) => void
  setIsResizing: (isResizing: boolean) => void
  setDragOffset: (offset: { x: number; y: number }) => void
  setResizeDirection: (direction: string | null) => void
  toggleEditsSummary: () => void
  toggleCodeBlockFold: (codeBlockId: string) => void
  setContextScrollPosition: (position: number) => void
  setHasContextOverflow: (hasOverflow: boolean) => void
  setActiveCategory: (category: string | null) => void
  setSearchQuery: (category: string, query: string) => void
  setModelSearchQuery: (query: string) => void
  setInputValue: (value: string) => void
  setChatType: (type: "Write" | "Ask") => void
  setSelectedModel: (model: Model) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  addContext: (context: ContextItem) => void
  removeContext: (contextName: string) => void
  sendMessage: () => void
  cancelGeneration: () => void
}

export const useStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      // UI State
      isOpen: true,
      position: { x: 0, y: 0 },
      size: { width: 420, height: 600 },
      isDragging: false,
      isResizing: false,
      dragOffset: { x: 0, y: 0 },
      resizeDirection: null,
      isEditsSummaryExpanded: false,
      foldedCodeBlocks: new Set<string>(),
      contextScrollPosition: 0,
      hasContextOverflow: false,
      activeCategory: null,
      searchQueries: {},
      modelSearchQuery: "",

      // Chat State
      messages: [
        {
          id: "1",
          type: "user",
          content: "Beautify messages, fix issues with any types, care about development experience",
          files: ["logger.ts"],
        },
        {
          id: "2",
          type: "assistant",
          content: `I'll improve the logger by enhancing message formatting, fixing type issues, and improving the developer experience.

Key Areas to Enhance:

1. Message Beautification:
   • Better message formatting with proper spacing
   • More visually appealing metadata display
   • Better multiline message support

2. Type Safety:
   • Replace any types with more specific types
   • Add proper interfaces for metadata

3. Developer Experience:
   • Add JSDoc documentation
   • Create a fluent API for better chaining
   • Improve message formatting with template support

Let me implement these improvements:`,
          codeBlocks: [
            {
              id: "code-1",
              filename: "chara/packages/cli/src/utils/logger.ts",
              language: "typescript",
              code: `import "picocolors";

// Map LogLevel to severity
// Define LogLevel enum

/**
 * Log levels supported by the logger
 */
export enum LogLevel {
  TRACE = "TRACE",
  DEBUG = "DEBUG",`,
            },
          ],
        },
      ],
      inputValue: "",
      isGenerating: false,
      chatType: "Write",
      selectedModel: modelGroups[0].models[0],
      activeContexts: [
        { type: "Files", name: "logger.ts" },
        { type: "Documentation", name: "README.md" },
        { type: "Console", name: "Terminal output" },
      ],

      // Actions
      setIsOpen: (isOpen) => set({ isOpen }),
      toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
      setPosition: (position) => set({ position }),
      setSize: (size) => set({ size }),
      setIsDragging: (isDragging) => set({ isDragging }),
      setIsResizing: (isResizing) => set({ isResizing }),
      setDragOffset: (dragOffset) => set({ dragOffset }),
      setResizeDirection: (resizeDirection) => set({ resizeDirection }),
      toggleEditsSummary: () => set((state) => ({ isEditsSummaryExpanded: !state.isEditsSummaryExpanded })),
      toggleCodeBlockFold: (codeBlockId) =>
        set((state) => {
          const newSet = new Set(state.foldedCodeBlocks)
          if (newSet.has(codeBlockId)) {
            newSet.delete(codeBlockId)
          } else {
            newSet.add(codeBlockId)
          }
          return { foldedCodeBlocks: newSet }
        }),
      setContextScrollPosition: (position) => set({ contextScrollPosition: position }),
      setHasContextOverflow: (hasOverflow) => set({ hasContextOverflow: hasOverflow }),
      setActiveCategory: (category) => set({ activeCategory: category }),
      setSearchQuery: (category, query) =>
        set((state) => ({
          searchQueries: { ...state.searchQueries, [category]: query },
        })),
      setModelSearchQuery: (query) => set({ modelSearchQuery: query }),
      setInputValue: (value) => set({ inputValue: value }),
      setChatType: (type) => set({ chatType: type }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)),
        })),
      addContext: (context) =>
        set((state) => {
          // Check if context already exists
          const exists = state.activeContexts.some((ctx) => ctx.type === context.type && ctx.name === context.name)
          if (exists) return state
          return { activeContexts: [...state.activeContexts, context] }
        }),
      removeContext: (contextName) =>
        set((state) => ({
          activeContexts: state.activeContexts.filter((context) => context.name !== contextName),
        })),
      sendMessage: () => {
        const { inputValue, activeContexts, isGenerating } = get()
        if (inputValue.trim() === "" || isGenerating) return

        const newMessage: Message = {
          id: Date.now().toString(),
          content: inputValue,
          type: "user",
          files: activeContexts.filter((context) => context.type === "Files").map((context) => context.name),
        }

        set((state) => ({
          messages: [...state.messages, newMessage],
          inputValue: "",
          isGenerating: true,
        }))

        // Simulate AI response after a delay
        setTimeout(() => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `I've analyzed your request about "${inputValue}".

Here's what I can help with:

1. Code Optimization:
   • Improve performance with better algorithms
   • Reduce unnecessary operations

2. Best Practices:
   • Follow modern JavaScript/TypeScript conventions
   • Implement proper error handling`,
            type: "assistant",
            isGenerating: true,
          }

          set((state) => ({
            messages: [...state.messages, assistantMessage],
          }))

          // Simulate completion after 3 seconds
          setTimeout(() => {
            set((state) => ({
              messages: state.messages.map((msg) =>
                msg.id === assistantMessage.id ? { ...msg, isGenerating: false } : msg,
              ),
              isGenerating: false,
            }))
          }, 3000)
        }, 1000)
      },
      cancelGeneration: () => set({ isGenerating: false }),
    }),
    { name: "ai-chat-store" },
  ),
)
