"use client";
import type { AppRouter } from "@chara/server";
import React from "react";
import superjson from "superjson";

import {
  createTRPCProxyClient,
  loggerLink,
  unstable_httpBatchStreamLink,
} from "@trpc/client";
import type { Observable } from "@trpc/server/observable";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;

// Create the tRPC client
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    loggerLink(),
    unstable_httpBatchStreamLink({
      url: "http://localhost:3030/trpc",
      headers: {
        "trpc-accept": "application/jsonl",
      },
    }),
  ],
});

// Custom hook to handle chat with tRPC
export function useTrpcChat() {
  const [messages, setMessages] = React.useState<
    Array<{
      id: string;
      content: string;
      role: "user" | "assistant";
    }>
  >([]);
  const [input, setInput] = React.useState("");
  const [status, setStatus] = React.useState<
    "ready" | "streaming" | "submitted"
  >("ready");
  const [error, setError] = React.useState<Error | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;

    const userMessage = {
      id: Date.now().toString(),
      content: input,
      role: "user" as const,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setStatus("submitted");
    setError(null);

    try {
      // Create a new AbortController for this request
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Create a temporary message for streaming
      const tempAssistantMessageId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: tempAssistantMessageId, content: "", role: "assistant" },
      ]);

      setStatus("streaming");

      // Call the tRPC streaming endpoint
      const asyncIterator = await trpcClient.messages.ask.query({
        question: input,
      });
      console.log(asyncIterator);
      for await (const chunk of asyncIterator) {
        console.log("Received chunk:", chunk);
      }

      // let fullResponse = "";

      // Subscribe to the stream
      // const subscription = answers.subscribe({
      //   next: (chunk: string) => {
      //     console.log(chunk);
      //     // if (signal.aborted) return;

      //     // fullResponse += chunk.delta;

      //     // // Update the assistant message with the accumulated response
      //     // setMessages((prev) =>
      //     //   prev.map((msg) =>
      //     //     msg.id === tempAssistantMessageId
      //     //       ? { ...msg, content: fullResponse }
      //     //       : msg,
      //     //   ),
      //     // );
      //   },
      //   error: (err: Error | null) => {
      //     console.error("Stream error:", err);
      //     setError(err);
      //     setStatus("ready");
      //   },
      //   complete: () => {
      //     // Update the message with the final ID from the server if needed
      //     setStatus("ready");
      //   },
      // });

      // // Store the subscription to be able to unsubscribe
      // return () => {
      //   subscription.unsubscribe();
      // };
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setStatus("ready");
    }
  };

  const stop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStatus("ready");
    }
  };

  const reload = () => {
    // Implement retry logic if needed
    setError(null);
    setStatus("ready");
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
