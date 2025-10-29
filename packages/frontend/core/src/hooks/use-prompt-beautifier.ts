"use client";

import { useCallback, useEffect, useState } from "react";
import { useBeautifyChat, useChatStore } from "../stores/chat-store";

export interface BeautifyOptions {
  onStart?: () => void;
  onProgress?: (text: string, delta: string) => void;
  onComplete?: (finalText: string) => void;
  onError?: (error: Error) => void;
}

export interface BeautifyState {
  isBeautifying: boolean;
  progress: string;
  result: string | null;
  error: Error | null;
}

// Chat message interfaces to replace any usage
export interface ChatPart {
  type: string;
  [key: string]: unknown;
}

export interface ChatMessage {
  role: string;
  parts: ChatPart[];
  [key: string]: unknown;
}

/**
 * Advanced hook for prompt beautification that integrates with the chat store
 * and provides a more convenient API for components
 */
export const usePromptBeautifier = (): {
  isBeautifying: boolean;
  progress: string;
  result: string | null;
  error: Error | null;
  beautifyPrompt: (prompt: string, options?: BeautifyOptions) => void;
  stopBeautifying: () => void;
  clearResult: () => void;
  beautifyWithFallback: (
    prompt: string,
    onTextDelta: (delta: string) => void,
    onComplete: (finalText: string) => void,
    onError: (error: Error) => void
  ) => void;
  messages: ChatMessage[];
  status: string;
} => {
  const chatStore = useChatStore();
  const beautifyChat = useBeautifyChat();

  const [state, setState] = useState<BeautifyState>({
    isBeautifying: false,
    progress: "",
    result: null,
    error: null,
  });

  const [previousTextLength, setPreviousTextLength] = useState(0);
  const [currentOptions, setCurrentOptions] = useState<BeautifyOptions | null>(
    null
  );

  // Monitor beautify chat messages for streaming updates
  useEffect(() => {
    const lastMessage = beautifyChat.messages[beautifyChat.messages.length - 1];

    if (lastMessage?.role === "assistant") {
      const currentText = lastMessage.parts
        .filter(
          (part): part is { type: "text"; text: string } => part.type === "text"
        )
        .map((part) => part.text)
        .join("");

      if (currentText.length > previousTextLength) {
        const delta = currentText.slice(previousTextLength);
        setPreviousTextLength(currentText.length);

        setState((prev) => ({
          ...prev,
          progress: currentText,
        }));

        // Call progress callback if provided
        currentOptions?.onProgress?.(currentText, delta);
      }
    }
  }, [beautifyChat.messages, previousTextLength, currentOptions]);

  // Monitor status changes
  useEffect(() => {
    const isActive =
      beautifyChat.status === "streaming" ||
      beautifyChat.status === "submitted";

    setState((prev) => ({
      ...prev,
      isBeautifying: isActive,
    }));

    // Handle completion
    if (
      beautifyChat.status === "ready" &&
      state.progress &&
      state.isBeautifying
    ) {
      setState((prev) => ({
        ...prev,
        result: prev.progress,
        error: null,
      }));

      currentOptions?.onComplete?.(state.progress);
      setCurrentOptions(null);
    }

    // Handle errors
    if (beautifyChat.status === "error") {
      const error = new Error("Failed to beautify prompt");
      setState((prev) => ({
        ...prev,
        error,
        isBeautifying: false,
      }));

      currentOptions?.onError?.(error);
      setCurrentOptions(null);
    }
  }, [
    beautifyChat.status,
    state.progress,
    state.isBeautifying,
    currentOptions,
  ]);

  /**
   * Beautify a prompt with optional callbacks
   */
  const beautifyPrompt = useCallback(
    (prompt: string, options?: BeautifyOptions) => {
      if (!prompt.trim()) {
        throw new Error("Prompt cannot be empty");
      }

      if (state.isBeautifying) {
        throw new Error("Beautification already in progress");
      }

      // Reset state
      setState({
        isBeautifying: false,
        progress: "",
        result: null,
        error: null,
      });
      setPreviousTextLength(0);
      setCurrentOptions(options || null);

      // Call start callback
      options?.onStart?.();

      // Send the beautify request
      beautifyChat.beautifyPrompt(prompt);
    },
    [beautifyChat, state.isBeautifying]
  );

  /**
   * Stop the current beautification process
   */
  const stopBeautifying = useCallback(() => {
    if (beautifyChat.stop && state.isBeautifying) {
      beautifyChat.stop();
      setState((prev) => ({
        ...prev,
        isBeautifying: false,
      }));
      setCurrentOptions(null);
    }
  }, [beautifyChat, state.isBeautifying]);

  /**
   * Clear the current result and reset state
   */
  const clearResult = useCallback(() => {
    setState({
      isBeautifying: false,
      progress: "",
      result: null,
      error: null,
    });
    setPreviousTextLength(0);
    setCurrentOptions(null);
  }, []);

  /**
   * Use the fallback store method for beautification
   * This is useful when you need to use beautification outside of React components
   */
  const beautifyWithFallback = useCallback(
    (
      prompt: string,
      onTextDelta: (delta: string) => void,
      onComplete: (finalText: string) => void,
      onError: (error: Error) => void
    ) => {
      chatStore.beautifyPromptStream(prompt, onTextDelta, onComplete, onError);
    },
    [chatStore]
  );

  return {
    // State
    ...state,

    // Actions
    beautifyPrompt,
    stopBeautifying,
    clearResult,
    beautifyWithFallback,

    // Raw chat access for advanced use cases
    messages: beautifyChat.messages,
    status: beautifyChat.status,
  };
};

/**
 * Simplified hook for basic beautification needs
 */
export const useSimpleBeautifier = (): {
  prompt: string;
  setPrompt: (prompt: string) => void;
  handleBeautify: () => void;
  beautifyPrompt: (prompt: string, options?: BeautifyOptions) => void;
  isBeautifying: boolean;
  result: string | null;
  error: Error | null;
  stopBeautifying: () => void;
  clearResult: () => void;
} => {
  const {
    beautifyPrompt,
    isBeautifying,
    result,
    error,
    stopBeautifying,
    clearResult,
  } = usePromptBeautifier();

  const [prompt, setPrompt] = useState("");

  const handleBeautify = useCallback(() => {
    if (prompt.trim()) {
      beautifyPrompt(prompt.trim());
    }
  }, [prompt, beautifyPrompt]);

  return {
    // Input state
    prompt,
    setPrompt,

    // Beautification state
    isBeautifying,
    result,
    error,

    // Actions
    beautify: handleBeautify,
    stop: stopBeautifying,
    clear: clearResult,

    // Computed properties
    canBeautify: !isBeautifying && prompt.trim().length > 0,
    hasResult: !!result,
    hasError: !!error,
  };
};

export default usePromptBeautifier;
