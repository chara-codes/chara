"use client";

import type { Chat } from "@chara-codes/core";
import { useNavigateToHistory } from "@chara-codes/core";
import type React from "react";
import styled from "styled-components";
import { formatRelativeTime } from "../utils";

interface RecentHistoryProps {
  chats: Chat[];
  onSelectChat: (chatId: string) => void;
}

const Container = styled.div`
  border-top: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.background};
  max-height: 200px;
  overflow-y: auto;
  transition: background-color ${props => props.theme.transitions.theme},
              border-color ${props => props.theme.transitions.theme};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  transition: border-color ${props => props.theme.transitions.theme};
`;

const Title = styled.h2`
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
  transition: color ${props => props.theme.transitions.theme};
`;

const ViewAllLink = styled.button`
  font-size: 11px;
  color: ${props => props.theme.colors.textSecondary};
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: color ${props => props.theme.transitions.theme};

  &:hover {
    text-decoration: underline;
    color: ${props => props.theme.colors.text};
  }
`;

const ChatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
  transition: background-color ${props => props.theme.transitions.theme},
              border-color ${props => props.theme.transitions.theme};

  &:hover {
    background-color: ${props => props.theme.colors.highlight};
  }
`;

const ChatTitle = styled.span`
  font-size: 12px;
  color: ${props => props.theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
  transition: color ${props => props.theme.transitions.theme};
`;

const ChatTimestamp = styled.span`
  font-size: 10px;
  color: ${props => props.theme.colors.textSecondary};
  transition: color ${props => props.theme.transitions.theme};
`;

const RecentHistory: React.FC<RecentHistoryProps> = ({
  chats,
  onSelectChat,
}) => {
  const navigateToHistory = useNavigateToHistory();

  if (chats.length === 0) {
    return null;
  }

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
          <ChatTimestamp>{formatRelativeTime(chat.timestamp)}</ChatTimestamp>
        </ChatItem>
      ))}
    </Container>
  );
};

export default RecentHistory;
