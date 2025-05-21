"use client";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { parseStream } from "@/lib/parse-stream";
import { trpc } from "@/utils";
import { ProjectInformation, useProject } from "@/contexts/project-context";

// TODO: there is another use-trpc-chat hook which was created in another PR earlier, so probably remove this one
export function useChat(streamObject = true) {
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
  const { selectedProject } = useProject();
  const [error, setError] = useState<Error | null>(null);
  // Keep track of whether we've cleaned up the current request
  const isCleanedUpRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const utils = trpc.useUtils();

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, input: string) => {
    e.preventDefault();
    debugger;
    if (!input.trim() || status !== "ready" || !selectedProject) return;

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

    try {
      // Abort previous if needed
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      isCleanedUpRef.current = false;
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Create a temporary assistant message
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

      // TODO: add projectId and chatId to the request
      const iterable = await utils.chat.streamObject.fetch({
        question: input,
        project: selectedProject,
      });

      let textResponse = "";
      let objectResponse: any = {};

      for await (const chunk of iterable) {
        if (signal.aborted) break;

        if (streamObject) {
          const parsedChunk =
            typeof chunk === "string" ? JSON.parse(chunk) : chunk;
          if (parsedChunk.content) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAssistantMessageId
                  ? {
                      ...msg,
                      content: parsedChunk.content,
                      context: {
                        ...(msg.context || {}),
                        commands: parsedChunk.commands || [],
                      },
                    }
                  : msg,
              ),
            );
          } else {
            const chunkAsString =
              typeof chunk === "string" ? chunk : JSON.stringify(chunk);
            const objectToAdd = parseStream(chunkAsString, "object") as any[];

            if (objectToAdd && objectToAdd.length > 0) {
              objectResponse = objectToAdd.reduce((acc: any, obj: any) => {
                return { ...acc, ...obj };
              }, objectResponse);

              if (objectResponse.error) {
                console.error("Stream Error:", objectResponse.error);

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === tempAssistantMessageId
                      ? {
                          ...msg,
                          content: `Error: ${objectResponse.error.message}`,
                          context: objectResponse,
                        }
                      : msg,
                  ),
                );

                setError(new Error(objectResponse.error.message));
                setStatus("ready");
                break;
              }

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === tempAssistantMessageId
                    ? {
                        ...msg,
                        content: objectResponse.content || "",
                        context: objectResponse,
                      }
                    : msg,
                ),
              );
            }
          }
        } else {
          const chunkAsString =
            typeof chunk === "string" ? chunk : JSON.stringify(chunk);
          const textToAdd = parseStream(chunkAsString, "text") as string;
          if (textToAdd) {
            textResponse += textToAdd;

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
