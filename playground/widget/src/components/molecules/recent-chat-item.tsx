"use client"

import type React from "react"
import styled from "styled-components"

interface RecentChatItemProps {
  title: string
  timestamp: string
  onClick: () => void
}

const ChatItemContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  
  &:hover {
    background-color: #f9fafb;
  }
`

const Title = styled.h3`
  font-size: 12px;
  font-weight: 500;
  color: #333;
  margin: 0;
`

const Timestamp = styled.span`
  font-size: 10px;
  color: #6b7280;
`

const RecentChatItem: React.FC<RecentChatItemProps> = ({ title, timestamp, onClick }) => {
  return (
    <ChatItemContainer onClick={onClick}>
      <Title>{title}</Title>
      <Timestamp>{timestamp}</Timestamp>
    </ChatItemContainer>
  )
}

export default RecentChatItem
