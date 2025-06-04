'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '@frontend/core';
import { useWidgetStore } from '@/store/widget-store';
import { 
  SendHorizontal, 
  Loader2,
  Bot,
  User,
  X
} from 'lucide-react';

export function WidgetChat() {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    isResponding,
    isThinking,
    activeChat,
    createNewChat,
    sendMessage,
    stopResponse,
    initializeStore
  } = useChatStore();
  
  const { config, closeWidget } = useWidgetStore();
  
  // Initialize chat store and create a new chat if needed
  useEffect(() => {
    initializeStore().then(() => {
      if (!activeChat) {
        createNewChat();
      }
    });
  }, [initializeStore, createNewChat, activeChat]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  // Handle message submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isResponding) return;
    
    sendMessage(inputValue);
    setInputValue('');
  };
  
  // Create dynamic styles based on configuration
  const headerStyle = {
    backgroundColor: config.primaryColor,
    color: config.primaryTextColor,
  };
  
  const userMessageStyle = {
    backgroundColor: config.primaryColor,
    color: config.primaryTextColor,
  };
  
  // Show welcome message if no messages
  const showWelcomeMessage = messages.length === 0;
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div 
        className="p-4 flex items-center justify-between"
        style={headerStyle}
      >
        <div className="flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          <h3 className="font-medium">{config.title}</h3>
        </div>
        <button
          onClick={closeWidget}
          className="p-1 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Close chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showWelcomeMessage ? (
          <div className="flex items-start mb-4">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2 flex-shrink-0">
              <Bot className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="bg-muted p-3 rounded-lg max-w-[80%]">
              <p>{config.welcomeMessage}</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id}
              className={`flex items-start ${message.isUser ? 'justify-end' : ''}`}
            >
              {!message.isUser && (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2 flex-shrink-0">
                  <Bot className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              
              <div 
                className={`p-3 rounded-lg max-w-[80%] ${
                  message.isUser 
                    ? 'rounded-tr-none'
                    : 'rounded-tl-none'
                }`}
                style={message.isUser ? userMessageStyle : {}}
              >
                {message.isThinking ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                )}
              </div>
              
              {message.isUser && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center ml-2 flex-shrink-0" style={{ backgroundColor: config.primaryColor }}>
                  <User className="h-5 w-5" style={{ color: config.primaryTextColor }} />
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Anchor for scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 p-2 bg-muted/30 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isResponding}
          />
          <button
            type="submit"
            className="p-2 rounded-r-md"
            style={headerStyle}
            disabled={!inputValue.trim() || isResponding}
          >
            {isResponding ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SendHorizontal className="h-5 w-5" />
            )}
          </button>
        </form>
        
        {isResponding && (
          <div className="mt-2 text-center">
            <button
              onClick={stopResponse}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Stop generating
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
