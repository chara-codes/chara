"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Square } from "lucide-react"
import { useStore } from "@/lib/store"
import { ChatTypeSelector } from "@/components/molecules/chat-type-selector"
import { ModelSelector } from "@/components/molecules/model-selector"

export function ChatInput() {
  const inputValue = useStore((state) => state.inputValue)
  const isGenerating = useStore((state) => state.isGenerating)
  const setInputValue = useStore((state) => state.setInputValue)
  const sendMessage = useStore((state) => state.sendMessage)
  const cancelGeneration = useStore((state) => state.cancelGeneration)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="border-t p-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
      <div className="flex flex-col gap-2 message-content bg-white dark:bg-gray-900 rounded-md">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything, @ to mention, ↑ to select"
          className="flex-1 text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 !important"
        />
        <div className="flex items-center justify-between w-full text-gray-700 dark:text-gray-300">
          <ChatTypeSelector />
          <div className="flex items-center gap-1 text-xs text-gray-500 px-2">
            <span className="flex items-center gap-1">
              <ModelSelector />
              {isGenerating && (
                <>
                  {" Thinking"}
                  <button
                    onClick={cancelGeneration}
                    className="flex items-center justify-center h-5 w-5 hover:bg-gray-200 rounded-full ml-1"
                    title="Cancel generation"
                  >
                    <Square className="h-3 w-3 text-red-500 fill-red-500" />
                  </button>
                </>
              )}
            </span>
            {!isGenerating && (
              <Button
                onClick={sendMessage}
                disabled={inputValue.trim() === ""}
                size="sm"
                className="text-xs bg-gray-800 hover:bg-gray-700 text-white h-7 px-2 py-0"
              >
                Send
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
