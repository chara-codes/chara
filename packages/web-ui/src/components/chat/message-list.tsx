"use client";

import React, { useEffect, useRef } from "react";
import { useChatStore } from "@frontend/core";
import { MessageItem } from "@/components/chat/message-item";
import { Button } from "@/components/ui/button";

export function MessageList() {
  const { messages, isResponding, stopResponse } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <h3 className="text-lg font-medium mb-2">Welcome to AI Chat & Preview</h3>
            <p className="text-sm text-muted-foreground">
              Start a conversation by typing a message below. Ask about code, request file changes, 
              or get help with programming tasks.
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
          
          {isResponding && (
            <div className="flex justify-center pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={stopResponse}
                className="text-xs"
              >
                Stop generating
              </Button>
            </div>
          )}
        </>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
