"use client";
import React from "react";
import { parseStreamChunk } from "../lib/stream-parser";
import { useAIChat } from "@/hooks/use-ai-chat";

// Custom hook to handle chat with tRPC
export function useChat() {
  const [messages, setMessages] = React.useState<
    Array<{
      id: string;
      content: string;
      role: "user" | "assistant";
      timestamp: Date;
      regenerations?: string[];
      currentRegenerationIndex?: number;
    }>
  >([]);
  const [input, setInput] = React.useState("");
  const [status, setStatus] = React.useState<
    "ready" | "streaming" | "submitted"
  >("ready");
  const [error, setError] = React.useState<Error | null>(null);
  // Keep track of whether we've cleaned up the current request
  const isCleanedUpRef = React.useRef(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Clean up any ongoing requests
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;

    const userMessage = {
      id: Date.now().toString(),
      content: input,
      role: "user" as const,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setStatus("submitted");
    setError(null);

    const { stream } = useAIChat<{ question: string }>(
      "http://localhost:3030/trpc",
    );
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Create a new AbortController for this request
      isCleanedUpRef.current = false;
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Create a temporary message for streaming
      const tempAssistantMessageId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempAssistantMessageId,
          content: "",
          role: "assistant",
          timestamp: new Date(),
          regenerations: [],
          currentRegenerationIndex: 0,
        },
      ]);
      setStatus("streaming");

      const chunks = await stream({ question: input }, signal);
      let fullResponse = "";

      for await (const chunk of chunks) {
        // Check if request was aborted
        if (signal.aborted) break;

        const textToAdd = parseStreamChunk(chunk);

        // Only add extracted text to the response
        if (textToAdd) {
          fullResponse += textToAdd;

          // Update the assistant message with the accumulated response
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantMessageId
                ? { ...msg, content: fullResponse }
                : msg,
            ),
          );
        }
      }

      // Mark as complete when done
      setStatus("ready");
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setStatus("ready");
      abortControllerRef.current = null;
      isCleanedUpRef.current = true;
    }
  };

  const stop = () => {
    if (abortControllerRef.current && !isCleanedUpRef.current) {
      isCleanedUpRef.current = true;
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStatus("ready");
    }
  };

  const reload = () => {
    // Reset error state and prepare for new requests
    setError(null);
    setStatus("ready");

    // Clean up any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isCleanedUpRef.current = false;
  };

  const regenerateMessage = async (messageId: string) => {
    // First check if we're already streaming
    if (status !== "ready") {
      return;
    }

    // Find the message to regenerate
    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== "assistant") {
      console.error(
        "Cannot regenerate: message not found or not an assistant message",
      );
      return;
    }

    // Find the preceding user message
    let userMessageIndex = messageIndex - 1;
    while (
      userMessageIndex >= 0 &&
      messages[userMessageIndex].role !== "user"
    ) {
      userMessageIndex--;
    }

    if (userMessageIndex < 0) {
      console.error("Cannot regenerate: no preceding user message found");
      return;
    }

    const userMessage = messages[userMessageIndex];

    // Store the current message content in regenerations before regenerating
    const messageToRegenerate = messages[messageIndex];
    const regenerations = [
      ...(messageToRegenerate.regenerations || []),
      messageToRegenerate.content,
    ];

    // Remove all messages after the regenerated message
    setMessages((prev) => prev.slice(0, messageIndex + 1));
    setError(null);
    setStatus("submitted");

    const { stream } = useAIChat("http://localhost:3030/trpc");
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Create a new AbortController for this request
      isCleanedUpRef.current = false;
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Create a temporary message for streaming with regeneration history
      const tempAssistantMessageId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev.slice(0, messageIndex),
        {
          id: tempAssistantMessageId,
          content: "",
          role: "assistant",
          timestamp: new Date(),
          regenerations,
          currentRegenerationIndex: regenerations.length,
        },
      ]);
      setStatus("streaming");

      const chunks = await stream(userMessage.content, signal);
      let fullResponse = "";

      for await (const chunk of chunks) {
        // Check if request was aborted
        if (signal.aborted) break;

        const textToAdd = parseStreamChunk(chunk);

        // Only add extracted text to the response
        if (textToAdd) {
          fullResponse += textToAdd;

          // Update the assistant message with the accumulated response
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantMessageId
                ? { ...msg, content: fullResponse }
                : msg,
            ),
          );
        }
      }

      // Mark as complete when done
      setStatus("ready");
    } catch (err) {
      console.error("Error regenerating message:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setStatus("ready");
      abortControllerRef.current = null;
      isCleanedUpRef.current = true;
    }
  };

  return {
    regenerateMessage,
    navigateRegeneration: (messageId: string, direction: "prev" | "next") => {
      setMessages((prev) => {
        const messageIndex = prev.findIndex((msg) => msg.id === messageId);
        if (messageIndex === -1) return prev;

        const message = prev[messageIndex];
        if (!message.regenerations || message.regenerations.length === 0)
          return prev;

        const currentIndex = message.currentRegenerationIndex || 0;
        let newIndex: number;

        if (direction === "prev") {
          // Navigate to previous regeneration or wrap around to latest
          newIndex =
            currentIndex > 0 ? currentIndex - 1 : message.regenerations.length;
        } else {
          // Navigate to next regeneration or wrap around to current
          newIndex =
            currentIndex < message.regenerations.length ? currentIndex + 1 : 0;
        }

        // Update the message content based on the regeneration index
        let newContent = message.content;
        if (newIndex < message.regenerations.length) {
          newContent = message.regenerations[newIndex];
        }

        // Create a new messages array with the updated message
        return prev.map((msg, i) => {
          if (i === messageIndex) {
            return {
              ...msg,
              content: newContent,
              currentRegenerationIndex: newIndex,
            };
          }
          return msg;
        });
      });
    },
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    error,
    reload,
  };
}
