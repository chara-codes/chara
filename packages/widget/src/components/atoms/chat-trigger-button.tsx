"use client"

import { Wand2 } from "lucide-react"
import { useStore } from "@/lib/store"

export function ChatTriggerButton() {
  const toggleChat = useStore((state) => state.toggleChat)

  return (
    <button
      onClick={toggleChat}
      className="fixed bottom-8 right-0 z-50 flex items-center justify-center w-10 h-10 bg-gray-800 rounded-l-lg shadow-lg hover:bg-gray-700 transition-colors"
      aria-label="Open AI Assistant"
    >
      <Wand2 className="w-5 h-5 text-white" />
    </button>
  )
}
