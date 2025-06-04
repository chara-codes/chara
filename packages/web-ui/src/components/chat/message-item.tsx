import React from "react";
import { Bot, User } from "lucide-react";
import type { Message } from "@frontend/core";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.isUser;
  
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
      
      <div
        className={cn(
          "rounded-lg p-3 max-w-[85%]",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        )}
      >
        {message.isThinking ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs">Thinking...</span>
            </div>
            <div className="whitespace-pre-wrap">{message.thinkingContent}</div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}
        
        {message.fileDiffs && message.fileDiffs.length > 0 && (
          <div className="mt-2 text-xs opacity-80">
            {message.fileDiffs.length} file changes suggested
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
