"use client";

import type React from "react";
import { useCallback } from "react";
import styled from "styled-components";
import ChatMessages from "./chat-messages";
import ContextPanel from "./context-panel";
import RecentHistory from "./recent-history";
import InputArea from "../molecules/input-area";
import Footer from "../molecules/footer/index";
import ConversationSuggestions from "../molecules/conversation-suggestions";
import { useChatStore } from "@chara/core";
import { CharaLogo } from "../atoms/chara-logo";

const ChatContent = styled.div`
  flex: 1;
  overflow: hidden;
  padding: 12px;
  display: flex;
  flex-direction: column;
`;

const EmptyStateContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
`;

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  color: #1f2937;
  font-size: 24px;
  font-weight: 600;
  margin: 12px 0 4px;
  text-align: center;
`;

const Subtitle = styled.h2`
  color: #6b7280;
  font-size: 16px;
  font-weight: 400;
  margin: 0 0 8px;
  text-align: center;
`;

const EmptyStateMessage = styled.span`
  color: #6b7280;
  font-size: 14px;
  text-align: center;
  align-self: center;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ConversationContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ConversationContent = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ConversationView: React.FC = () => {
  // Use selectors to get only the state we need
  const activeChat = useChatStore((state) => state.activeChat);
  const messages = useChatStore((state) => state.messages);
  const contextItems = useChatStore((state) => state.contextItems);
  const chats = useChatStore((state) => state.chats);
  const isResponding = useChatStore((state) => state.isResponding);

  // Get store actions using getState to avoid subscription issues
  const chatStore = useChatStore.getState();

  // Memoize handlers to prevent unnecessary re-renders
  const handleSendMessage = useCallback(
    (content: string) => {
      chatStore.sendMessage(content);
    },
    [chatStore],
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      chatStore.sendMessage(suggestion);
    },
    [chatStore],
  );

  const handleSelectChat = useCallback(
    (chatId: string) => {
      chatStore.setActiveChat(chatId);
    },
    [chatStore],
  );

  const handleRemoveContextItem = useCallback(
    (itemId: string) => {
      chatStore.removeContextItem(itemId);
    },
    [chatStore],
  );

  const handleAddContextItem = useCallback(
    (item: { name: string; type: string; data?: unknown }) => {
      chatStore.addContextItem(item);
    },
    [chatStore],
  );

  const handleStopResponse = useCallback(() => {
    chatStore.stopResponse();
  }, [chatStore]);

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      chatStore.deleteMessage(messageId);
    },
    [chatStore],
  );

  return (
    <ConversationContainer>
      <ConversationContent>
        <ChatContent>
          {activeChat || messages.length > 0 ? (
            <ChatMessages
              messages={messages}
              isResponding={isResponding}
              onDeleteMessage={handleDeleteMessage}
            />
          ) : (
            <EmptyStateContainer>
              <EmptyStateMessage>
                <LogoContainer>
                  <CharaLogo width={200} height={150} />
                  <Title>CharaCodes</Title>
                  <Subtitle>AI Development Tools</Subtitle>
                  {/* <VersionLabel>1.0.0-alpha</VersionLabel> */}
                </LogoContainer>
              </EmptyStateMessage>
              <ConversationSuggestions
                onSelectSuggestion={handleSelectSuggestion}
              />
            </EmptyStateContainer>
          )}
        </ChatContent>
        {!activeChat && messages.length === 0 && (
          <RecentHistory chats={chats} onSelectChat={handleSelectChat} />
        )}
      </ConversationContent>
      <ContextPanel
        contextItems={contextItems}
        onRemoveContext={handleRemoveContextItem}
      />
      <InputArea
        onSendMessage={handleSendMessage}
        onAddContext={handleAddContextItem}
        isResponding={isResponding}
        onStopResponse={handleStopResponse}
      />
      <Footer />
    </ConversationContainer>
  );
};

export default ConversationView;
