"use client";

import React, { useEffect } from "react";
import { useChatStore } from "@frontend/core";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";

export function ChatPanel() {
  const { initializeStore, createNewChat, activeChat } = useChatStore();
  
  // Initialize the chat store on first render
  useEffect(() => {
    initializeStore().then(() => {
      if (!activeChat) {
        createNewChat();
      }
    });
  }, [initializeStore, createNewChat, activeChat]);
  
  return (
    <div className="flex flex-col h-full">
      <MessageList />
      <ChatInput />
    </div>
  );
}
