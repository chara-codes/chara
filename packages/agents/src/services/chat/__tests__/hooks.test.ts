import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { ChatHooksManager } from "../hooks";
import type { ChatHooks, ChatSendEvent, ChatStatus } from "../types";

describe("ChatHooksManager", () => {
  let hooksManager: ChatHooksManager;

  beforeEach(() => {
    hooksManager = new ChatHooksManager();
  });

  afterEach(() => {
    // Clear any registered hooks
    hooksManager = new ChatHooksManager();
  });

  describe("Hook Registration", () => {
    test("should register hooks successfully", () => {
      const hooks: Partial<ChatHooks> = {
        onChatStart: mock(async () => {}),
        onChatComplete: mock(async () => {}),
      };

      hooksManager.registerHooks(hooks);

      // We can't directly access private hooks, but we can test by calling the methods
      expect(() => hooksManager.onChatStart(1, {} as ChatSendEvent["data"])).not.toThrow();
      expect(() => hooksManager.onChatComplete(1, "response")).not.toThrow();
    });

    test("should merge hooks when registered multiple times", () => {
      const hooks1: Partial<ChatHooks> = {
        onChatStart: mock(async () => {}),
      };

      const hooks2: Partial<ChatHooks> = {
        onChatComplete: mock(async () => {}),
        onChatError: mock(async () => {}),
      };

      hooksManager.registerHooks(hooks1);
      hooksManager.registerHooks(hooks2);

      // Both sets of hooks should be available
      expect(() => hooksManager.onChatStart(1, {} as ChatSendEvent["data"])).not.toThrow();
      expect(() => hooksManager.onChatComplete(1, "response")).not.toThrow();
      expect(() => hooksManager.onChatError(1, "error")).not.toThrow();
    });

    test("should override hooks when same hook is registered twice", () => {
      const firstHook = mock(async () => {});
      const secondHook = mock(async () => {});

      hooksManager.registerHooks({ onChatStart: firstHook });
      hooksManager.registerHooks({ onChatStart: secondHook });

      // Only the second hook should be called
      hooksManager.onChatStart(1, {} as ChatSendEvent["data"]);

      expect(firstHook).not.toHaveBeenCalled();
      expect(secondHook).toHaveBeenCalledTimes(1);
    });
  });

  describe("onChatStart", () => {
    test("should call onChatStart hook with correct parameters", async () => {
      const mockHook = mock(async (chatId: number, data: ChatSendEvent["data"]) => {});
      hooksManager.registerHooks({ onChatStart: mockHook });

      const chatId = 123;
      const data: ChatSendEvent["data"] = {
        chatId: 123,
        model: "gpt-4",
        messages: [],
        mode: "ask",
      };

      await hooksManager.onChatStart(chatId, data);

      expect(mockHook).toHaveBeenCalledTimes(1);
      expect(mockHook).toHaveBeenCalledWith(chatId, data);
    });

    test("should handle errors in onChatStart hook gracefully", async () => {
      const mockHook = mock(async () => {
        throw new Error("Hook error");
      });
      hooksManager.registerHooks({ onChatStart: mockHook });

      // Should not throw even if hook throws
      await expect(hooksManager.onChatStart(1, {} as ChatSendEvent["data"])).resolves.toBeUndefined();

      expect(mockHook).toHaveBeenCalledTimes(1);
    });

    test("should do nothing when onChatStart hook is not registered", async () => {
      // Should not throw when no hook is registered
      await expect(hooksManager.onChatStart(1, {} as ChatSendEvent["data"])).resolves.toBeUndefined();
    });
  });

  describe("onChatComplete", () => {
    test("should call onChatComplete hook with correct parameters", async () => {
      const mockHook = mock(async (chatId: number, response: string, usage?: unknown) => {});
      hooksManager.registerHooks({ onChatComplete: mockHook });

      const chatId = 123;
      const response = "Chat response";
      const usage = { tokens: 100 };

      await hooksManager.onChatComplete(chatId, response, usage);

      expect(mockHook).toHaveBeenCalledTimes(1);
      expect(mockHook).toHaveBeenCalledWith(chatId, response, usage);
    });

    test("should call onChatComplete hook without usage parameter", async () => {
      const mockHook = mock(async (chatId: number, response: string, usage?: unknown) => {});
      hooksManager.registerHooks({ onChatComplete: mockHook });

      await hooksManager.onChatComplete(123, "response");

      expect(mockHook).toHaveBeenCalledWith(123, "response", undefined);
    });

    test("should handle errors in onChatComplete hook gracefully", async () => {
      const mockHook = mock(async () => {
        throw new Error("Hook error");
      });
      hooksManager.registerHooks({ onChatComplete: mockHook });

      await expect(hooksManager.onChatComplete(1, "response")).resolves.toBeUndefined();
      expect(mockHook).toHaveBeenCalledTimes(1);
    });
  });

  describe("onChatError", () => {
    test("should call onChatError hook with correct parameters", async () => {
      const mockHook = mock(async (chatId: number, error: string) => {});
      hooksManager.registerHooks({ onChatError: mockHook });

      const chatId = 123;
      const error = "Something went wrong";

      await hooksManager.onChatError(chatId, error);

      expect(mockHook).toHaveBeenCalledTimes(1);
      expect(mockHook).toHaveBeenCalledWith(chatId, error);
    });

    test("should handle errors in onChatError hook gracefully", async () => {
      const mockHook = mock(async () => {
        throw new Error("Hook error");
      });
      hooksManager.registerHooks({ onChatError: mockHook });

      await expect(hooksManager.onChatError(1, "original error")).resolves.toBeUndefined();
      expect(mockHook).toHaveBeenCalledTimes(1);
    });
  });

  describe("onChatCancel", () => {
    test("should call onChatCancel hook with correct parameters", async () => {
      const mockHook = mock(async (chatId: number) => {});
      hooksManager.registerHooks({ onChatCancel: mockHook });

      const chatId = 123;

      await hooksManager.onChatCancel(chatId);

      expect(mockHook).toHaveBeenCalledTimes(1);
      expect(mockHook).toHaveBeenCalledWith(chatId);
    });

    test("should handle errors in onChatCancel hook gracefully", async () => {
      const mockHook = mock(async () => {
        throw new Error("Hook error");
      });
      hooksManager.registerHooks({ onChatCancel: mockHook });

      await expect(hooksManager.onChatCancel(1)).resolves.toBeUndefined();
      expect(mockHook).toHaveBeenCalledTimes(1);
    });
  });

  describe("onStatusUpdate", () => {
    test("should call onStatusUpdate hook with correct parameters", async () => {
      const mockHook = mock(async (status: ChatStatus) => {});
      hooksManager.registerHooks({ onStatusUpdate: mockHook });

      const status: ChatStatus = {
        chatId: 123,
        status: "in_progress",
        startedAt: Date.now(),
        mode: "ask",
        model: "gpt-4",
      };

      await hooksManager.onStatusUpdate(status);

      expect(mockHook).toHaveBeenCalledTimes(1);
      expect(mockHook).toHaveBeenCalledWith(status);
    });

    test("should handle errors in onStatusUpdate hook gracefully", async () => {
      const mockHook = mock(async () => {
        throw new Error("Hook error");
      });
      hooksManager.registerHooks({ onStatusUpdate: mockHook });

      const status: ChatStatus = { chatId: 1, status: "idle" };

      await expect(hooksManager.onStatusUpdate(status)).resolves.toBeUndefined();
      expect(mockHook).toHaveBeenCalledTimes(1);
    });
  });

  describe("onMessageUpdate", () => {
    test("should call onMessageUpdate hook with correct parameters", async () => {
      const mockHook = mock(async (messageId: number, commit?: string) => {});
      hooksManager.registerHooks({ onMessageUpdate: mockHook });

      const messageId = 456;
      const commit = "abc123";

      await hooksManager.onMessageUpdate(messageId, commit);

      expect(mockHook).toHaveBeenCalledTimes(1);
      expect(mockHook).toHaveBeenCalledWith(messageId, commit);
    });

    test("should call onMessageUpdate hook without commit parameter", async () => {
      const mockHook = mock(async (messageId: number, commit?: string) => {});
      hooksManager.registerHooks({ onMessageUpdate: mockHook });

      await hooksManager.onMessageUpdate(456);

      expect(mockHook).toHaveBeenCalledWith(456, undefined);
    });

    test("should handle errors in onMessageUpdate hook gracefully", async () => {
      const mockHook = mock(async () => {
        throw new Error("Hook error");
      });
      hooksManager.registerHooks({ onMessageUpdate: mockHook });

      await expect(hooksManager.onMessageUpdate(456, "commit")).resolves.toBeUndefined();
      expect(mockHook).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling", () => {
    test("should handle async errors in all hooks", async () => {
      const asyncError = new Error("Async hook error");
      const hooks: ChatHooks = {
        onChatStart: mock(async () => { throw asyncError; }),
        onChatComplete: mock(async () => { throw asyncError; }),
        onChatError: mock(async () => { throw asyncError; }),
        onChatCancel: mock(async () => { throw asyncError; }),
        onStatusUpdate: mock(async () => { throw asyncError; }),
        onMessageUpdate: mock(async () => { throw asyncError; }),
      };

      hooksManager.registerHooks(hooks);

      // All should resolve without throwing
      await expect(hooksManager.onChatStart(1, {} as ChatSendEvent["data"])).resolves.toBeUndefined();
      await expect(hooksManager.onChatComplete(1, "response")).resolves.toBeUndefined();
      await expect(hooksManager.onChatError(1, "error")).resolves.toBeUndefined();
      await expect(hooksManager.onChatCancel(1)).resolves.toBeUndefined();
      await expect(hooksManager.onStatusUpdate({ chatId: 1, status: "idle" })).resolves.toBeUndefined();
      await expect(hooksManager.onMessageUpdate(1)).resolves.toBeUndefined();

      // All hooks should have been called
      expect(hooks.onChatStart).toHaveBeenCalledTimes(1);
      expect(hooks.onChatComplete).toHaveBeenCalledTimes(1);
      expect(hooks.onChatError).toHaveBeenCalledTimes(1);
      expect(hooks.onChatCancel).toHaveBeenCalledTimes(1);
      expect(hooks.onStatusUpdate).toHaveBeenCalledTimes(1);
      expect(hooks.onMessageUpdate).toHaveBeenCalledTimes(1);
    });

    test("should handle synchronous errors in hooks", async () => {
      const syncError = new Error("Sync hook error");
      const hooks: ChatHooks = {
        onChatStart: mock(() => { throw syncError; }) as any,
        onChatComplete: mock(() => { throw syncError; }) as any,
      };

      hooksManager.registerHooks(hooks);

      // Should still resolve even with sync errors
      await expect(hooksManager.onChatStart(1, {} as ChatSendEvent["data"])).resolves.toBeUndefined();
      await expect(hooksManager.onChatComplete(1, "response")).resolves.toBeUndefined();
    });
  });

  describe("Hook Execution Order", () => {
    test("should execute multiple operations in sequence", async () => {
      const executionOrder: string[] = [];

      const hooks: ChatHooks = {
        onChatStart: mock(async () => {
          executionOrder.push("start");
          await new Promise(resolve => setTimeout(resolve, 10));
        }),
        onChatComplete: mock(async () => {
          executionOrder.push("complete");
        }),
        onStatusUpdate: mock(async () => {
          executionOrder.push("status");
        }),
      };

      hooksManager.registerHooks(hooks);

      await hooksManager.onChatStart(1, {} as ChatSendEvent["data"]);
      await hooksManager.onStatusUpdate({ chatId: 1, status: "in_progress" });
      await hooksManager.onChatComplete(1, "response");

      expect(executionOrder).toEqual(["start", "status", "complete"]);
    });
  });

  describe("Complex Data Handling", () => {
    test("should handle complex ChatSendEvent data", async () => {
      const mockHook = mock(async (chatId: number, data: ChatSendEvent["data"]) => {});
      hooksManager.registerHooks({ onChatStart: mockHook });

      const complexData: ChatSendEvent["data"] = {
        chatId: 123,
        model: "gpt-4-turbo",
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there!" },
          { role: "user", content: "How are you?" }
        ],
        userMessageId: 456,
        mode: "write",
      };

      await hooksManager.onChatStart(123, complexData);

      expect(mockHook).toHaveBeenCalledWith(123, complexData);
    });

    test("should handle complex ChatStatus data", async () => {
      const mockHook = mock(async (status: ChatStatus) => {});
      hooksManager.registerHooks({ onStatusUpdate: mockHook });

      const complexStatus: ChatStatus = {
        chatId: 123,
        status: "error",
        startedAt: Date.now() - 1000,
        completedAt: Date.now(),
        error: "Network timeout error",
        mode: "write",
        model: "gpt-4-turbo",
      };

      await hooksManager.onStatusUpdate(complexStatus);

      expect(mockHook).toHaveBeenCalledWith(complexStatus);
    });
  });
});
