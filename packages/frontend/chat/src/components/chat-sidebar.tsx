import React from 'react';
import { Button } from '@frontend/design-system';
import { PlusCircle, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { formatChatTimestamp, getChatPreview } from '../utils';
import type { ChatSidebarProps } from '../types';

/**
 * Sidebar component displaying chat history
 */
export function ChatSidebar({
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isLoading = false,
  error = null,
  className,
}: ChatSidebarProps) {
  if (isLoading) {
    return (
      <div className={`p-4 ${className || ''}`}>
        <div className="flex items-center justify-center h-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading chats...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className || ''}`}>
        <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
          <p className="font-medium">Error loading chats</p>
          <p className="mt-1">{error}</p>
        </div>
        <Button
          onClick={onNewChat}
          className="w-full mt-4"
          variant="outline"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      <div className="p-4 border-b">
        <Button
          onClick={onNewChat}
          className="w-full"
          variant="default"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {chats.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            <p>No chats yet</p>
            <p className="text-sm mt-1">Start a new conversation</p>
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-md text-sm
                  group flex items-center justify-between
                  ${activeChat === chat.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-muted/60'}
                `}
              >
                <div className="flex items-center truncate">
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-medium truncate">{chat.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {formatChatTimestamp(chat.timestamp)}
                    </div>
                  </div>
                </div>
                
                {onDeleteChat && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
