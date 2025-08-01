import { describe, test, expect } from "bun:test";
import {
  chatHooksManager,
  chatProcessor,
  statusManager,
  subscriptionManager,
  ChatService,
  chatService,
} from "../index";
import type {
  ChatSubscription,
  ChatStatus,
  ChatSubscribeEvent,
  ChatUnsubscribeEvent,
  ChatUnsubscribeAllEvent,
  ChatSendEvent,
  ChatCancelEvent,
  ChatChunkEvent,
  ChatCompleteEvent,
  ChatErrorEvent,
  ChatStatusEvent,
  ChatEvent,
  ChatHooks,
  ChatAgentCallbacks,
  ChatAgentHooks,
} from "../index";

describe("Chat Service Index", () => {
  describe("Exported Services", () => {
    test("should export chatHooksManager", () => {
      expect(chatHooksManager).toBeDefined();
      expect(typeof chatHooksManager.registerHooks).toBe("function");
      expect(typeof chatHooksManager.onChatStart).toBe("function");
      expect(typeof chatHooksManager.onChatComplete).toBe("function");
      expect(typeof chatHooksManager.onChatError).toBe("function");
      expect(typeof chatHooksManager.onChatCancel).toBe("function");
      expect(typeof chatHooksManager.onStatusUpdate).toBe("function");
      expect(typeof chatHooksManager.onMessageUpdate).toBe("function");
    });

    test("should export chatProcessor", () => {
      expect(chatProcessor).toBeDefined();
      expect(typeof chatProcessor.setTools).toBe("function");
      expect(typeof chatProcessor.handleChatSend).toBe("function");
      expect(typeof chatProcessor.handleChatCancel).toBe("function");
      expect(typeof chatProcessor.getActiveChats).toBe("function");
      expect(typeof chatProcessor.isProcessing).toBe("function");
      expect(typeof chatProcessor.destroy).toBe("function");
      expect(typeof chatProcessor.clear).toBe("function");
    });

    test("should export statusManager", () => {
      expect(statusManager).toBeDefined();
      expect(typeof statusManager.updateChatStatus).toBe("function");
      expect(typeof statusManager.getChatStatus).toBe("function");
      expect(typeof statusManager.getActiveChats).toBe("function");
      expect(typeof statusManager.getAllChatStatuses).toBe("function");
      expect(typeof statusManager.isChatInProgress).toBe("function");
      expect(typeof statusManager.deleteChatStatus).toBe("function");
      expect(typeof statusManager.getStatusCounts).toBe("function");
      expect(typeof statusManager.clear).toBe("function");
      expect(typeof statusManager.destroy).toBe("function");
    });

    test("should export subscriptionManager", () => {
      expect(subscriptionManager).toBeDefined();
      expect(typeof subscriptionManager.subscribeToChat).toBe("function");
      expect(typeof subscriptionManager.unsubscribeFromChat).toBe("function");
      expect(typeof subscriptionManager.unsubscribeFromAllChats).toBe("function");
      expect(typeof subscriptionManager.cleanupClientSubscriptions).toBe("function");
      expect(typeof subscriptionManager.sendToClient).toBe("function");
      expect(typeof subscriptionManager.broadcastToChat).toBe("function");
      expect(typeof subscriptionManager.getSubscriberCount).toBe("function");
      expect(typeof subscriptionManager.getClientSubscriptions).toBe("function");
      expect(typeof subscriptionManager.getAllSubscribedChats).toBe("function");
      expect(typeof subscriptionManager.hasSubscribers).toBe("function");
      expect(typeof subscriptionManager.clear).toBe("function");
    });

    test("should export ChatService and chatService", () => {
      expect(ChatService).toBeDefined();
      expect(chatService).toBeDefined();
      expect(typeof ChatService).toBe("function"); // Constructor
      expect(typeof chatService).toBe("object"); // Instance
    });
  });

  describe("Exported Types", () => {
    test("should export ChatSubscription type", () => {
      // Type test - ensure the type is importable and has expected structure
      const subscription: ChatSubscription = {
        ws: {} as any,
        subscriptionId: "test-id",
        subscribedAt: Date.now(),
      };
      expect(subscription.subscriptionId).toBe("test-id");
    });

    test("should export ChatStatus type", () => {
      const status: ChatStatus = {
        chatId: 123,
        status: "idle",
      };
      expect(status.chatId).toBe(123);
      expect(status.status).toBe("idle");

      const completeStatus: ChatStatus = {
        chatId: 456,
        status: "completed",
        startedAt: Date.now() - 1000,
        completedAt: Date.now(),
        mode: "ask",
        model: "gpt-4",
      };
      expect(completeStatus.mode).toBe("ask");
    });

    test("should export event types", () => {
      const subscribeEvent: ChatSubscribeEvent = {
        event: "chat:subscribe",
        data: { chatId: 123 },
      };
      expect(subscribeEvent.event).toBe("chat:subscribe");

      const unsubscribeEvent: ChatUnsubscribeEvent = {
        event: "chat:unsubscribe",
        data: { chatId: 123 },
      };
      expect(unsubscribeEvent.event).toBe("chat:unsubscribe");

      const unsubscribeAllEvent: ChatUnsubscribeAllEvent = {
        event: "chat:unsubscribe-all",
        data: {},
      };
      expect(unsubscribeAllEvent.event).toBe("chat:unsubscribe-all");

      const sendEvent: ChatSendEvent = {
        event: "chat:send",
        data: {
          chatId: 123,
          model: "gpt-4",
          messages: [],
          mode: "ask",
        },
      };
      expect(sendEvent.event).toBe("chat:send");

      const cancelEvent: ChatCancelEvent = {
        event: "chat:cancel",
        data: { chatId: 123 },
      };
      expect(cancelEvent.event).toBe("chat:cancel");
    });

    test("should export chat event response types", () => {
      const chunkEvent: ChatChunkEvent = {
        event: "chat:chunk",
        data: {
          chatId: 123,
          chunk: "Hello",
          type: "text",
        },
      };
      expect(chunkEvent.event).toBe("chat:chunk");

      const completeEvent: ChatCompleteEvent = {
        event: "chat:complete",
        data: {
          chatId: 123,
          usage: { tokens: 100 },
        },
      };
      expect(completeEvent.event).toBe("chat:complete");

      const errorEvent: ChatErrorEvent = {
        event: "chat:error",
        data: {
          chatId: 123,
          error: "Something went wrong",
          code: "ERROR_CODE",
        },
      };
      expect(errorEvent.event).toBe("chat:error");

      const statusEvent: ChatStatusEvent = {
        event: "chat:status",
        data: {
          chatId: 123,
          status: "in_progress",
        },
      };
      expect(statusEvent.event).toBe("chat:status");
    });

    test("should export union ChatEvent type", () => {
      const events: ChatEvent[] = [
        {
          event: "chat:chunk",
          data: { chatId: 123, chunk: "test", type: "text" },
        },
        {
          event: "chat:complete",
          data: { chatId: 123 },
        },
        {
          event: "chat:error",
          data: { chatId: 123, error: "test error" },
        },
        {
          event: "chat:status",
          data: { chatId: 123, status: "idle" },
        },
      ];

      expect(events).toHaveLength(4);
      expect(events[0].event).toBe("chat:chunk");
      expect(events[1].event).toBe("chat:complete");
      expect(events[2].event).toBe("chat:error");
      expect(events[3].event).toBe("chat:status");
    });

    test("should export hook interface types", () => {
      const hooks: ChatHooks = {
        onChatStart: async () => {},
        onChatComplete: async () => {},
        onChatError: async () => {},
        onChatCancel: async () => {},
        onStatusUpdate: async () => {},
        onMessageUpdate: async () => {},
      };

      expect(typeof hooks.onChatStart).toBe("function");
      expect(typeof hooks.onChatComplete).toBe("function");
      expect(typeof hooks.onChatError).toBe("function");
      expect(typeof hooks.onChatCancel).toBe("function");
      expect(typeof hooks.onStatusUpdate).toBe("function");
      expect(typeof hooks.onMessageUpdate).toBe("function");
    });

    test("should export callback interface types", () => {
      const callbacks: ChatAgentCallbacks = {
        onChunk: async () => {},
        onError: async () => {},
        onFinish: async () => {},
        onStepFinish: async () => {},
      };

      expect(typeof callbacks.onChunk).toBe("function");
      expect(typeof callbacks.onError).toBe("function");
      expect(typeof callbacks.onFinish).toBe("function");
      expect(typeof callbacks.onStepFinish).toBe("function");

      // Test optional nature of callbacks
      const partialCallbacks: ChatAgentCallbacks = {
        onChunk: async () => {},
      };
      expect(typeof partialCallbacks.onChunk).toBe("function");
      expect(partialCallbacks.onError).toBeUndefined();
    });

    test("should export ChatAgentHooks type", () => {
      const agentHooks: ChatAgentHooks = {
        onChunk: async () => {},
        onFinish: async () => {},
      };

      expect(typeof agentHooks.onChunk).toBe("function");
      expect(typeof agentHooks.onFinish).toBe("function");
    });
  });

  describe("Service Integration", () => {
    test("should have working service instances", () => {
      // Test that the exported instances are actually working
      expect(() => {
        chatHooksManager.registerHooks({});
        statusManager.updateChatStatus(1, { status: "idle" });
        subscriptionManager.getSubscriberCount(1);
        chatProcessor.getActiveChats();
      }).not.toThrow();
    });

    test("should maintain singleton instances", () => {
      // Import again to test singleton behavior
      const {
        chatHooksManager: hooksManager2,
        statusManager: statusManager2,
        subscriptionManager: subscriptionManager2,
        chatProcessor: chatProcessor2,
      } = require("../index");

      expect(chatHooksManager).toBe(hooksManager2);
      expect(statusManager).toBe(statusManager2);
      expect(subscriptionManager).toBe(subscriptionManager2);
      expect(chatProcessor).toBe(chatProcessor2);
    });
  });

  describe("Type Compatibility", () => {
    test("should allow proper type narrowing for ChatEvent", () => {
      const event: ChatEvent = {
        event: "chat:chunk",
        data: { chatId: 123, chunk: "test", type: "text" },
      };

      if (event.event === "chat:chunk") {
        // TypeScript should narrow the type here
        expect(event.data.chunk).toBe("test");
        expect(event.data.type).toBe("text");
      }

      if (event.event === "chat:error") {
        // This branch shouldn't execute but should compile
        expect(event.data.error).toBeDefined();
      }
    });

    test("should support all chat status values", () => {
      const statuses: ChatStatus["status"][] = ["idle", "in_progress", "completed", "error"];

      for (const status of statuses) {
        const chatStatus: ChatStatus = {
          chatId: 123,
          status,
        };
        expect(chatStatus.status).toBe(status);
      }
    });

    test("should support all chat modes", () => {
      const modes: ("ask" | "write")[] = ["ask", "write"];

      for (const mode of modes) {
        const chatStatus: ChatStatus = {
          chatId: 123,
          status: "idle",
          mode,
        };
        expect(chatStatus.mode).toBe(mode);
      }
    });

    test("should support all chunk types", () => {
      const chunkTypes: ("text" | "tool-call" | "tool-result")[] = [
        "text",
        "tool-call",
        "tool-result",
      ];

      for (const type of chunkTypes) {
        const chunkEvent: ChatChunkEvent = {
          event: "chat:chunk",
          data: {
            chatId: 123,
            chunk: "test",
            type,
          },
        };
        expect(chunkEvent.data.type).toBe(type);
      }
    });
  });

  describe("Module Structure", () => {
    test("should export all required members", () => {
      const chatModule = require("../index");

      const expectedExports = [
        "ChatService",
        "chatService",
        "chatHooksManager",
        "chatProcessor",
        "statusManager",
        "subscriptionManager",
      ];

      for (const exportName of expectedExports) {
        expect(chatModule[exportName]).toBeDefined();
      }
    });

    test("should not export internal implementation details", () => {
      const chatModule = require("../index");

      // These should not be exported directly
      expect(chatModule.ChatHooksManager).toBeUndefined();
      expect(chatModule.StatusManager).toBeUndefined();
      expect(chatModule.SubscriptionManager).toBeUndefined();
      expect(chatModule.ChatProcessor).toBeUndefined();
    });
  });
});
