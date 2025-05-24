"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import styled from "styled-components"
import type { Theme } from "../../styles/theme"
import MessageBubble from "../molecules/message-bubble"
import { Body2 } from "../atoms/typography"

export interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: string
}

interface MessageListProps {
  messages: Message[]
  loading?: boolean
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => (theme as Theme).spacing.md};
  background-color: ${({ theme }) => (theme as Theme).colors.background};
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: ${({ theme }) => (theme as Theme).spacing.lg};
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
`

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => (theme as Theme).spacing.sm};
  
  .dot {
    width: 8px;
    height: 8px;
    margin: 0 4px;
    border-radius: 50%;
    background-color: ${({ theme }) => (theme as Theme).colors.textSecondary};
    animation: pulse 1.5s infinite ease-in-out;
  }
  
  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
  }
`

const MessageList: React.FC<MessageListProps> = ({ messages, loading = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  if (messages.length === 0 && !loading) {
    return (
      <Container>
        <EmptyState>
          <Body2>No messages yet. Start a conversation!</Body2>
        </EmptyState>
      </Container>
    )
  }

  return (
    <Container>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} content={msg.text} isUser={msg.isUser} timestamp={msg.timestamp} />
      ))}

      {loading && (
        <LoadingIndicator>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </LoadingIndicator>
      )}

      <div ref={messagesEndRef} />
    </Container>
  )
}

export default MessageList
