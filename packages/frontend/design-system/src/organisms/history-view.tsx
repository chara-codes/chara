"use client";

import type React from "react";
import { useCallback, useState } from "react";
import styled from "styled-components";
import ViewNavigation from "../molecules/view-navigation";
import ChatHistory from "./chat-history";
import type { Chat } from "@chara/core";

const HistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #f9fafb;
`;

const HistoryContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

interface HistoryViewProps {
  chats: Chat[];
  onSelectChat: (chatId: string) => void;
  onBack: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({
  chats,
  onSelectChat,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Handle search query change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Memoize the handlers to prevent unnecessary re-renders
  const handleSelectChat = useCallback(
    (chatId: string) => {
      onSelectChat(chatId);
    },
    [onSelectChat],
  );

  // Filter chats based on search query
  const filteredChats =
    searchQuery.trim() === ""
      ? chats
      : chats.filter(
          (chat) =>
            (chat.title &&
              chat.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (chat.messages &&
              chat.messages.some((m) =>
                m.content.toLowerCase().includes(searchQuery.toLowerCase()),
              )),
        );

  return (
    <HistoryContainer>
      <ViewNavigation
        onBack={onBack}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        placeholder="Search conversations..."
      />

      <HistoryContent>
        <ChatHistory chats={filteredChats} onSelectChat={handleSelectChat} />
      </HistoryContent>
    </HistoryContainer>
  );
};

export default HistoryView;
