import React, { useState } from 'react';
import { Chat as ChatUI } from '@frontend/design-system';
import { ChatSidebar } from './chat-sidebar';
import { ChatControls } from './chat-controls';
import { useChat } from '../hooks/use-chat';
import type { ChatContainerProps } from '../types';

/**
 * A complete chat container with sidebar, controls, and chat UI
 */
export function ChatContainer({
  initialChatId,
  onChatCreated,
  onChatSelected,
  showModelSelector = true,
  models = ["claude-3.7-sonnet", "claude-3.5-sonnet", "gpt-4o"],
  defaultModel = "claude-3.7-sonnet",
  className,
  loadChats,
  saveChat,
  showSidebar = true,
  showControls = true,
  maxHeight,
  fullHeight = false,
}: ChatContainerProps) {
  const {
    messages,
    isResponding,
    isThinking,
    isLoading,
    error,
    activeChatId,
    chats,
    model,
    sendMessage,
    stopResponse,
    deleteMessage,
    createNewChat,
    selectChat,
    setModel,
  } = useChat({
    initialChatId,
    initialModel: defaultModel,
    onChatCreated,
    onChatSelected,
  });

  // Local state for layout
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Function to export the current chat
  const handleExportChat = () => {
    if (!activeChatId) return;

    const currentChat = chats.find(chat => chat.id === activeChatId);
    if (!currentChat) return;

    // Use the built-in browser download functionality
    const dataStr = JSON.stringify(currentChat, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `chat-${activeChatId}-${new Date().toISOString()}.json`;

    // @ts-ignore
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Function to clear the current chat
  const handleClearChat = () => {
    createNewChat();
  };

  return (
    <div className={`flex h-full ${className || ''}`}>
      {showSidebar && (
        <ChatSidebar
          chats={chats}
          activeChat={activeChatId}
          onSelectChat={selectChat}
          onNewChat={createNewChat}
          isLoading={isLoading}
          error={error}
          className={`${sidebarOpen ? 'w-64' : 'w-0 opacity-0'} transition-all duration-200 border-r`}
        />
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        {showControls && (
          <ChatControls
            onClearChat={handleClearChat}
            onExportChat={handleExportChat}
            isResponding={isResponding}
            className="px-4 py-2 border-b"
          />
        )}

        <div className="flex-1 overflow-hidden">
          <ChatUI
            // messages={messages}
            // isLoading={isResponding}
            // isThinking={isThinking}
            // onSendMessage={sendMessage}
            // onStopResponse={stopResponse}
            // onDeleteMessage={deleteMessage}
            // showModelSelector={showModelSelector}
            // models={models}
            // selectedModel={model}
            // onModelChange={setModel}
            // maxHeight={maxHeight}
            // fullHeight={fullHeight}
            // className="h-full border-none shadow-none"
          />
        </div>
      </div>
    </div>
  );
}
