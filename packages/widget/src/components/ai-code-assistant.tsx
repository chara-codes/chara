"use client"

import { useStore } from "@/lib/store"
import { ChatTriggerButton } from "@/components/atoms/chat-trigger-button"
import { ChatPanel } from "@/components/templates/chat-panel"

export function AICodeAssistant() {
  const isOpen = useStore((state) => state.isOpen)

  if (!isOpen) {
    return <ChatTriggerButton />
  }

  return <ChatPanel />
}
