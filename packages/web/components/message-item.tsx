"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Copy,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { Message } from "../types";
import { FileChangesList } from "./file-changes-list";
import { CommandsList } from "./commands-list";
import { FileAttachmentDisplay } from "./file-attachment-display";

interface MessageItemProps {
  message: Message;
  onRegenerate: (messageId: string) => void;
  onNavigateRegeneration: (
    messageId: string,
    direction: "prev" | "next",
  ) => void;
  onCopyMessage: (content: string, messageId: string) => void;
  copiedMessageId: string | null;
  isGenerating?: boolean;
}

export function MessageItem({
  message,
  onRegenerate,
  onNavigateRegeneration,
  onCopyMessage,
  copiedMessageId,
  isGenerating = false,
}: MessageItemProps) {
  return (
    <div
      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
    >
      <div className="flex flex-col items-start gap-2 max-w-[80%]">
        {message.sender === "assistant" && (
          <Avatar className="h-8 w-8">
            <AvatarImage
              src="/placeholder.svg?height=32&width=32"
              alt="Assistant"
            />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
        )}
        <div
          className={`p-3 rounded-lg ${
            message.sender === "user"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {message.content}
          {isGenerating && (
            <div className="mt-1 flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin text-gray-500" />
              <span className="text-sm text-gray-500">Generating...</span>
            </div>
          )}
          {message.fileChanges && message.fileChanges.length > 0 && (
            <FileChangesList changes={message.fileChanges} />
          )}
          {message.commands && message.commands.length > 0 && (
            <CommandsList commands={message.commands} />
          )}
          {message.attachments && message.attachments.length > 0 && (
            <FileAttachmentDisplay attachments={message.attachments} />
          )}
        </div>
        {message.sender === "user" && (
          <Avatar className="h-8 w-8 self-end">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        )}
        {message.sender === "assistant" && !isGenerating && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TooltipProvider>
              <Tooltip open={copiedMessageId === message.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCopyMessage(message.content, message.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copied!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRegenerate(message.id)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {(message.regenerations?.length ?? 0) > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onNavigateRegeneration(message.id, "prev")}
                  disabled={message.currentRegenerationIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>{`${(message.currentRegenerationIndex ?? 0) + 1}/${(message.regenerations?.length ?? 0) + 1}`}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onNavigateRegeneration(message.id, "next")}
                  disabled={
                    message.currentRegenerationIndex ===
                    message.regenerations?.length
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
