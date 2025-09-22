"use client";

import { useChat } from "@ai-sdk/react";
import {
  generateTitleWithFallback,
  useBatchedMessages,
  useChatStore,
  type InputContextItem,
} from "@chara-codes/core";
import { DefaultChatTransport } from "ai";
import type { DataUIPart, FileUIPart, TextUIPart } from "ai";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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

  // Track processed errors to prevent infinite loops
  const processedErrorsRef = useRef(new Set<string>());

  // Get store actions using getState to avoid subscription issues
  const chatStore = useChatStore.getState();

  // Initialize batched message system
  const {
    messages: batchedMessages,
    replaceMessages,
    updateMessage,
    immediateUpdate,
    flushUpdates,
  } = useBatchedMessages({
    batchInterval: 500, // Update every half second
    onMessagesUpdate: (messages) => {
      // Update the store with batched messages
      chatStore.setMessages(messages);
    },
    initialMessages: currentMessages,
  });

  const agentsUrl =
    import.meta.env?.VITE_AGENTS_BASE_URL || "http://localhost:3031/";
  const api = `${agentsUrl}api/chat`;

  // Use the AI SDK useChat hook with proper configuration
  const { sendMessage, messages, stop, setMessages, status, error } = useChat({
    id: activeChat || "default",
    messages: batchedMessages,
    transport: new DefaultChatTransport({
      api,
    }),
  });

  const prevStatusRef = useRef(status);
  // Sync messages between useChat hook and batched message system
  useEffect(() => {
    // When the chat is active and streaming, use batched updates
    if (status === "streaming" || status === "awaiting_response") {
      replaceMessages(messages);
    } else if (prevStatusRef.current !== "idle" && status === "idle") {
      // When streaming finishes, flush any pending updates and sync final state
      flushUpdates();
      immediateUpdate(messages);
    } else if (status === "idle") {
      // When idle, the store is the source of truth (e.g., loading a chat).
      setMessages(batchedMessages);
    }
    prevStatusRef.current = status;
  }, [
    status,
    setMessages,
    messages,
    batchedMessages,
    replaceMessages,
    flushUpdates,
    immediateUpdate,
  ]);

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
    setIsLoading(status === "streaming" || status === "awaiting_response");
  }, [status]);

  // Add error message to chat - using batched updates to prevent infinite loops
  useEffect(() => {
    if (error) {
      const errorKey = `${error.message}-${Date.now()}`;

      // Check if we've already processed this error
      if (processedErrorsRef.current.has(errorKey)) {
        return;
      }

      processedErrorsRef.current.add(errorKey);
      console.error("An error occurred:", error);

      const lastMessage = batchedMessages[batchedMessages.length - 1];

      // If last message is from assistant, add error part to it
      if (lastMessage && lastMessage.role === "assistant") {
        // Avoid adding duplicate error parts
        if (lastMessage.parts?.some((part) => part.type === "error")) {
          return;
        }

        const updatedMessage = {
          ...lastMessage,
          parts: [
            ...(lastMessage.parts || []),
            { type: "error", error: { message: error.message } },
          ],
        };

        updateMessage(lastMessage.id, updatedMessage);
      } else {
        // Otherwise, create a new assistant message with the error
        const errorMessage = {
          id: `error-${Date.now()}`,
          role: "assistant" as const,
          parts: [{ type: "error", error: { message: error.message } }],
        };

        replaceMessages([...batchedMessages, errorMessage]);
      }
    }
  }, [error, batchedMessages, updateMessage, replaceMessages]);

  // Handle sending messages using useChat hook
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Clear processed errors when sending a new message
      processedErrorsRef.current.clear();

      try {
        let currentChatId = activeChat;

        if (!currentChatId) {
          // Create new chat if none exists, use content as title
          const title = generateTitleWithFallback(content);
          currentChatId = await chatStore.createNewChat(title);
        } else {
          // Update chat title from first message if it's "New Chat"
          await chatStore.updateChatTitleFromFirstMessage(
            currentChatId,
            content
          );
        }

        if (!currentChatId) {
          throw new Error("Failed to create or get active chat");
        }

        setInputMessage(""); // Clear input after sending

        // Create message parts array starting with text
        const parts: Array<
          TextUIPart | FileUIPart | DataUIPart<Record<string, unknown>>
        > = [{ type: "text", text: content } as TextUIPart];

        // Add context items as proper UIMessage parts
        if (contextItems.length > 0) {
          for (const item of contextItems) {
            console.log(item);
            if (item.type === "file" && item.data) {
              // For files, use FileUIPart structure
              parts.push({
                type: "file",
                mediaType: item.mimeType || "application/octet-stream",
                filename: item.name,
                url: item.data, // content should be data URL
              } as FileUIPart);
            } else if (item.type === "image" && item.data) {
              // For images, use FileUIPart structure
              parts.push({
                type: "file",
                mediaType: item.mimeType || "image/png",
                filename: item.name || "image.png",
                url: item.data, // data should be data URL
              } as FileUIPart);
            } else if (item.data || item.content) {
              // For other data, create a data URL and use FileUIPart
              const dataContent =
                typeof item.data === "string"
                  ? item.data
                  : typeof item.content === "string"
                  ? item.content
                  : JSON.stringify(item.data || item.content, null, 2);

              parts.push({
                type: "text",
                text: dataContent,
              });
            }
          }
        }

        // Send message using UIMessage structure
        sendMessage(
          {
            role: "user",
            parts: parts,
          },
          {
            body: { mode, model, chatId: activeChat },
          }
        );

        // Clear context items after sending
        chatStore.clearContextItems();
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [activeChat, chatStore, sendMessage, mode, model, contextItems]
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
    (item: InputContextItem) => {
      chatStore.addContextItem({
        name: item.name,
        type: item.type,
        data: item.data,
        mimeType: item.mimeType,
        isBinary: item.isBinary,
      });
    },
    [chatStore]
  );

  const handleStopResponse = useCallback(() => {
    stop();
  }, [stop]);

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      const updatedMessages = batchedMessages.filter(
        (msg) => msg.id !== messageId
      );
      setMessages(updatedMessages);
      // Use immediate update for delete operations
      immediateUpdate(updatedMessages);
    },
    [batchedMessages, setMessages, immediateUpdate]
  );

  return (
    <ConversationContainer>
      <ConversationContent>
        <ChatContent>
          {batchedMessages.length > 0 ? (
            <ChatMessages
              messages={batchedMessages}
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
        {batchedMessages.length === 0 && (
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
        chatId={activeChat || undefined}
      />
      <Footer />
    </ConversationContainer>
  );
};

export default ConversationView;
