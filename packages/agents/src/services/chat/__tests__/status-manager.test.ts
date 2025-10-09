import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { StatusManager } from "../status-manager";
import type { ChatStatus } from "../types";

describe("StatusManager", () => {
  let statusManager: StatusManager;

  beforeEach(() => {
    statusManager = new StatusManager();
  });

  afterEach(() => {
    statusManager.destroy();
  });

  describe("updateChatStatus", () => {
    test("should create new status for non-existent chat", () => {
      const chatId = 123;
      const statusUpdate: Partial<ChatStatus> = {
        status: "in_progress",
        startedAt: Date.now(),
        mode: "ask",
        model: "gpt-4",
      };

      const result = statusManager.updateChatStatus(chatId, statusUpdate);

      expect(result.chatId).toBe(chatId);
      expect(result.status).toBe("in_progress");
      expect(result.mode).toBe("ask");
      expect(result.model).toBe("gpt-4");
      expect(result.startedAt).toBe(statusUpdate.startedAt);
    });

    test("should update existing chat status", () => {
      const chatId = 123;

      // Create initial status
      statusManager.updateChatStatus(chatId, {
        status: "idle",
        mode: "ask",
        model: "gpt-4",
      });

      // Update status
      const updateTime = Date.now();
      const result = statusManager.updateChatStatus(chatId, {
        status: "in_progress",
        startedAt: updateTime,
      });

      expect(result.chatId).toBe(chatId);
      expect(result.status).toBe("in_progress");
      expect(result.mode).toBe("ask"); // Should preserve existing values
      expect(result.model).toBe("gpt-4");
      expect(result.startedAt).toBe(updateTime);
    });

    test("should handle partial updates", () => {
      const chatId = 123;

      // Create initial status
      const initial = statusManager.updateChatStatus(chatId, {
        status: "in_progress",
        startedAt: Date.now(),
        mode: "write",
        model: "gpt-4",
      });

      // Partial update
      const completedAt = Date.now() + 1000;
      const result = statusManager.updateChatStatus(chatId, {
        status: "completed",
        completedAt,
      });

      expect(result.chatId).toBe(chatId);
      expect(result.status).toBe("completed");
      expect(result.startedAt).toBe(initial.startedAt);
      expect(result.completedAt).toBe(completedAt);
      expect(result.mode).toBe("write");
      expect(result.model).toBe("gpt-4");
    });

    test("should handle error status updates", () => {
      const chatId = 123;
      const errorMessage = "Something went wrong";

      const result = statusManager.updateChatStatus(chatId, {
        status: "error",
        error: errorMessage,
        completedAt: Date.now(),
      });

      expect(result.status).toBe("error");
      expect(result.error).toBe(errorMessage);
      expect(result.completedAt).toBeDefined();
    });

    test("should return the updated status object", () => {
      const chatId = 123;
      const statusUpdate: Partial<ChatStatus> = {
        status: "completed",
        completedAt: Date.now(),
      };

      const result = statusManager.updateChatStatus(chatId, statusUpdate);

      expect(result).toEqual(expect.objectContaining({
        chatId,
        ...statusUpdate,
      }));
    });
  });

  describe("getChatStatus", () => {
    test("should return undefined for non-existent chat", () => {
      const result = statusManager.getChatStatus(999);
      expect(result).toBeUndefined();
    });

    test("should return correct status for existing chat", () => {
      const chatId = 123;
      const statusData: Partial<ChatStatus> = {
        status: "in_progress",
        startedAt: Date.now(),
        mode: "ask",
        model: "gpt-4",
      };

      statusManager.updateChatStatus(chatId, statusData);
      const result = statusManager.getChatStatus(chatId);

      expect(result).toEqual(expect.objectContaining({
        chatId,
        ...statusData,
      }));
    });

    test("should return most recent status after multiple updates", () => {
      const chatId = 123;

      statusManager.updateChatStatus(chatId, { status: "idle" });
      statusManager.updateChatStatus(chatId, { status: "in_progress", startedAt: Date.now() });
      const finalUpdate = statusManager.updateChatStatus(chatId, {
        status: "completed",
        completedAt: Date.now()
      });

      const result = statusManager.getChatStatus(chatId);
      expect(result).toEqual(finalUpdate);
    });
  });

  describe("getActiveChats", () => {
    test("should return empty array when no chats are active", () => {
      const result = statusManager.getActiveChats();
      expect(result).toEqual([]);
    });

    test("should return only chats with in_progress status", () => {
      statusManager.updateChatStatus(123, { status: "in_progress" });
      statusManager.updateChatStatus(456, { status: "completed" });
      statusManager.updateChatStatus(789, { status: "in_progress" });
      statusManager.updateChatStatus(101, { status: "error" });
      statusManager.updateChatStatus(202, { status: "idle" });

      const result = statusManager.getActiveChats();

      expect(result).toHaveLength(2);
      expect(result).toContain(123);
      expect(result).toContain(789);
      expect(result).not.toContain(456);
      expect(result).not.toContain(101);
      expect(result).not.toContain(202);
    });

    test("should update active chats when status changes", () => {
      statusManager.updateChatStatus(123, { status: "in_progress" });
      expect(statusManager.getActiveChats()).toContain(123);

      statusManager.updateChatStatus(123, { status: "completed" });
      expect(statusManager.getActiveChats()).not.toContain(123);
    });
  });

  describe("getAllChatStatuses", () => {
    test("should return empty map when no chats exist", () => {
      const result = statusManager.getAllChatStatuses();
      expect(result.size).toBe(0);
    });

    test("should return all chat statuses", () => {
      statusManager.updateChatStatus(123, { status: "in_progress", mode: "ask" });
      statusManager.updateChatStatus(456, { status: "completed", mode: "write" });
      statusManager.updateChatStatus(789, { status: "error", error: "test error" });

      const result = statusManager.getAllChatStatuses();

      expect(result.size).toBe(3);
      expect(result.has(123)).toBe(true);
      expect(result.has(456)).toBe(true);
      expect(result.has(789)).toBe(true);

      expect(result.get(123)?.status).toBe("in_progress");
      expect(result.get(456)?.status).toBe("completed");
      expect(result.get(789)?.status).toBe("error");
    });

    test("should return a copy of the internal map", () => {
      statusManager.updateChatStatus(123, { status: "idle" });

      const result1 = statusManager.getAllChatStatuses();
      const result2 = statusManager.getAllChatStatuses();

      expect(result1).not.toBe(result2); // Different object instances
      expect(result1.get(123)).toEqual(result2.get(123)); // But same content
    });
  });

  describe("isChatInProgress", () => {
    test("should return false for non-existent chat", () => {
      const result = statusManager.isChatInProgress(999);
      expect(result).toBe(false);
    });

    test("should return true for chat with in_progress status", () => {
      statusManager.updateChatStatus(123, { status: "in_progress" });
      const result = statusManager.isChatInProgress(123);
      expect(result).toBe(true);
    });

    test("should return false for chat with other statuses", () => {
      statusManager.updateChatStatus(123, { status: "idle" });
      expect(statusManager.isChatInProgress(123)).toBe(false);

      statusManager.updateChatStatus(123, { status: "completed" });
      expect(statusManager.isChatInProgress(123)).toBe(false);

      statusManager.updateChatStatus(123, { status: "error" });
      expect(statusManager.isChatInProgress(123)).toBe(false);
    });
  });

  describe("deleteChatStatus", () => {
    test("should delete existing chat status and return true", () => {
      statusManager.updateChatStatus(123, { status: "completed" });
      expect(statusManager.getChatStatus(123)).toBeDefined();

      const result = statusManager.deleteChatStatus(123);

      expect(result).toBe(true);
      expect(statusManager.getChatStatus(123)).toBeUndefined();
    });

    test("should return false for non-existent chat", () => {
      const result = statusManager.deleteChatStatus(999);
      expect(result).toBe(false);
    });

    test("should remove chat from active chats list", () => {
      statusManager.updateChatStatus(123, { status: "in_progress" });
      expect(statusManager.getActiveChats()).toContain(123);

      statusManager.deleteChatStatus(123);
      expect(statusManager.getActiveChats()).not.toContain(123);
    });
  });

  describe("getStatusCounts", () => {
    test("should return zero counts when no chats exist", () => {
      const result = statusManager.getStatusCounts();

      expect(result).toEqual({
        idle: 0,
        inProgress: 0,
        completed: 0,
        error: 0,
      });
    });

    test("should return correct counts for various statuses", () => {
      statusManager.updateChatStatus(101, { status: "idle" });
      statusManager.updateChatStatus(102, { status: "idle" });
      statusManager.updateChatStatus(201, { status: "in_progress" });
      statusManager.updateChatStatus(202, { status: "in_progress" });
      statusManager.updateChatStatus(203, { status: "in_progress" });
      statusManager.updateChatStatus(301, { status: "completed" });
      statusManager.updateChatStatus(401, { status: "error" });

      const result = statusManager.getStatusCounts();

      expect(result).toEqual({
        idle: 2,
        inProgress: 3,
        completed: 1,
        error: 1,
      });
    });

    test("should update counts when statuses change", () => {
      statusManager.updateChatStatus(123, { status: "in_progress" });

      let counts = statusManager.getStatusCounts();
      expect(counts.inProgress).toBe(1);
      expect(counts.completed).toBe(0);

      statusManager.updateChatStatus(123, { status: "completed" });

      counts = statusManager.getStatusCounts();
      expect(counts.inProgress).toBe(0);
      expect(counts.completed).toBe(1);
    });
  });

  describe("clear", () => {
    test("should remove all chat statuses", () => {
      statusManager.updateChatStatus(123, { status: "in_progress" });
      statusManager.updateChatStatus(456, { status: "completed" });
      statusManager.updateChatStatus(789, { status: "error" });

      expect(statusManager.getAllChatStatuses().size).toBe(3);

      statusManager.clear();

      expect(statusManager.getAllChatStatuses().size).toBe(0);
      expect(statusManager.getActiveChats()).toEqual([]);
      expect(statusManager.getStatusCounts()).toEqual({
        idle: 0,
        inProgress: 0,
        completed: 0,
        error: 0,
      });
    });
  });

  describe("destroy", () => {
    test("should clear all statuses and cleanup interval", () => {
      statusManager.updateChatStatus(123, { status: "in_progress" });
      expect(statusManager.getAllChatStatuses().size).toBe(1);

      statusManager.destroy();

      expect(statusManager.getAllChatStatuses().size).toBe(0);
    });

    test("should be safe to call multiple times", () => {
      statusManager.updateChatStatus(123, { status: "idle" });

      expect(() => {
        statusManager.destroy();
        statusManager.destroy();
        statusManager.destroy();
      }).not.toThrow();
    });
  });

  describe("Status Cleanup", () => {
    test("should not cleanup in_progress chats", () => {
      const now = Date.now();
      const oldTime = now - 3 * 60 * 60 * 1000; // 3 hours ago

      statusManager.updateChatStatus(123, {
        status: "in_progress",
        startedAt: oldTime
      });

      // Force cleanup by calling private method through any
      (statusManager as any).cleanupStaleStatuses();

      expect(statusManager.getChatStatus(123)).toBeDefined();
    });

    test("should handle chats with no activity timestamps", () => {
      statusManager.updateChatStatus(123, { status: "idle" });

      // Force cleanup
      (statusManager as any).cleanupStaleStatuses();

      // Should still exist since no timestamp means lastActivity is 0
      // and cleanup logic should handle this gracefully
      expect(() => {
        (statusManager as any).cleanupStaleStatuses();
      }).not.toThrow();
    });
  });

  describe("Complex Status Updates", () => {
    test("should handle rapid status changes", () => {
      const chatId = 123;
      const startTime = Date.now();

      // Simulate rapid status changes
      statusManager.updateChatStatus(chatId, { status: "idle" });
      statusManager.updateChatStatus(chatId, { status: "in_progress", startedAt: startTime });
      statusManager.updateChatStatus(chatId, { status: "completed", completedAt: startTime + 1000 });

      const finalStatus = statusManager.getChatStatus(chatId);
      expect(finalStatus?.status).toBe("completed");
      expect(finalStatus?.startedAt).toBe(startTime);
      expect(finalStatus?.completedAt).toBe(startTime + 1000);
    });

    test("should handle complex status objects", () => {
      const chatId = 123;
      const complexStatus: Partial<ChatStatus> = {
        status: "error",
        startedAt: Date.now() - 5000,
        completedAt: Date.now(),
        error: "Network timeout after 30 seconds",
        mode: "write",
        model: "gpt-4-turbo-preview",
      };

      const result = statusManager.updateChatStatus(chatId, complexStatus);

      expect(result).toEqual(expect.objectContaining({
        chatId,
        ...complexStatus,
      }));

      const retrieved = statusManager.getChatStatus(chatId);
      expect(retrieved).toEqual(result);
    });

    test("should preserve undefined values when updating", () => {
      const chatId = 123;

      // Initial status with all fields
      statusManager.updateChatStatus(chatId, {
        status: "in_progress",
        startedAt: Date.now(),
        mode: "ask",
        model: "gpt-4",
      });

      // Update with partial data (some fields undefined)
      const result = statusManager.updateChatStatus(chatId, {
        status: "completed",
        completedAt: Date.now(),
        // mode and model not provided
      });

      expect(result.mode).toBe("ask"); // Should preserve original
      expect(result.model).toBe("gpt-4"); // Should preserve original
      expect(result.status).toBe("completed"); // Should be updated
    });
  });

  describe("Memory and Performance", () => {
    test("should handle large numbers of chat statuses", () => {
      const numChats = 1000;
      const startTime = Date.now();

      // Create many chat statuses
      for (let i = 0; i < numChats; i++) {
        statusManager.updateChatStatus(i, {
          status: i % 4 === 0 ? "in_progress" :
                 i % 4 === 1 ? "completed" :
                 i % 4 === 2 ? "error" : "idle",
          startedAt: startTime + i,
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(statusManager.getAllChatStatuses().size).toBe(numChats);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second

      const counts = statusManager.getStatusCounts();
      expect(counts.idle + counts.inProgress + counts.completed + counts.error).toBe(numChats);
    });

    test("should handle concurrent operations", () => {
      const chatId = 123;

      // Simulate concurrent updates
      const promises = Array.from({ length: 100 }, (_, i) =>
        Promise.resolve(statusManager.updateChatStatus(chatId, {
          status: i % 2 === 0 ? "in_progress" : "completed",
          startedAt: Date.now() + i,
        }))
      );

      expect(() => Promise.all(promises)).not.toThrow();

      // Final status should be one of the expected values
      const finalStatus = statusManager.getChatStatus(chatId);
      expect(["in_progress", "completed"]).toContain(finalStatus?.status);
    });
  });
});
