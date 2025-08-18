"use client";

import { useChat } from "@ai-sdk/react";
import { useChatStore } from "@chara-codes/core";
import { DefaultChatTransport } from "ai";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { CharaLogo } from "../atoms/chara-logo";
import ConversationSuggestions from "../molecules/conversation-suggestions";
import Footer from "../molecules/footer/index";
import InputArea from "../molecules/input-area";
import ChatMessages from "./chat-messages";
import ContextPanel from "./context-panel";
import RecentHistory from "./recent-history";

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
  // Use selectors with fallbacks to prevent loading issues
  const activeChat = useChatStore((state) => state?.activeChat || null);
  const contextItems = useChatStore((state) => state?.contextItems || []);
  const chats = useChatStore((state) => state?.chats || []);
  const currentMessages = useChatStore((state) => state?.currentMessages || []);
  const model = useChatStore((state) => state?.model);
  const mode = useChatStore((state) => state?.mode);
  const [isLoading, setIsLoading] = useState(false);

  // Local state for input message
  const [inputMessage, setInputMessage] = useState("");

  // Get store actions using getState to avoid subscription issues
  const chatStore = useChatStore.getState();

  const agentsUrl =
    import.meta.env?.VITE_AGENTS_BASE_URL || "http://localhost:3031/";
  const api = `${agentsUrl}api/chat`;
  // Use the AI SDK useChat hook with proper configuration
  const { sendMessage, messages, stop, setMessages, status } = useChat({
    id: activeChat || "default",
    messages: currentMessages,
    transport: new DefaultChatTransport({
      api,
    }),
  });

  // Initialize store on mount without blocking UI
  useEffect(() => {
    try {
      const store = useChatStore.getState();
      if (store?.initializeStore) {
        store.initializeStore().catch((error) => {
          console.error("Failed to initialize store:", error);
        });
      }
    } catch (error) {
      console.error("Error during store initialization:", error);
    }
  }, []);

  useEffect(() => {
    setIsLoading(status === "streaming");
  }, [status]);

  // Handle sending messages using useChat hook
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      try {
        let currentChatId = activeChat;

        if (!currentChatId) {
          // Create new chat if none exists
          await chatStore.createNewChat();
          currentChatId = chatStore.activeChat;
        }

        if (!currentChatId) {
          throw new Error("Failed to create or get active chat");
        }

        setInputMessage(""); // Clear input after sending

        // Use sendMessage to send the message
        sendMessage(
          { text: content },
          {
            body: { mode, model, chatId: activeChat },
          }
        );
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [activeChat, chatStore, sendMessage]
  );

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setInputMessage(suggestion);
  }, []);

  const handleSelectChat = useCallback(
    async (chatId: string) => {
      try {
        await chatStore.setActiveChat(chatId);
      } catch (error) {
        console.error("Failed to load chat:", error);
        // Continue with the UI flow even if loading fails
      }
    },
    [chatStore]
  );

  const handleRemoveContextItem = useCallback(
    (itemId: string) => {
      chatStore.removeContextItem(itemId);
    },
    [chatStore]
  );

  const handleAddContextItem = useCallback(
    (item: { name: string; type: string; data?: unknown }) => {
      chatStore.addContextItem(item);
    },
    [chatStore]
  );

  const handleStopResponse = useCallback(() => {
    stop();
  }, [stop]);

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      const updatedMessages = currentMessages.filter(
        (msg) => msg.id !== messageId
      );
      chatStore.setMessages(updatedMessages);
    },
    [currentMessages, chatStore]
  );

  return (
    <ConversationContainer>
      <ConversationContent>
        <ChatContent>
          {activeChat || messages.length > 0 ? (
            <ChatMessages
              messages={messages}
              isResponding={isLoading}
              onDeleteMessage={handleDeleteMessage}
            />
          ) : (
            <EmptyStateContainer>
              <EmptyStateMessage>
                <LogoContainer>
                  <CharaLogo width={200} height={150} />
                  <Title>CharaCodes</Title>
                  <Subtitle>AI Development Tools</Subtitle>
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
        isResponding={isLoading}
        onStopResponse={handleStopResponse}
        initialMessage={inputMessage}
      />
      <Footer />
    </ConversationContainer>
  );
};

export default ConversationView;
