"use client";
import { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Send, Paperclip, X, Loader2 } from "lucide-react";
import type { Message, FileAttachment } from "../types";
import { MessageItem } from "./message-item";
import { useChat } from "@/hooks/use-chat";
import { useProject } from "@/contexts/project-context";
import { ProjectSelector } from "@/components/project-selector";

interface ChatPanelProps {
  initialMessages: Message[];
}

export function ChatPanel({ initialMessages }: ChatPanelProps) {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const { selectedProject, setSelectedProject } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleProjectSelect = (projectId: string, projectName: string) => {
    setSelectedProject({ id: projectId, name: projectName });
  };

  const { messages, input, handleInputChange, handleSubmit, error, status } =
    useChat(true);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      }));

      setAttachments((prev) => [...prev, ...newFiles]);
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment) {
        URL.revokeObjectURL(attachment.url); // Clean up the blob URL
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  const copyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000); // Reset after 2 seconds
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <ProjectSelector
          onProjectSelect={handleProjectSelect}
          selectedProject={selectedProject}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onCopyMessage={copyMessage}
            copiedMessageId={copiedMessageId}
          />
        ))}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-100 text-red-800">
            An error occurred while generating the response. Please try again.
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
              >
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button
                  onClick={() => removeAttachment(file.id)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
              }
            }}
            disabled={status === "streaming"}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={status === "streaming"}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Attach files</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
            }}
            disabled={status === "streaming"}
          >
            {status === "streaming" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
