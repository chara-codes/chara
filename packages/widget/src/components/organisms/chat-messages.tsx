"use client"

import React from "react"
import styled from "styled-components"
import MessageBubble from "../molecules/message-bubble"
import type { Message } from "../../store/types"
import { useCallback } from "react"

// Update the ChatMessagesProps interface to include handlers for the new buttons
interface ChatMessagesProps {
  messages: Message[]
  onKeepAllDiffs?: (messageId: string) => void
  onRevertAllDiffs?: (messageId: string) => void
  onKeepDiff?: (messageId: string, diffId: string) => void
  onRevertDiff?: (messageId: string, diffId: string) => void
  onDeleteMessage?: (messageId: string) => void
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  text-align: center;
  padding: 0 24px;
`

const EmptyStateTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
`

const EmptyStateText = styled.p`
  font-size: 12px;
  line-height: 1.4;
`

// Update the ChatMessages component to pass the handlers to MessageBubble
const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  onKeepAllDiffs,
  onRevertAllDiffs,
  onKeepDiff,
  onRevertDiff,
  onDeleteMessage,
}) => {
  // Add handlers for individual diff updates
  const handleKeepDiff = useCallback(
    (messageId: string, diffId: string) => {
      console.log(`Keeping diff ${diffId} in message ${messageId}`)
      if (onKeepDiff) {
        onKeepDiff(messageId, diffId)
      }
    },
    [onKeepDiff],
  )

  const handleRevertDiff = useCallback(
    (messageId: string, diffId: string) => {
      console.log(`Reverting diff ${diffId} in message ${messageId}`)
      if (onRevertDiff) {
        onRevertDiff(messageId, diffId)
      }
    },
    [onRevertDiff],
  )

  if (messages.length === 0) {
    return (
      <EmptyState>
        <EmptyStateTitle>No messages yet</EmptyStateTitle>
        <EmptyStateText>Start a conversation by typing a message below.</EmptyStateText>
      </EmptyState>
    )
  }

  return (
    <Container>
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          id={message.id}
          content={message.content}
          isUser={message.isUser}
          timestamp={message.timestamp}
          thinkingContent={message.thinkingContent}
          isThinking={message.isThinking}
          contextItems={message.contextItems}
          filesToChange={message.filesToChange}
          commandsToExecute={message.commandsToExecute}
          executedCommands={message.executedCommands}
          fileDiffs={message.fileDiffs}
          onKeepAllDiffs={() => onKeepAllDiffs?.(message.id)}
          onRevertAllDiffs={() => onRevertAllDiffs?.(message.id)}
          onKeepDiff={(diffId) => handleKeepDiff(message.id, diffId)}
          onRevertDiff={(diffId) => handleRevertDiff(message.id, diffId)}
          onDeleteMessage={onDeleteMessage}
        />
      ))}
    </Container>
  )
}

export default React.memo(ChatMessages)
