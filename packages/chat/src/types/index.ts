import { Chat } from '@frontend/core';

// Re-export core types for convenience
export type {
  Message,
  Chat,
  ChatMode,
  ContextItem,
  FileDiff,
  ToolCall
} from '@frontend/core';

// Local types
export interface ChatContainerProps {
  /**
   * Initial chat ID to display
   */
  initialChatId?: string | null;

  /**
   * Function called when a new chat is created
   */
  onChatCreated?: (chatId: string) => void;

  /**
   * Function called when a chat is selected
   */
  onChatSelected?: (chatId: string) => void;

  /**
   * Show the model selector dropdown
   */
  showModelSelector?: boolean;

  /**
   * List of available models
   */
  models?: string[];

  /**
   * Default selected model
   */
  defaultModel?: string;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Function called to load chats
   * If not provided, the default chat store will be used
   */
  loadChats?: () => Promise<Chat[]>;

  /**
   * Function called to save a chat
   * If not provided, the default chat store will be used
   */
  saveChat?: (chat: Chat) => Promise<void>;

  /**
   * Show the sidebar with chat history
   */
  showSidebar?: boolean;

  /**
   * Show additional chat controls (clear chat, etc.)
   */
  showControls?: boolean;

  /**
   * Maximum height of the chat container
   */
  maxHeight?: string;

  /**
   * Make the chat container take full height of its parent
   */
  fullHeight?: boolean;
}

export interface ChatSidebarProps {
  /**
   * List of chats to display
   */
  chats: Chat[];

  /**
   * Currently active chat ID
   */
  activeChat: string | null;

  /**
   * Function called when a chat is selected
   */
  onSelectChat: (chatId: string) => void;

  /**
   * Function called when a new chat button is clicked
   */
  onNewChat: () => void;

  /**
   * Function called when a chat is deleted
   */
  onDeleteChat?: (chatId: string) => void;

  /**
   * Is data currently loading
   */
  isLoading?: boolean;

  /**
   * Error message if loading failed
   */
  error?: string | null;

  /**
   * Additional CSS class names
   */
  className?: string;
}

export interface ChatControlsProps {
  /**
   * Function to clear all messages
   */
  onClearChat: () => void;

  /**
   * Function to export chat history
   */
  onExportChat?: () => void;

  /**
   * Is currently sending a message
   */
  isResponding?: boolean;

  /**
   * Additional CSS class names
   */
  className?: string;
}
