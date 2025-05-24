"use client"

import type React from "react"
import { useCallback } from "react"
import ChatHistory from "./chat-history"
import type { Chat } from "../../store/types"

interface HistoryViewProps {
  chats: Chat[]
  onSelectChat: (chatId: string) => void
}

const HistoryView: React.FC<HistoryViewProps> = ({ chats, onSelectChat }) => {
  // Memoize the handlers to prevent unnecessary re-renders
  const handleSelectChat = useCallback(
    (chatId: string) => {
      onSelectChat(chatId)
    },
    [onSelectChat],
  )

  return <ChatHistory chats={chats} onSelectChat={handleSelectChat} />
}

export default HistoryView
