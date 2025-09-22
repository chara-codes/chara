"use client";

import type { UIMessage } from "@ai-sdk/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface BatchedMessageUpdate {
  messages: UIMessage[];
  timestamp: number;
  type: "replace" | "append" | "update";
  messageId?: string;
}

interface UseBatchedMessagesOptions {
  batchInterval?: number; // Default: 500ms
  onMessagesUpdate: (messages: UIMessage[]) => void;
  initialMessages?: UIMessage[];
}

export const useBatchedMessages = ({
  batchInterval = 500,
  onMessagesUpdate,
  initialMessages = [],
}: UseBatchedMessagesOptions): {
  messages: UIMessage[];
  replaceMessages: (messages: UIMessage[]) => void;
  appendMessages: (messages: UIMessage[]) => void;
  updateMessage: (messageId: string, message: UIMessage) => void;
  immediateUpdate: (messages: UIMessage[]) => void;
  flushUpdates: () => void;
  isPending: boolean;
} => {
  const [currentMessages, setCurrentMessages] =
    useState<UIMessage[]>(initialMessages);
  const batchQueueRef = useRef<BatchedMessageUpdate[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  // Process batched updates
  const processBatch = useCallback(() => {
    if (isProcessingRef.current || batchQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;

    try {
      // Get all pending updates
      const updates = [...batchQueueRef.current];
      batchQueueRef.current = [];

      // Sort by timestamp to ensure correct order
      updates.sort((a, b) => a.timestamp - b.timestamp);

      // Apply all updates sequentially
      let finalMessages = currentMessages;

      for (const update of updates) {
        switch (update.type) {
          case "replace": {
            finalMessages = update.messages;
            break;
          }
          case "append": {
            // Avoid duplicates by checking message IDs
            const newMessages = update.messages.filter(
              (newMsg) =>
                !finalMessages.some((existing) => existing.id === newMsg.id)
            );
            finalMessages = [...finalMessages, ...newMessages];
            break;
          }
          case "update": {
            if (update.messageId) {
              finalMessages = finalMessages.map((msg) =>
                msg.id === update.messageId ? update.messages[0] : msg
              );
            }
            break;
          }
        }
      }

      // Update local state
      setCurrentMessages(finalMessages);

      // Notify parent component
      onMessagesUpdate(finalMessages);
    } catch (error) {
      console.error("Error processing batched message updates:", error);
    } finally {
      isProcessingRef.current = false;
      timeoutRef.current = null;
    }
  }, [currentMessages, onMessagesUpdate]);

  // Schedule batch processing
  const scheduleBatch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(processBatch, batchInterval);
  }, [processBatch, batchInterval]);

  // Add update to batch queue
  const queueUpdate = useCallback(
    (update: Omit<BatchedMessageUpdate, "timestamp">) => {
      batchQueueRef.current.push({
        ...update,
        timestamp: Date.now(),
      });

      scheduleBatch();
    },
    [scheduleBatch]
  );

  // Public API methods
  const replaceMessages = useCallback(
    (messages: UIMessage[]) => {
      queueUpdate({
        messages,
        type: "replace",
      });
    },
    [queueUpdate]
  );

  const appendMessages = useCallback(
    (messages: UIMessage[]) => {
      queueUpdate({
        messages,
        type: "append",
      });
    },
    [queueUpdate]
  );

  const updateMessage = useCallback(
    (messageId: string, message: UIMessage) => {
      queueUpdate({
        messages: [message],
        type: "update",
        messageId,
      });
    },
    [queueUpdate]
  );

  // Immediate update (bypasses batching for critical updates)
  const immediateUpdate = useCallback(
    (messages: UIMessage[]) => {
      // Cancel any pending batch
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Clear queue
      batchQueueRef.current = [];

      // Update immediately
      setCurrentMessages(messages);
      onMessagesUpdate(messages);
    },
    [onMessagesUpdate]
  );

  // Force flush any pending updates
  const flushUpdates = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      processBatch();
    }
  }, [processBatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Update current messages when initial messages change (external updates)
  useEffect(() => {
    if (
      initialMessages.length !== currentMessages.length ||
      initialMessages.some((msg, i) => msg.id !== currentMessages[i]?.id)
    ) {
      setCurrentMessages(initialMessages);
    }
  }, [initialMessages, currentMessages]);

  return {
    messages: currentMessages,
    replaceMessages,
    appendMessages,
    updateMessage,
    immediateUpdate,
    flushUpdates,
    isPending: batchQueueRef.current.length > 0,
  };
};
