import React from "react";
import { cn } from "../../utils";
import type { MessageBubbleProps } from "./types";

export function MessageBubble({
  content,
  timestamp,
  isUser,
  isThinking = false,
  thinkingContent,
  className,
  actions,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col w-full max-w-full",
        isUser ? "items-end" : "items-start",
        className
      )}
    >
      <div
        className={cn(
          "relative px-4 py-2 rounded-lg",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
          "max-w-[80%]"
        )}
      >
        {isThinking && thinkingContent ? (
          <div className="italic text-sm opacity-80 mb-2">{thinkingContent}</div>
        ) : null}
        
        <div className="whitespace-pre-wrap break-words">{content}</div>
        
        {timestamp && (
          <div className="text-xs opacity-70 mt-1 text-right">{timestamp}</div>
        )}
      </div>
      
      {actions && (
        <div className="mt-1 flex gap-1">{actions}</div>
      )}
    </div>
  );
}
