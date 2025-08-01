import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { SubscriptionManager } from "../subscription-manager";
import type { ChatEvent, ChatSubscription } from "../types";

// Mock WebSocket for testing
class MockWebSocket {
  public isClosed = false;
  public sentMessages: string[] = [];

  send(data: string): void {
    if (this.isClosed) {
      throw new Error("WebSocket is closed");
    }
    this.sentMessages.push(data);
  }

  close(): void {
    this.isClosed = true;
  }

  clearSentMessages(): void {
    this.sentMessages = [];
  }
}

describe("SubscriptionManager", () => {
  let subscriptionManager: SubscriptionManager;
  let mockWs1: MockWebSocket;
  let mockWs2: MockWebSocket;
  let mockWs3: MockWebSocket;

  beforeEach(() => {
    subscriptionManager = new SubscriptionManager();
    mockWs1 = new MockWebSocket();
    mockWs2 = new MockWebSocket();
    mockWs3 = new MockWebSocket();
  });

  afterEach(() => {
    subscriptionManager.clear();
  });

  describe("subscribeToChat", () => {
    test("should subscribe a client to a chat successfully", () => {
      const chatId = 123;
      const subscriptionId = subscriptionManager.subscribeToChat(
        chatId,
        mockWs1 as any
      );

      expect(subscriptionId).toMatch(/^sub_\d+_[a-z0-9]+$/);
      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(1);
      expect(subscriptionManager.hasSubscribers(chatId)).toBe(true);
      expect(
        subscriptionManager.getClientSubscriptions(mockWs1 as any)
      ).toEqual([chatId]);
    });

    test("should handle multiple clients subscribing to the same chat", () => {
      const chatId = 123;

      const subId1 = subscriptionManager.subscribeToChat(
        chatId,
        mockWs1 as any
      );
      const subId2 = subscriptionManager.subscribeToChat(
        chatId,
        mockWs2 as any
      );
      const subId3 = subscriptionManager.subscribeToChat(
        chatId,
        mockWs3 as any
      );

      expect(subId1).not.toBe(subId2);
      expect(subId2).not.toBe(subId3);
      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(3);

      const allSubscribedChats = subscriptionManager.getAllSubscribedChats();
      expect(allSubscribedChats).toContain(chatId);
    });

    test("should handle one client subscribing to multiple chats", () => {
      const chatId1 = 123;
      const chatId2 = 456;
      const chatId3 = 789;

      subscriptionManager.subscribeToChat(chatId1, mockWs1 as any);
      subscriptionManager.subscribeToChat(chatId2, mockWs1 as any);
      subscriptionManager.subscribeToChat(chatId3, mockWs1 as any);

      expect(subscriptionManager.getSubscriberCount(chatId1)).toBe(1);
      expect(subscriptionManager.getSubscriberCount(chatId2)).toBe(1);
      expect(subscriptionManager.getSubscriberCount(chatId3)).toBe(1);

      const clientSubscriptions = subscriptionManager.getClientSubscriptions(
        mockWs1 as any
      );
      expect(clientSubscriptions).toHaveLength(3);
      expect(clientSubscriptions).toContain(chatId1);
      expect(clientSubscriptions).toContain(chatId2);
      expect(clientSubscriptions).toContain(chatId3);
    });

    test("should generate unique subscription IDs", () => {
      const chatId = 123;
      const subscriptionIds = new Set();

      for (let i = 0; i < 10; i++) {
        const mockWs = new MockWebSocket();
        const subId = subscriptionManager.subscribeToChat(
          chatId,
          mockWs as any
        );
        subscriptionIds.add(subId);
      }

      expect(subscriptionIds.size).toBe(10); // All should be unique
    });
  });

  describe("unsubscribeFromChat", () => {
    test("should unsubscribe a client from a chat successfully", () => {
      const chatId = 123;

      subscriptionManager.subscribeToChat(chatId, mockWs1 as any);
      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(1);

      const result = subscriptionManager.unsubscribeFromChat(
        chatId,
        mockWs1 as any
      );

      expect(result).toBe(true);
      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(0);
      expect(subscriptionManager.hasSubscribers(chatId)).toBe(false);
      expect(
        subscriptionManager.getClientSubscriptions(mockWs1 as any)
      ).toEqual([]);
    });

    test("should handle unsubscribing from non-existent subscription", () => {
      const chatId = 123;

      const result = subscriptionManager.unsubscribeFromChat(
        chatId,
        mockWs1 as any
      );

      expect(result).toBe(false);
      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(0);
    });

    test("should only remove the correct client when multiple clients are subscribed", () => {
      const chatId = 123;

      subscriptionManager.subscribeToChat(chatId, mockWs1 as any);
      subscriptionManager.subscribeToChat(chatId, mockWs2 as any);
      subscriptionManager.subscribeToChat(chatId, mockWs3 as any);

      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(3);

      const result = subscriptionManager.unsubscribeFromChat(
        chatId,
        mockWs2 as any
      );

      expect(result).toBe(true);
      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(2);
      expect(
        subscriptionManager.getClientSubscriptions(mockWs1 as any)
      ).toEqual([chatId]);
      expect(
        subscriptionManager.getClientSubscriptions(mockWs2 as any)
      ).toEqual([]);
      expect(
        subscriptionManager.getClientSubscriptions(mockWs3 as any)
      ).toEqual([chatId]);
    });

    test("should remove chat subscription list when no subscribers remain", () => {
      const chatId = 123;

      subscriptionManager.subscribeToChat(chatId, mockWs1 as any);
      subscriptionManager.unsubscribeFromChat(chatId, mockWs1 as any);

      expect(subscriptionManager.getAllSubscribedChats()).not.toContain(chatId);
    });
  });

  describe("unsubscribeFromAllChats", () => {
    test("should unsubscribe client from all chats", () => {
      const chatId1 = 123;
      const chatId2 = 456;
      const chatId3 = 789;

      subscriptionManager.subscribeToChat(chatId1, mockWs1 as any);
      subscriptionManager.subscribeToChat(chatId2, mockWs1 as any);
      subscriptionManager.subscribeToChat(chatId3, mockWs1 as any);

      expect(
        subscriptionManager.getClientSubscriptions(mockWs1 as any)
      ).toHaveLength(3);

      const count = subscriptionManager.unsubscribeFromAllChats(mockWs1 as any);

      expect(count).toBe(3);
      expect(
        subscriptionManager.getClientSubscriptions(mockWs1 as any)
      ).toEqual([]);
      expect(subscriptionManager.getSubscriberCount(chatId1)).toBe(0);
      expect(subscriptionManager.getSubscriberCount(chatId2)).toBe(0);
      expect(subscriptionManager.getSubscriberCount(chatId3)).toBe(0);
    });

    test("should return 0 when client has no active subscriptions", () => {
      const count = subscriptionManager.unsubscribeFromAllChats(mockWs1 as any);

      expect(count).toBe(0);
    });

    test("should not affect other clients' subscriptions", () => {
      const chatId = 123;

      subscriptionManager.subscribeToChat(chatId, mockWs1 as any);
      subscriptionManager.subscribeToChat(chatId, mockWs2 as any);

      const count = subscriptionManager.unsubscribeFromAllChats(mockWs1 as any);

      expect(count).toBe(1);
      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(1);
      expect(
        subscriptionManager.getClientSubscriptions(mockWs2 as any)
      ).toEqual([chatId]);
    });
  });

  describe("cleanupClientSubscriptions", () => {
    test("should clean up all subscriptions for a disconnected client", () => {
      const chatId1 = 123;
      const chatId2 = 456;

      subscriptionManager.subscribeToChat(chatId1, mockWs1 as any);
      subscriptionManager.subscribeToChat(chatId2, mockWs1 as any);
      subscriptionManager.subscribeToChat(chatId1, mockWs2 as any); // Other client on same chat

      expect(subscriptionManager.getSubscriberCount(chatId1)).toBe(2);
      expect(subscriptionManager.getSubscriberCount(chatId2)).toBe(1);

      subscriptionManager.cleanupClientSubscriptions(mockWs1 as any);

      expect(subscriptionManager.getSubscriberCount(chatId1)).toBe(1);
      expect(subscriptionManager.getSubscriberCount(chatId2)).toBe(0);
      expect(
        subscriptionManager.getClientSubscriptions(mockWs1 as any)
      ).toEqual([]);
      expect(
        subscriptionManager.getClientSubscriptions(mockWs2 as any)
      ).toEqual([chatId1]);
    });

    test("should handle cleanup for client with no subscriptions", () => {
      expect(() => {
        subscriptionManager.cleanupClientSubscriptions(mockWs1 as any);
      }).not.toThrow();
    });
  });

  describe("sendToClient", () => {
    test("should send event to client successfully", () => {
      const event: ChatEvent = {
        event: "chat:chunk",
        data: {
          chatId: 123,
          chunk: "Hello",
          type: "text",
        },
      };

      const result = subscriptionManager.sendToClient(mockWs1 as any, event);

      expect(result).toBe(true);
      expect(mockWs1.sentMessages).toHaveLength(1);
      expect(JSON.parse(mockWs1.sentMessages[0])).toEqual(event);
    });

    test("should handle WebSocket send errors and cleanup client", () => {
      const chatId = 123;
      subscriptionManager.subscribeToChat(chatId, mockWs1 as any);

      // Simulate WebSocket error
      mockWs1.close();

      const event: ChatEvent = {
        event: "chat:error",
        data: {
          chatId: 123,
          error: "Test error",
        },
      };

      const result = subscriptionManager.sendToClient(mockWs1 as any, event);

      expect(result).toBe(false);
      expect(
        subscriptionManager.getClientSubscriptions(mockWs1 as any)
      ).toEqual([]);
    });
  });

  describe("broadcastToChat", () => {
    test("should broadcast event to all subscribers of a chat", () => {
      const chatId = 123;
      const event: ChatEvent = {
        event: "chat:status",
        data: {
          chatId: 123,
          status: "in_progress",
        },
      };

      subscriptionManager.subscribeToChat(chatId, mockWs1 as any);
      subscriptionManager.subscribeToChat(chatId, mockWs2 as any);
      subscriptionManager.subscribeToChat(chatId, mockWs3 as any);

      const successCount = subscriptionManager.broadcastToChat(chatId, event);

      expect(successCount).toBe(3);
      expect(mockWs1.sentMessages).toHaveLength(1);
      expect(mockWs2.sentMessages).toHaveLength(1);
      expect(mockWs3.sentMessages).toHaveLength(1);

      const sentEvent = JSON.parse(mockWs1.sentMessages[0]);
      expect(sentEvent).toEqual(event);
    });

    test("should return 0 when no subscribers exist", () => {
      const chatId = 123;
      const event: ChatEvent = {
        event: "chat:complete",
        data: {
          chatId: 123,
        },
      };

      const successCount = subscriptionManager.broadcastToChat(chatId, event);

      expect(successCount).toBe(0);
    });

    test("should handle partial broadcast failures and clean up failed clients", () => {
      const chatId = 123;
      const event: ChatEvent = {
        event: "chat:chunk",
        data: {
          chatId: 123,
          chunk: "test",
          type: "text",
        },
      };

      subscriptionManager.subscribeToChat(chatId, mockWs1 as any);
      subscriptionManager.subscribeToChat(chatId, mockWs2 as any);
      subscriptionManager.subscribeToChat(chatId, mockWs3 as any);

      // Simulate one WebSocket failing
      mockWs2.close();

      const successCount = subscriptionManager.broadcastToChat(chatId, event);

      expect(successCount).toBe(2);
      expect(mockWs1.sentMessages).toHaveLength(1);
      expect(mockWs2.sentMessages).toHaveLength(0); // Failed client
      expect(mockWs3.sentMessages).toHaveLength(1);

      // Failed client should be cleaned up
      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(2);
      expect(
        subscriptionManager.getClientSubscriptions(mockWs2 as any)
      ).toEqual([]);
    });

    test("should broadcast different event types correctly", () => {
      const chatId = 123;
      subscriptionManager.subscribeToChat(chatId, mockWs1 as any);

      const events: ChatEvent[] = [
        {
          event: "chat:chunk",
          data: { chatId: 123, chunk: "Hello", type: "text" },
        },
        {
          event: "chat:complete",
          data: { chatId: 123, usage: { tokens: 100 } },
        },
        {
          event: "chat:error",
          data: {
            chatId: 123,
            error: "Something went wrong",
            code: "ERROR_CODE",
          },
        },
        {
          event: "chat:status",
          data: { chatId: 123, status: "completed", completedAt: Date.now() },
        },
      ];

      for (const event of events) {
        mockWs1.clearSentMessages();
        const result = subscriptionManager.broadcastToChat(chatId, event);

        expect(result).toBe(1);
        expect(mockWs1.sentMessages).toHaveLength(1);
        expect(JSON.parse(mockWs1.sentMessages[0])).toEqual(event);
      }
    });
  });

  describe("Utility Methods", () => {
    test("getSubscriberCount should return correct count", () => {
      const chatId = 123;

      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(0);

      subscriptionManager.subscribeToChat(chatId, mockWs1 as any);
      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(1);

      subscriptionManager.subscribeToChat(chatId, mockWs2 as any);
      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(2);

      subscriptionManager.unsubscribeFromChat(chatId, mockWs1 as any);
      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(1);
    });

    test("hasSubscribers should return correct boolean", () => {
      const chatId = 123;

      expect(subscriptionManager.hasSubscribers(chatId)).toBe(false);

      subscriptionManager.subscribeToChat(chatId, mockWs1 as any);
      expect(subscriptionManager.hasSubscribers(chatId)).toBe(true);

      subscriptionManager.unsubscribeFromChat(chatId, mockWs1 as any);
      expect(subscriptionManager.hasSubscribers(chatId)).toBe(false);
    });

    test("getAllSubscribedChats should return all chat IDs with subscriptions", () => {
      expect(subscriptionManager.getAllSubscribedChats()).toEqual([]);

      subscriptionManager.subscribeToChat(123, mockWs1 as any);
      subscriptionManager.subscribeToChat(456, mockWs1 as any);
      subscriptionManager.subscribeToChat(789, mockWs2 as any);

      const allChats = subscriptionManager.getAllSubscribedChats();
      expect(allChats).toHaveLength(3);
      expect(allChats).toContain(123);
      expect(allChats).toContain(456);
      expect(allChats).toContain(789);
    });

    test("getClientSubscriptions should return correct chat IDs for client", () => {
      expect(
        subscriptionManager.getClientSubscriptions(mockWs1 as any)
      ).toEqual([]);

      subscriptionManager.subscribeToChat(123, mockWs1 as any);
      subscriptionManager.subscribeToChat(456, mockWs1 as any);

      const clientSubs = subscriptionManager.getClientSubscriptions(
        mockWs1 as any
      );
      expect(clientSubs).toHaveLength(2);
      expect(clientSubs).toContain(123);
      expect(clientSubs).toContain(456);
    });
  });

  describe("Memory Management", () => {
    test("clear should remove all subscriptions", () => {
      subscriptionManager.subscribeToChat(123, mockWs1 as any);
      subscriptionManager.subscribeToChat(456, mockWs2 as any);
      subscriptionManager.subscribeToChat(789, mockWs3 as any);

      expect(subscriptionManager.getAllSubscribedChats()).toHaveLength(3);

      subscriptionManager.clear();

      expect(subscriptionManager.getAllSubscribedChats()).toEqual([]);
      expect(subscriptionManager.getSubscriberCount(123)).toBe(0);
      expect(
        subscriptionManager.getClientSubscriptions(mockWs1 as any)
      ).toEqual([]);
    });
  });

  describe("Edge Cases", () => {
    test("should handle subscribing the same client to the same chat multiple times", () => {
      const chatId = 123;

      const subId1 = subscriptionManager.subscribeToChat(
        chatId,
        mockWs1 as any
      );
      const subId2 = subscriptionManager.subscribeToChat(
        chatId,
        mockWs1 as any
      );

      expect(subId1).not.toBe(subId2);
      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(2);

      // The client subscriptions use a Set, so only one entry per chat ID
      const clientSubs = subscriptionManager.getClientSubscriptions(
        mockWs1 as any
      );
      expect(clientSubs).toHaveLength(1);
      expect(clientSubs[0]).toBe(chatId);
    });

    test("should handle very large numbers of subscriptions", () => {
      const chatId = 123;
      const numClients = 1000;
      const mockClients: MockWebSocket[] = [];

      for (let i = 0; i < numClients; i++) {
        const mockWs = new MockWebSocket();
        mockClients.push(mockWs);
        subscriptionManager.subscribeToChat(chatId, mockWs as any);
      }

      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(numClients);

      const event: ChatEvent = {
        event: "chat:chunk",
        data: { chatId: 123, chunk: "test", type: "text" },
      };

      const successCount = subscriptionManager.broadcastToChat(chatId, event);
      expect(successCount).toBe(numClients);

      // Clean up all clients
      for (const mockWs of mockClients) {
        subscriptionManager.cleanupClientSubscriptions(mockWs as any);
      }

      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(0);
    });

    test("should handle concurrent subscribe/unsubscribe operations", () => {
      const chatId = 123;

      // Simulate rapid subscribe/unsubscribe
      subscriptionManager.subscribeToChat(chatId, mockWs1 as any);
      subscriptionManager.subscribeToChat(chatId, mockWs2 as any);
      subscriptionManager.unsubscribeFromChat(chatId, mockWs1 as any);
      subscriptionManager.subscribeToChat(chatId, mockWs3 as any);
      subscriptionManager.unsubscribeFromChat(chatId, mockWs2 as any);

      expect(subscriptionManager.getSubscriberCount(chatId)).toBe(1);
      expect(
        subscriptionManager.getClientSubscriptions(mockWs3 as any)
      ).toEqual([chatId]);
    });
  });
});
