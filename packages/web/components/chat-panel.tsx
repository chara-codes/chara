"use client";
import { useState, useRef, useEffect, FormEvent } from "react";
import type { FileAttachment, Message } from "../types";
import { MessageItem } from "./message-item";
import { useTrpcChat } from "@/hooks/use-trpc-chat";
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

  const { messages, error, status, sendChatMessage } = useTrpcChat();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000); // Reset after 2 seconds
  };

  const sendMessage = (messageText: string) => {
    // Call the direct message sending function from useChat hook
    sendChatMessage(messageText);
  };

  const handleSendMessage = (
    inputText: string,
    attachments: FileAttachment[],
    contexts: Array<{ source: string; component: string }>,
  ) => {
    // Format the message content with attached contexts
    let messageContent = inputText;

    // Add contexts at the beginning of the message if there are any
    if (contexts.length > 0) {
      const contextStrings = contexts.map(
        (ctx) => `[${ctx.source}:${ctx.component}]`,
      );
      messageContent = contextStrings.join("\n") + "\n\n" + messageContent;
    }

    if (selectedProject) {
      sendChatMessage(messageContent);
    } else {
      console.error("No project selected");
    }
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
          onSendMessage={handleSendMessage}
          isLoading={status === "streaming"}
        />
      </div>
    </div>
  );
}
