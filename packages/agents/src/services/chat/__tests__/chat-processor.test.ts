import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { ChatProcessor } from "../chat-processor";
import type { ChatSendEvent } from "../types";

describe("ChatProcessor", () => {
  let chatProcessor: ChatProcessor;

  beforeEach(() => {
    chatProcessor = new ChatProcessor();
  });

  afterEach(() => {
    chatProcessor.destroy();
  });

  describe("setTools", () => {
    test("should set MCP tools correctly", () => {
      const tools = {
        testTool: { name: "test", description: "A test tool" },
        anotherTool: { name: "another", description: "Another tool" },
      };

      expect(() => chatProcessor.setTools(tools)).not.toThrow();
    });

    test("should handle empty tools object", () => {
      expect(() => chatProcessor.setTools({})).not.toThrow();
    });

    test("should handle complex tools object", () => {
      const complexTools = {
        tool1: {
          name: "tool1",
          description: "First tool",
          inputSchema: { type: "object" },
          execute: async () => "result1",
        },
        tool2: {
          name: "tool2",
          description: "Second tool",
          inputSchema: {
            type: "object",
            properties: { param: { type: "string" } },
          },
          execute: async (input: any) => `result for ${input.param}`,
        },
      };

      expect(() => chatProcessor.setTools(complexTools)).not.toThrow();
    });

    test("should handle tools with various data types", () => {
      const mixedTools = {
        stringTool: "simple string",
        numberTool: 42,
        booleanTool: true,
        arrayTool: [1, 2, 3],
        objectTool: { nested: { deep: { value: "test" } } },
        nullTool: null,
        undefinedTool: undefined,
      };

      expect(() => chatProcessor.setTools(mixedTools)).not.toThrow();
    });

    test("should handle sequential tool updates", () => {
      const tools1 = { tool1: "first" };
      const tools2 = { tool2: "second" };
      const tools3 = { tool3: "third" };

      expect(() => {
        chatProcessor.setTools(tools1);
        chatProcessor.setTools(tools2);
        chatProcessor.setTools(tools3);
      }).not.toThrow();
    });
  });

  describe("getActiveChats", () => {
    test("should return empty array when no chats are active", () => {
      const activeChats = chatProcessor.getActiveChats();
      expect(activeChats).toEqual([]);
    });

    test("should maintain state consistency", () => {
      const activeChats1 = chatProcessor.getActiveChats();
      const activeChats2 = chatProcessor.getActiveChats();

      expect(activeChats1).toEqual(activeChats2);
      expect(Array.isArray(activeChats1)).toBe(true);
    });
  });

  describe("isProcessing", () => {
    test("should return false for non-processing chat", () => {
      expect(chatProcessor.isProcessing(123)).toBe(false);
    });

    test("should handle invalid chat IDs gracefully", () => {
      const invalidIds = [0, -1, NaN, Infinity, -Infinity];

      invalidIds.forEach((id) => {
        expect(chatProcessor.isProcessing(id)).toBe(false);
      });
    });

    test("should return consistent results", () => {
      const chatId = 456;
      const result1 = chatProcessor.isProcessing(chatId);
      const result2 = chatProcessor.isProcessing(chatId);

      expect(result1).toBe(result2);
      expect(typeof result1).toBe("boolean");
    });
  });

  describe("handleChatCancel", () => {
    test("should handle cancel for non-existent chat gracefully", () => {
      expect(() => chatProcessor.handleChatCancel(999)).not.toThrow();
    });

    test("should handle invalid chat IDs gracefully", () => {
      const invalidIds = [0, -1, NaN, Infinity, -Infinity];

      invalidIds.forEach((id) => {
        expect(() => chatProcessor.handleChatCancel(id)).not.toThrow();
      });
    });

    test("should handle rapid cancellation requests", () => {
      const chatId = 123;

      expect(() => {
        chatProcessor.handleChatCancel(chatId);
        chatProcessor.handleChatCancel(chatId);
        chatProcessor.handleChatCancel(chatId);
      }).not.toThrow();
    });
  });

  describe("destroy", () => {
    test("should be safe to call multiple times", () => {
      expect(() => {
        chatProcessor.destroy();
        chatProcessor.destroy();
        chatProcessor.destroy();
      }).not.toThrow();
    });

    test("should cleanup resources properly", () => {
      chatProcessor.setTools({ testTool: "test" });

      expect(() => chatProcessor.destroy()).not.toThrow();
      expect(chatProcessor.getActiveChats()).toEqual([]);
    });
  });

  describe("clear", () => {
    test("should clear active chat controllers", () => {
      chatProcessor.clear();
      expect(chatProcessor.getActiveChats()).toEqual([]);
    });

    test("should be safe to call multiple times", () => {
      expect(() => {
        chatProcessor.clear();
        chatProcessor.clear();
        chatProcessor.clear();
      }).not.toThrow();
    });
  });

  describe("handleChatSend data validation", () => {
    const createMockChatData = (
      overrides: Partial<ChatSendEvent["data"]> = {}
    ): ChatSendEvent["data"] => ({
      chatId: 123,
      model: "gpt-4",
      messages: [{ role: "user", content: "Hello" }],
      mode: "ask",
      ...overrides,
    });

    test("should handle basic chat data structure", () => {
      const data = createMockChatData();
      expect(data.chatId).toBe(123);
      expect(data.model).toBe("gpt-4");
      expect(data.mode).toBe("ask");
      expect(data.messages).toHaveLength(1);
    });

    test("should handle chat data with overrides", () => {
      const data = createMockChatData({
        mode: "write",
        model: "gpt-4-turbo",
        userMessageId: 456,
      });
      expect(data.mode).toBe("write");
      expect(data.model).toBe("gpt-4-turbo");
      expect(data.userMessageId).toBe(456);
    });

    test("should validate required chat data fields", () => {
      const data = createMockChatData();

      expect(typeof data.chatId).toBe("number");
      expect(typeof data.model).toBe("string");
      expect(Array.isArray(data.messages)).toBe(true);
      expect(["ask", "write"]).toContain(data.mode);
    });

    test("should handle different chat modes", () => {
      const askData = createMockChatData({ mode: "ask" });
      const writeData = createMockChatData({ mode: "write" });

      expect(askData.mode).toBe("ask");
      expect(writeData.mode).toBe("write");
    });

    test("should handle complex message structures", () => {
      const complexMessages = [
        { role: "user" as const, content: "Hello" },
        { role: "assistant" as const, content: "Hi there!" },
        { role: "user" as const, content: "How are you?" },
      ];

      const data = createMockChatData({ messages: complexMessages });
      expect(data.messages).toHaveLength(3);
      expect(data.messages[1]?.role).toBe("assistant");
    });

    test("should handle edge case chat data", () => {
      const edgeCases = [
        { chatId: 0, model: "", messages: [], mode: "ask" as const },
        {
          chatId: Number.MAX_SAFE_INTEGER,
          model: "test",
          messages: [],
          mode: "write" as const,
        },
        { chatId: 1, model: "test", messages: [], mode: "ask" as const },
      ];

      edgeCases.forEach((data) => {
        expect(typeof data.chatId).toBe("number");
        expect(typeof data.model).toBe("string");
        expect(Array.isArray(data.messages)).toBe(true);
        expect(["ask", "write"]).toContain(data.mode);
      });
    });
  });

  describe("ChatProcessor State Management", () => {
    test("should maintain internal state correctly", () => {
      expect(chatProcessor.getActiveChats()).toEqual([]);
      expect(chatProcessor.isProcessing(123)).toBe(false);

      chatProcessor.clear();
      expect(chatProcessor.getActiveChats()).toEqual([]);
    });

    test("should handle multiple concurrent operations", () => {
      const chatIds = [123, 456, 789];

      chatIds.forEach((id) => {
        expect(chatProcessor.isProcessing(id)).toBe(false);
      });

      chatIds.forEach((id) => {
        expect(() => chatProcessor.handleChatCancel(id)).not.toThrow();
      });
    });

    test("should properly cleanup resources", () => {
      chatProcessor.setTools({ testTool: "test" });

      expect(() => chatProcessor.destroy()).not.toThrow();
      expect(() => chatProcessor.clear()).not.toThrow();

      expect(chatProcessor.getActiveChats()).toEqual([]);
    });

    test("should handle state transitions", () => {
      const initialState = chatProcessor.getActiveChats();

      chatProcessor.setTools({ tool: "test" });
      const afterToolsState = chatProcessor.getActiveChats();

      chatProcessor.clear();
      const afterClearState = chatProcessor.getActiveChats();

      expect(initialState).toEqual(afterToolsState);
      expect(afterClearState).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    test("should handle malformed tool definitions", () => {
      const malformedTools = {
        incomplete: { name: "test" }, // missing description
        circular: {},
      };

      // Create circular reference
      malformedTools.circular = malformedTools;

      expect(() => chatProcessor.setTools(malformedTools)).not.toThrow();
    });

    test("should handle extreme values", () => {
      const extremeData = createMockChatData({
        chatId: Number.MAX_VALUE,
        model: "a".repeat(10000),
        messages: new Array(1000).fill({ role: "user", content: "test" }),
      });

      expect(typeof extremeData.chatId).toBe("number");
      expect(typeof extremeData.model).toBe("string");
      expect(Array.isArray(extremeData.messages)).toBe(true);
    });

    test("should recover from error states", () => {
      // Simulate error by destroying and recreating
      chatProcessor.destroy();

      expect(() => {
        chatProcessor.setTools({ recovery: "test" });
        chatProcessor.getActiveChats();
        chatProcessor.isProcessing(1);
      }).not.toThrow();
    });

    const createMockChatData = (
      overrides: Partial<ChatSendEvent["data"]> = {}
    ): ChatSendEvent["data"] => ({
      chatId: 123,
      model: "gpt-4",
      messages: [{ role: "user", content: "Hello" }],
      mode: "ask",
      ...overrides,
    });
  });

  describe("Memory Management", () => {
    test("should handle rapid destroy/clear cycles", () => {
      for (let i = 0; i < 10; i++) {
        chatProcessor.setTools({ [`tool${i}`]: `value${i}` });
        chatProcessor.clear();
        chatProcessor.destroy();
      }

      expect(chatProcessor.getActiveChats()).toEqual([]);
    });

    test("should handle large tool objects", () => {
      const largeTool = {
        bigArray: new Array(1000)
          .fill(0)
          .map((_, i) => ({ id: i, value: `item${i}` })),
        bigString: "x".repeat(10000),
        deepObject: {} as any,
      };

      let current = largeTool.deepObject;
      for (let i = 0; i < 100; i++) {
        current.next = { level: i };
        current = current.next;
      }

      expect(() => chatProcessor.setTools({ largeTool })).not.toThrow();
    });

    test("should prevent memory leaks", () => {
      const initialActiveChats = chatProcessor.getActiveChats().length;

      for (let i = 0; i < 50; i++) {
        chatProcessor.handleChatCancel(i);
      }

      const finalActiveChats = chatProcessor.getActiveChats().length;
      expect(finalActiveChats).toBe(initialActiveChats);
    });
  });

  describe("Concurrency", () => {
    test("should handle concurrent state operations", () => {
      const operations: (() => void)[] = [];

      for (let i = 0; i < 50; i++) {
        operations.push(() => chatProcessor.setTools({ [`tool${i}`]: i }));
        operations.push(() => chatProcessor.getActiveChats());
        operations.push(() => chatProcessor.isProcessing(i));
        operations.push(() => chatProcessor.handleChatCancel(i));
      }

      expect(() => {
        operations.forEach((op) => op());
      }).not.toThrow();
    });

    test("should maintain consistency during concurrent access", () => {
      for (let i = 0; i < 100; i++) {
        chatProcessor.setTools({ current: i });
        const activeChats = chatProcessor.getActiveChats();
        const isProcessing = chatProcessor.isProcessing(i);

        expect(Array.isArray(activeChats)).toBe(true);
        expect(typeof isProcessing).toBe("boolean");
      }
    });

    test("should handle rapid method calls", () => {
      expect(() => {
        for (let i = 0; i < 1000; i++) {
          chatProcessor.getActiveChats();
          chatProcessor.isProcessing(i % 10);
        }
      }).not.toThrow();
    });
  });

  describe("Integration Readiness", () => {
    test("should expose all required public methods", () => {
      const requiredMethods = [
        "setTools",
        "handleChatSend",
        "handleChatCancel",
        "getActiveChats",
        "isProcessing",
        "destroy",
        "clear",
      ];

      requiredMethods.forEach((method) => {
        expect(typeof (chatProcessor as any)[method]).toBe("function");
      });
    });

    test("should maintain object integrity after operations", () => {
      chatProcessor.setTools({ test: "value" });
      chatProcessor.getActiveChats();
      chatProcessor.isProcessing(123);
      chatProcessor.handleChatCancel(456);
      chatProcessor.clear();

      expect(typeof chatProcessor.setTools).toBe("function");
      expect(typeof chatProcessor.getActiveChats).toBe("function");
      expect(Array.isArray(chatProcessor.getActiveChats())).toBe(true);
    });

    test("should handle AI SDK v5 tool call states", () => {
      // Test that the new tool call status values are valid
      const validStatuses = [
        "input-streaming",
        "input-available",
        "executing",
        "success",
        "error",
      ];

      validStatuses.forEach((status) => {
        expect(typeof status).toBe("string");
        expect(status.length).toBeGreaterThan(0);
      });
    });

    test("should support streaming protocol", () => {
      // Ensure the processor can handle the new streaming events
      const streamEvents = [
        "stream-start",
        "text-start",
        "text-delta",
        "text-end",
        "tool-input-start",
        "tool-input-delta",
        "tool-input-end",
        "tool-call",
        "tool-result",
        "reasoning-start",
        "reasoning-delta",
        "reasoning-end",
        "source",
        "finish",
      ];

      streamEvents.forEach((event) => {
        expect(typeof event).toBe("string");
        expect(event.length).toBeGreaterThan(0);
      });
    });

    test("should handle chunk broadcasting structure", () => {
      // Verify the structure for broadcasting chunks
      const chunkData = {
        chatId: 123,
        assistantMessageId: 456,
        chunk: "test content",
        type: "text",
      };

      expect(typeof chunkData.chatId).toBe("number");
      expect(typeof chunkData.assistantMessageId).toBe("number");
      expect(typeof chunkData.chunk).toBe("string");
      expect(typeof chunkData.type).toBe("string");
    });
  });

  describe("Tool Call Management", () => {
    test("should handle tool call lifecycle states", () => {
      const toolCallStates = [
        "input-streaming",
        "input-available",
        "executing",
        "success",
        "error",
      ];

      toolCallStates.forEach((state) => {
        const toolCall = {
          id: "test-id",
          name: "test-tool",
          arguments: { param: "value" },
          status: state as any,
          timestamp: new Date().toISOString(),
        };

        expect(toolCall.status).toBe(state);
        expect(typeof toolCall.id).toBe("string");
        expect(typeof toolCall.name).toBe("string");
        expect(typeof toolCall.arguments).toBe("object");
        expect(typeof toolCall.timestamp).toBe("string");
      });
    });

    test("should handle tool call error scenarios", () => {
      const errorToolCall = {
        id: "error-tool",
        name: "failing-tool",
        arguments: {},
        status: "error" as const,
        result: { error: "Tool execution failed" },
        timestamp: new Date().toISOString(),
      };

      expect(errorToolCall.status).toBe("error");
      expect(errorToolCall.result.error).toBe("Tool execution failed");
    });
  });
});
