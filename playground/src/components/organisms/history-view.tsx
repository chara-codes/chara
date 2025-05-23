"use client"

import type React from "react"
import { useCallback } from "react"
import ChatHistory from "./chat-history"
import type { Chat } from "../../store/types"

interface HistoryViewProps {
  chats: Chat[]
  onSelectChat: (chatId: string) => void
  onBackToConversation: () => void
}

const HistoryView: React.FC<HistoryViewProps> = ({ chats, onSelectChat, onBackToConversation }) => {
  // Memoize the handlers to prevent unnecessary re-renders
  const handleSelectChat = useCallback(
    (chatId: string) => {
      onSelectChat(chatId)
    },
    [onSelectChat],
  )

  const handleBackToConversation = useCallback(() => {
    onBackToConversation()
  }, [onBackToConversation])

  return <ChatHistory chats={chats} onSelectChat={handleSelectChat} onBackToConversation={handleBackToConversation} />
}

export default HistoryView
