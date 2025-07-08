"use client";

import type React from "react";
import styled from "styled-components";
import type { Chat } from "@apk/core";
import { useNavigateToHistory } from '@apk/core';

interface RecentHistoryProps {
  chats: Chat[];
  onSelectChat: (chatId: string) => void;
}

const Container = styled.div`
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
  max-height: 200px;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h2`
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin: 0;
`;

const ViewAllLink = styled.button`
  font-size: 11px;
  color: #6b7280;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const ChatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const ChatTitle = styled.span`
  font-size: 12px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
`;

const ChatTimestamp = styled.span`
  font-size: 10px;
  color: #6b7280;
`;

const RecentHistory: React.FC<RecentHistoryProps> = ({
  chats,
  onSelectChat,
}) => {
  const navigateToHistory = useNavigateToHistory();

  return (
    <Container>
      <Header>
        <Title>Recent</Title>
        <ViewAllLink onClick={navigateToHistory} type="button">
          View All
        </ViewAllLink>
      </Header>
      {chats.map((chat) => (
        <ChatItem key={chat.id} onClick={() => onSelectChat(chat.id)}>
          <ChatTitle>{chat.title}</ChatTitle>
          <ChatTimestamp>{chat.timestamp}</ChatTimestamp>
        </ChatItem>
      ))}
    </Container>
  );
};

export default RecentHistory;
