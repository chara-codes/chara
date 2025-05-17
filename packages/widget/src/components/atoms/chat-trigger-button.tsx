"use client"

import { Wand2 } from "lucide-react"
import { useStore } from "@/lib/store"

export function ChatTriggerButton() {
  const toggleChat = useStore((state) => state.toggleChat)
  const dockPosition = useStore((state) => state.dockPosition)

  // Adjust button position based on last dock position
  const getButtonStyles = () => {
    switch (dockPosition) {
      case "left":
        return "left-0 bottom-8 rounded-r-lg rounded-l-none"
      case "right":
      case "devtools": // Use the same button position for devtools as right
        return "right-0 bottom-8 rounded-l-lg rounded-r-none"
      case "bottom":
        return "bottom-0 right-8 rounded-t-lg rounded-b-none"
      case "top":
        return "top-0 right-8 rounded-b-lg rounded-t-none"
      case "popup":
        return "right-0 bottom-8 rounded-l-lg rounded-r-none" // Same as right for popup
      default:
        return "right-0 bottom-8 rounded-l-lg rounded-r-none" // Default (float)
    }
  }

  return (
    <button
      onClick={toggleChat}
      className={`fixed z-50 flex items-center justify-center w-10 h-10 bg-gray-800 shadow-lg hover:bg-gray-700 transition-colors ${getButtonStyles()}`}
      aria-label="Open AI Assistant"
    >
      <Wand2 className="w-5 h-5 text-white" />
    </button>
  )
}
