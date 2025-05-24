"use client"

import type React from "react"
import styled from "styled-components"
import RecentChatItem from "../molecules/recent-chat-item"
import { ExternalLinkIcon, TrashIcon } from "../atoms/icons"

interface Chat {
  id: string
  title: string
  timestamp: string
}

interface RecentChatsProps {
  chats: Chat[]
  onSelectChat: (chatId: string) => void
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
`

const Title = styled.h2`
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
`

const ViewAllLink = styled.a`
  font-size: 14px;
  color: #6b7280;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    text-decoration: underline;
  }
`

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`

const RecentChats: React.FC<RecentChatsProps> = ({ chats, onSelectChat }) => {
  return (
    <Container>
      <Header>
        <Title>Recent</Title>
        <ViewAllLink href="#">
          View All
          <ActionButtons>
            <IconWrapper>
              <ExternalLinkIcon />
            </IconWrapper>
            <IconWrapper>
              <TrashIcon />
            </IconWrapper>
          </ActionButtons>
        </ViewAllLink>
      </Header>
      {chats.map((chat) => (
        <RecentChatItem
          key={chat.id}
          title={chat.title}
          timestamp={chat.timestamp}
          onClick={() => onSelectChat(chat.id)}
        />
      ))}
    </Container>
  )
}

export default RecentChats
