"use client";
import { useState, useRef, useEffect, FormEvent } from "react";
import type { Message } from "../types";
import { MessageItem } from "./message-item";
import { useChat } from "@/hooks/use-chat";
import { useProject } from "@/contexts/project-context";
import { ProjectSelector } from "@/components/project-selector";
import { ChatInput } from "./chat-input";

interface ChatPanelProps {
  initialMessages: Message[];
}

export function ChatPanel({ initialMessages }: ChatPanelProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const { selectedProject, setSelectedProject } = useProject();
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
        <ChatInput
          onSendMessage={handleSubmit}
          isLoading={status === "streaming"}
        />
      </div>
    </div>
  );
}
