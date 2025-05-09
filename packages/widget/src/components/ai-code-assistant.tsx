"use client"

import { useStore } from "@/lib/store"
import { ChatTriggerButton } from "@/components/atoms/chat-trigger-button"
import { ChatPanel } from "@/components/templates/chat-panel"

export function AICodeAssistant() {
  const isOpen = useStore((state) => state.isOpen)
  const isElementSelecting = useStore((state) => state.isElementSelecting)

  // Don't show the trigger button if either the panel is open or we're in element selection mode
  if (!isOpen) {
    // Only show the trigger button if we're not in element selection mode
    return !isElementSelecting ? <ChatTriggerButton /> : null
  }

  return <ChatPanel />
}
