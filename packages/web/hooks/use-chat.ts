"use client";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useAIChat } from "@/hooks/use-ai-chat";
import { parseStream } from "@/lib/parse-stream";

// Custom hook to handle chat with tRPC
export function useChat(streamObject = false) {
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
  // Keep track of whether we've cleaned up the current request
  const isCleanedUpRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Clean up any ongoing requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
      streamObject,
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
      let textResponse = "";
      let objectResponse: any = {};

      for await (const chunk of chunks) {
        // Check if request was aborted
        if (signal.aborted) break;

        if (streamObject) {
          const objectToAdd = parseStream(chunk, "object") as any[];
          // Only add extracted object to the response
          if (objectToAdd && objectToAdd.length > 0) {
            objectResponse = objectToAdd.reduce((acc: any, obj: any) => {
              return { ...acc, ...obj };
            }, objectResponse);

            // Update the assistant message with the accumulated response
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAssistantMessageId
                  ? {
                      ...msg,
                      content: objectResponse.content,
                      context: objectResponse,
                    }
                  : msg,
              ),
            );
          }
        } else {
          const textToAdd = parseStream(chunk, "text") as string;
          // Only add extracted text to the response
          if (textToAdd) {
            textResponse += textToAdd;

            // Update the assistant message with the accumulated response
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAssistantMessageId
                  ? { ...msg, content: textResponse }
                  : msg,
              ),
            );
          }
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

  return {
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
