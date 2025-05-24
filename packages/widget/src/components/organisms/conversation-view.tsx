"use client"

import type React from "react"
import { useCallback } from "react"
import styled from "styled-components"
import ChatMessages from "./chat-messages"
import ContextPanel from "./context-panel"
import RecentHistory from "./recent-history"
import InputArea from "../molecules/input-area"
import Footer from "../molecules/footer"
import ConversationSuggestions from "../molecules/conversation-suggestions"
import { useChatStore } from "../../store/chat-store"

const ChatContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
`

const EmptyStateContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
`

const EmptyStateMessage = styled.span`
  color: #6b7280;
  font-size: 13px;
  text-align: center;
  margin: auto 0 24px;
`

const ConversationContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

const ConversationContent = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const ConversationView: React.FC = () => {
  // Use selectors to get only the state we need
  const activeChat = useChatStore((state) => state.activeChat)
  const messages = useChatStore((state) => state.messages)
  const contextItems = useChatStore((state) => state.contextItems)
  const chats = useChatStore((state) => state.chats)
  const isResponding = useChatStore((state) => state.isResponding)

  // Get store actions using getState to avoid subscription issues
  const chatStore = useChatStore.getState()

  // Memoize handlers to prevent unnecessary re-renders
  const handleSendMessage = useCallback(
    (content: string) => {
      chatStore.sendMessage(content)
    },
    [chatStore],
  )

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      chatStore.sendMessage(suggestion)
    },
    [chatStore],
  )

  const handleSelectChat = useCallback(
    (chatId: string) => {
      chatStore.setActiveChat(chatId)
    },
    [chatStore],
  )

  const handleRemoveContextItem = useCallback(
    (itemId: string) => {
      chatStore.removeContextItem(itemId)
    },
    [chatStore],
  )

  const handleAddContextItem = useCallback(
    (item: { name: string; type: string; data?: unknown }) => {
      chatStore.addContextItem(item)
    },
    [chatStore],
  )

  const handleStopResponse = useCallback(() => {
    chatStore.stopResponse()
  }, [chatStore])

  // Handlers for diff updates
  const handleKeepDiff = useCallback(
    (messageId: string, diffId: string) => {
      chatStore.updateDiffStatus(messageId, diffId, "kept")
    },
    [chatStore],
  )

  const handleRevertDiff = useCallback(
    (messageId: string, diffId: string) => {
      chatStore.updateDiffStatus(messageId, diffId, "reverted")
    },
    [chatStore],
  )

  const handleKeepAllDiffs = useCallback(
    (messageId: string) => {
      chatStore.updateAllDiffStatuses(messageId, "kept")
    },
    [chatStore],
  )

  const handleRevertAllDiffs = useCallback(
    (messageId: string) => {
      chatStore.updateAllDiffStatuses(messageId, "reverted")
    },
    [chatStore],
  )

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      chatStore.deleteMessage(messageId)
    },
    [chatStore],
  )

  return (
    <ConversationContainer>
      <ConversationContent>
        <ChatContent>
          {activeChat || messages.length > 0 ? (
            <ChatMessages
              messages={messages}
              onKeepAllDiffs={handleKeepAllDiffs}
              onRevertAllDiffs={handleRevertAllDiffs}
              onKeepDiff={handleKeepDiff}
              onRevertDiff={handleRevertDiff}
              onDeleteMessage={handleDeleteMessage}
            />
          ) : (
            <EmptyStateContainer>
              <EmptyStateMessage>Start a new conversation or select a recent chat</EmptyStateMessage>
              <ConversationSuggestions onSelectSuggestion={handleSelectSuggestion} />
            </EmptyStateContainer>
          )}
        </ChatContent>
        {!activeChat && messages.length === 0 && (
          <RecentHistory chats={chats} onSelectChat={handleSelectChat} />
        )}
      </ConversationContent>
      <ContextPanel contextItems={contextItems} onRemoveContext={handleRemoveContextItem} />
      <InputArea
        onSendMessage={handleSendMessage}
        onAddContext={handleAddContextItem}
        isResponding={isResponding}
        onStopResponse={handleStopResponse}
      />
      <Footer />
    </ConversationContainer>
  )
}

export default ConversationView
