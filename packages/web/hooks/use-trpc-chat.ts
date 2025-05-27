"use client";

import { useState, useRef, useEffect, FormEvent, ChangeEvent } from "react";
import { useProject } from "@/contexts/project-context";
import { trpc } from "@/utils/trpc";
import { toast } from "@/hooks/use-toast";
import { useStack } from "@/contexts/stack-context";

export function useTrpcChat() {
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      content: string;
      context?: Record<string, any>;
      role: "user" | "assistant";
      timestamp: Date;
      regenerations?: string[];
      currentRegenerationIndex?: number;
    }>
  >([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"ready" | "streaming" | "submitted">(
    "ready",
  );
  const [error, setError] = useState<Error | null>(null);
  const [tempAiMessageId, setTempAiMessageId] = useState<string | null>(null);
  const { selectedProject } = useProject();
  const { selectedStack } = useStack();

  // References to manage streaming and cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCleanedUpRef = useRef(false);
  const [streamParams, setStreamParams] = useState<{
    question: string;
    project: any;
    stack: any;
  } | null>(null);

  // Set up the query
  const {
    data,
    fetchStatus,
    error: queryError,
    refetch,
  } = trpc.chat.streamObject.useQuery(
    streamParams ?? { question: "", project: null, stack: null },
    {
      enabled: false, // Don't run automatically
      retry: false,
      staleTime: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  );

  useEffect(() => {
    if (data && status === "streaming" && tempAiMessageId) {
      const latestSummary = data.at(-1)?.summary || "";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempAiMessageId
            ? {
                ...msg,
                content: latestSummary,
              }
            : msg,
        ),
      );
    }
  }, [data, status, tempAiMessageId]);

  // Handle query errors
  useEffect(() => {
    if (queryError && status === "streaming") {
      console.error("Query error:", queryError);
      setError(
        queryError instanceof Error ? queryError : new Error("Unknown error"),
      );
      setStatus("ready");

      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    }
  }, [queryError, status]);

  // Clean up when streaming completes
  useEffect(() => {
    if (fetchStatus !== "fetching" && status === "streaming") {
      setStatus("ready");
    }
  }, [fetchStatus, status]);

  // Clean up any ongoing requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (streamParams?.question.trim()) {
      setStatus("streaming");
      refetch();
    }
  }, [streamParams]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const sendChatMessage = async (messageText: string) => {
    if (!messageText.trim() || status !== "ready") return;
    console.log("Sending message from useTrpcChat:", messageText);

    // Add user message to state
    const userMessage = {
      id: Date.now().toString(),
      content: messageText,
      role: "user" as const,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setStatus("submitted");
    setError(null);

    // Create a temporary message for streaming
    const tempAssistantMessageId = `assistant-${Date.now()}`;
    setTempAiMessageId(tempAssistantMessageId);
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

    // Clean up any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Set up new abort controller
    abortControllerRef.current = new AbortController();
    isCleanedUpRef.current = false;

    // Set the stream parameters and trigger the query
    setStreamParams({
      question: messageText,
      project: selectedProject,
      stack: selectedStack
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const inputValue = (formData.get("message") as string) || input;

    await sendChatMessage(inputValue);
  };

  const stop = () => {
    if (abortControllerRef.current && !isCleanedUpRef.current) {
      isCleanedUpRef.current = true;
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStatus("ready");
    }
  };

  const regenerateMessage = async (messageId: string) => {
    // Find the message to regenerate and its preceding user message
    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex <= 0 || messages[messageIndex].role !== "assistant")
      return;

    const userMessage = messages[messageIndex - 1];

    // Store the current response as a regeneration
    const currentMessage = messages[messageIndex];
    let regenerations = currentMessage.regenerations || [];
    regenerations.push(currentMessage.content);

    // Remove the message to regenerate
    setMessages((prevMessages) => prevMessages.slice(0, messageIndex));

    // Send the user message again to regenerate the response
    await sendChatMessage(userMessage.content);
  };

  const navigateRegeneration = (
    messageId: string,
    direction: "prev" | "next",
  ) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.id === messageId && msg.regenerations?.length) {
          const currentIndex = msg.currentRegenerationIndex || 0;
          const newIndex =
            direction === "prev"
              ? Math.max(0, currentIndex - 1)
              : Math.min(msg.regenerations?.length || 0, currentIndex + 1);

          // If it's the original message
          if (newIndex === 0) {
            return {
              ...msg,
              currentRegenerationIndex: 0,
            };
          }

          // Otherwise, it's a regeneration
          return {
            ...msg,
            content: msg.regenerations![newIndex - 1],
            currentRegenerationIndex: newIndex,
          };
        }
        return msg;
      }),
    );
  };

  const reload = () => {
    setError(null);
    setStatus("ready");

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isCleanedUpRef.current = false;
  };

  return {
    messages,
    input,
    status,
    error,
    handleInputChange,
    handleSubmit,
    sendChatMessage,
    stop,
    reload,
    regenerateMessage,
    navigateRegeneration,
  };
}
