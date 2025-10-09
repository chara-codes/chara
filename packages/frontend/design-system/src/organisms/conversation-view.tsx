"use client";

import { useChat } from "@ai-sdk/react";
import {
  generateTitleWithFallback,
  toast,
  useChatStore,
  type InputContextItem,
} from "@chara-codes/core";
import { DefaultChatTransport } from "ai";
import type { DataUIPart, FileUIPart, TextUIPart, UIMessage } from "ai";
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
  color: ${props => props.theme.colors.text};
  font-size: 24px;
  font-weight: 600;
  margin: 12px 0 4px;
  text-align: center;
  transition: color ${props => props.theme.transitions.theme};
`;

const Subtitle = styled.h2`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 16px;
  font-weight: 400;
  margin: 0 0 8px;
  text-align: center;
  transition: color ${props => props.theme.transitions.theme};
`;

const EmptyStateMessage = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 14px;
  text-align: center;
  align-self: center;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color ${props => props.theme.transitions.theme};
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
  const lastErrorTimeRef = useRef<number>(0);
  const ERROR_DEBOUNCE_MS = 1000; // Prevent same error within 1 second

  // Get store actions using getState to avoid subscription issues
  const chatStore = useChatStore.getState();

  const agentsUrl =
    import.meta.env?.VITE_AGENTS_BASE_URL || "http://localhost:3031/";
  const api = `${agentsUrl}api/chat`;

  // Use the AI SDK useChat hook with proper configuration
  const { sendMessage, messages, stop, setMessages, status, error } = useChat({
    id: activeChat || "default",
    messages: currentMessages,
    experimental_throttle: 500,
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: setMessages dependency is stable
  useEffect(() => {
    setMessages(currentMessages);
    // Clear processed errors when chat changes
    processedErrorsRef.current.clear();
    lastErrorTimeRef.current = 0;
  }, [activeChat, currentMessages, setMessages]);

  useEffect(() => {
    setIsLoading(status === "streaming" || status === "submitted");
  }, [status]);

  // Handle errors from useChat hook
  useEffect(() => {
    if (error && !processedErrorsRef.current.has(error.message)) {
      const now = Date.now();

      // Debounce errors to prevent rapid-fire processing
      if (now - lastErrorTimeRef.current < ERROR_DEBOUNCE_MS) {
        console.log("Debouncing error, too soon after last error");
        return;
      }

      lastErrorTimeRef.current = now;

      // Mark this error as processed to prevent infinite loops
      processedErrorsRef.current.add(error.message);

      // Use functional update to avoid dependency on messages state
      setMessages((currentMessages) => {
        const updatedMessages = [...currentMessages];
        const lastAssistantIndex = updatedMessages.length - 1;

        if (
          lastAssistantIndex >= 0 &&
          updatedMessages[lastAssistantIndex]?.role === "assistant"
        ) {
          // Add error part to the last assistant message
          const lastMessage = updatedMessages[lastAssistantIndex];
          const errorPart = {
            type: "error",
            error: error.message || "An unexpected error occurred",
          } as any; // Using 'any' because UIMessage doesn't officially support custom error parts

          updatedMessages[lastAssistantIndex] = {
            ...lastMessage,
            parts: [...(lastMessage.parts || []), errorPart],
          };
        } else {
          // If no assistant message exists, create a new error message
          const errorMessage: UIMessage = {
            id: `error-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            role: "assistant",
            parts: [
              {
                type: "error",
                error: error.message || "An unexpected error occurred",
              } as any, // Using 'any' because UIMessage doesn't officially support custom error parts
            ],
          };
          updatedMessages.push(errorMessage);
        }

        return updatedMessages;
      });
    }
  }, [error, setMessages]);

  // Handle sending messages using useChat hook
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Clear processed errors when sending a new message
      processedErrorsRef.current.clear();
      lastErrorTimeRef.current = 0;

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
    async (messageId: string) => {
      if (!activeChat) {
        console.error("No active chat to delete messages from");
        return;
      }

      try {
        // Call the agents /api/chat DELETE endpoint directly
        const response = await fetch(api, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messageId,
            chatId: activeChat,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const result = await response.json();

        // Update local state by removing the deleted messages
        const updatedMessages = messages.filter(
          (msg) => !result.deletedMessageIds?.map(String).includes(msg.id)
        );

        setMessages(updatedMessages);

        // Update the chat store with the new messages immediately
        chatStore.setMessagesImmediate(updatedMessages);

        // Log rollback information if available
        if (result.rollbackResult === "success") {
          console.log(`Git rollback completed successfully`);
        }

        console.log(`Successfully deleted ${result.deletedCount} messages`);

        // Show success toast
        toast({
          title: "Messages deleted",
          description: `Successfully deleted ${result.deletedCount} message${
            result.deletedCount === 1 ? "" : "s"
          }${
            result.rollbackResult === "success"
              ? " and rolled back changes"
              : ""
          }`,
          variant: "default",
        });
      } catch (error) {
        console.error("Failed to delete messages:", error);

        // Show error toast
        toast({
          title: "Failed to delete messages",
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
          variant: "destructive",
        });
      }
    },
    [activeChat, messages, setMessages, chatStore, api]
  );

  return (
    <ConversationContainer>
      <ConversationContent>
        <ChatContent>
          {messages.length > 0 ? (
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
        {messages.length === 0 && (
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
