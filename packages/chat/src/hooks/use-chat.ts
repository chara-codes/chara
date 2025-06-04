import { useState, useEffect, useCallback } from 'react';
import { useChatStore } from '@frontend/core';
import type { Message, ChatMode } from '../types';

interface UseChatOptions {
  /**
   * Initial chat ID to display
   */
  initialChatId?: string | null;
  
  /**
   * Initial model to use
   */
  initialModel?: string;
  
  /**
   * Function called when a chat is created
   */
  onChatCreated?: (chatId: string) => void;
  
  /**
   * Function called when a chat is selected
   */
  onChatSelected?: (chatId: string) => void;
}

interface UseChatResult {
  /**
   * List of all messages in the current chat
   */
  messages: Message[];
  
  /**
   * Is a response currently being generated
   */
  isResponding: boolean;
  
  /**
   * Is the AI currently in thinking mode
   */
  isThinking: boolean;
  
  /**
   * Is the chat data being loaded
   */
  isLoading: boolean;
  
  /**
   * Error message if loading failed
   */
  error: string | null;
  
  /**
   * Currently active chat ID
   */
  activeChatId: string | null;
  
  /**
   * List of all chats
   */
  chats: any[];
  
  /**
   * Current chat mode
   */
  mode: ChatMode;
  
  /**
   * Currently selected AI model
   */
  model: string;
  
  /**
   * Send a message to the AI
   */
  sendMessage: (content: string) => Promise<void>;
  
  /**
   * Stop the current AI response
   */
  stopResponse: () => void;
  
  /**
   * Delete a message by ID
   */
  deleteMessage: (messageId: string) => void;
  
  /**
   * Create a new chat
   */
  createNewChat: () => void;
  
  /**
   * Select a chat by ID
   */
  selectChat: (chatId: string) => void;
  
  /**
   * Change the AI model
   */
  setModel: (model: string) => void;
  
  /**
   * Initialize the chat store
   */
  initialize: () => Promise<void>;
}

/**
 * Hook to access and manage chat functionality
 */
export function useChat(options: UseChatOptions = {}): UseChatResult {
  const {
    initialChatId,
    initialModel,
    onChatCreated,
    onChatSelected,
  } = options;
  
  const {
    messages,
    isResponding,
    isThinking,
    isLoading,
    loadError,
    activeChat,
    chats,
    mode,
    model,
    initializeStore,
    sendMessage,
    stopResponse,
    deleteMessage,
    createNewChat,
    setActiveChat,
    setModel: updateModel,
  } = useChatStore();
  
  const [initialized, setInitialized] = useState(false);
  
  // Initialize the store and set the initial chat/model if provided
  useEffect(() => {
    if (!initialized) {
      const init = async () => {
        await initializeStore();
        
        if (initialChatId) {
          setActiveChat(initialChatId);
        }
        
        if (initialModel) {
          updateModel(initialModel);
        }
        
        setInitialized(true);
      };
      
      init();
    }
  }, [initialized, initializeStore, initialChatId, initialModel, setActiveChat, updateModel]);
  
  // Handle chat creation with callback
  const handleCreateNewChat = useCallback(() => {
    createNewChat();
    
    // The chat ID will be set when the first message is sent
    // We can't determine it here because it hasn't been created yet
  }, [createNewChat]);
  
  // Handle chat selection with callback
  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChat(chatId);
    
    if (onChatSelected) {
      onChatSelected(chatId);
    }
  }, [setActiveChat, onChatSelected]);
  
  // Handle model change
  const handleSetModel = useCallback((newModel: string) => {
    updateModel(newModel);
  }, [updateModel]);
  
  // Handle sending message with callback for chat creation
  const handleSendMessage = useCallback(async (content: string) => {
    const previousChatId = activeChat;
    
    await sendMessage(content);
    
    // If this was a new chat, call the onChatCreated callback
    if (!previousChatId && activeChat && onChatCreated) {
      onChatCreated(activeChat);
    }
  }, [activeChat, sendMessage, onChatCreated]);
  
  // Initialize function
  const initialize = useCallback(async () => {
    await initializeStore();
  }, [initializeStore]);
  
  return {
    messages,
    isResponding,
    isThinking,
    isLoading,
    error: loadError,
    activeChatId: activeChat,
    chats,
    mode,
    model,
    sendMessage: handleSendMessage,
    stopResponse,
    deleteMessage,
    createNewChat: handleCreateNewChat,
    selectChat: handleSelectChat,
    setModel: handleSetModel,
    initialize,
  };
}
