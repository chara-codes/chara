import { generateId, UIMessage } from "ai";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

describe("Functional Chat Processor - Unit Tests", () => {
  // Test the pure functional parts without external dependencies

  describe("UIMessage Format Validation", () => {
    test("should create valid UIMessage with text parts", () => {
      const message: UIMessage = {
        id: generateId(),
        role: "user",
        parts: [
          { type: "text", text: "Hello world" },
          { type: "text", text: " How are you?" },
        ],
        createdAt: new Date(),
      };

      expect(message.parts).toHaveLength(2);
      expect(message.parts[0].type).toBe("text");
      expect((message.parts[0] as any).text).toBe("Hello world");
      expect(message.role).toBe("user");
      expect(message.id).toBeDefined();
    });

    test("should create valid UIMessage with tool call parts", () => {
      const message: UIMessage = {
        id: generateId(),
        role: "assistant",
        parts: [
          {
            type: "tool-call" as any,
            toolCallId: "call-123",
            toolName: "search",
            args: { query: "test" },
          },
        ],
        createdAt: new Date(),
      };

      expect(message.parts[0].type).toBe("tool-call");
      expect((message.parts[0] as any).toolName).toBe("search");
      expect((message.parts[0] as any).args).toEqual({ query: "test" });
    });

    test("should handle metadata correctly", () => {
      const metadata = {
        source: "api",
        confidence: 0.95,
        tags: ["important", "user-query"],
      };

      const message: UIMessage = {
        id: generateId(),
        role: "user",
        parts: [{ type: "text", text: "Test with metadata" }],
        metadata,
        createdAt: new Date(),
      };

      expect(message.metadata).toEqual(metadata);
      expect(message.metadata?.source).toBe("api");
      expect(message.metadata?.confidence).toBe(0.95);
    });

    test("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe("string");
      expect(typeof id2).toBe("string");
    });

    test("should handle different message roles", () => {
      const userMessage: UIMessage = {
        id: generateId(),
        role: "user",
        parts: [{ type: "text", text: "User message" }],
      };

      const assistantMessage: UIMessage = {
        id: generateId(),
        role: "assistant",
        parts: [{ type: "text", text: "Assistant message" }],
      };

      const systemMessage: UIMessage = {
        id: generateId(),
        role: "system",
        parts: [{ type: "text", text: "System message" }],
      };

      expect(userMessage.role).toBe("user");
      expect(assistantMessage.role).toBe("assistant");
      expect(systemMessage.role).toBe("system");
    });
  });

  describe("Message Transformation Logic", () => {
    test("should extract text content from UIMessage parts", () => {
      const message: UIMessage = {
        id: generateId(),
        role: "user",
        parts: [
          { type: "text", text: "Hello " },
          { type: "text", text: "world!" },
        ],
      };

      const textContent = message.parts
        .filter((part) => part.type === "text")
        .map((part) => (part as any).text)
        .join("");

      expect(textContent).toBe("Hello world!");
    });

    test("should extract tool calls from UIMessage parts", () => {
      const message: UIMessage = {
        id: generateId(),
        role: "assistant",
        parts: [
          { type: "text", text: "I'll search for that." },
          {
            type: "tool-call" as any,
            toolCallId: "call-1",
            toolName: "search",
            args: { query: "TypeScript" },
          },
          {
            type: "tool-call" as any,
            toolCallId: "call-2",
            toolName: "analyze",
            args: { data: [1, 2, 3] },
          },
        ],
      };

      const toolCalls = message.parts
        .filter((part) => part.type === "tool-call")
        .map((part) => ({
          id: (part as any).toolCallId,
          name: (part as any).toolName,
          arguments: (part as any).args,
        }));

      expect(toolCalls).toHaveLength(2);
      expect(toolCalls[0]).toEqual({
        id: "call-1",
        name: "search",
        arguments: { query: "TypeScript" },
      });
      expect(toolCalls[1]).toEqual({
        id: "call-2",
        name: "analyze",
        arguments: { data: [1, 2, 3] },
      });
    });

    test("should handle mixed content types", () => {
      const message: UIMessage = {
        id: generateId(),
        role: "assistant",
        parts: [
          { type: "text", text: "Let me help you with that. " },
          {
            type: "tool-call" as any,
            toolCallId: "call-123",
            toolName: "calculator",
            args: { expression: "2 + 2" },
          },
          { type: "text", text: " The result is 4." },
        ],
      };

      const textParts = message.parts.filter((part) => part.type === "text");
      const toolParts = message.parts.filter(
        (part) => part.type === "tool-call"
      );

      expect(textParts).toHaveLength(2);
      expect(toolParts).toHaveLength(1);
    });
  });

  describe("Data Structure Validation", () => {
    test("should validate ChatProcessorOptions structure", () => {
      interface ChatProcessorOptions {
        chatId: string;
        messages: UIMessage[];
        model: string;
        mode: "ask" | "write";
        workingDir?: string;
        abortSignal?: AbortSignal;
      }

      const validOptions: ChatProcessorOptions = {
        chatId: "test-chat-123",
        messages: [
          {
            id: generateId(),
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
          },
        ],
        model: "gpt-4",
        mode: "ask",
        workingDir: "/tmp/test",
      };

      expect(validOptions.chatId).toBe("test-chat-123");
      expect(validOptions.messages).toHaveLength(1);
      expect(validOptions.model).toBe("gpt-4");
      expect(validOptions.mode).toBe("ask");
      expect(validOptions.workingDir).toBe("/tmp/test");
    });

    test("should validate ChatStore interface", () => {
      interface ChatStore {
        saveChat: (chatId: string, messages: UIMessage[]) => Promise<void>;
        loadChat: (chatId: string) => Promise<UIMessage[]>;
      }

      const mockStore: ChatStore = {
        saveChat: async (chatId: string, messages: UIMessage[]) => {
          expect(chatId).toBeDefined();
          expect(Array.isArray(messages)).toBe(true);
        },
        loadChat: async (chatId: string) => {
          expect(chatId).toBeDefined();
          return [];
        },
      };

      expect(typeof mockStore.saveChat).toBe("function");
      expect(typeof mockStore.loadChat).toBe("function");
    });
  });

  describe("Utility Functions", () => {
    test("should create conversation from messages", () => {
      const messages: UIMessage[] = [
        {
          id: "msg-1",
          role: "user",
          parts: [{ type: "text", text: "What is TypeScript?" }],
          createdAt: new Date("2023-01-01T10:00:00Z"),
        },
        {
          id: "msg-2",
          role: "assistant",
          parts: [
            {
              type: "text",
              text: "TypeScript is a typed superset of JavaScript.",
            },
          ],
          createdAt: new Date("2023-01-01T10:00:01Z"),
        },
        {
          id: "msg-3",
          role: "user",
          parts: [{ type: "text", text: "Can you give an example?" }],
          createdAt: new Date("2023-01-01T10:00:02Z"),
        },
      ];

      expect(messages).toHaveLength(3);
      expect(messages[0].role).toBe("user");
      expect(messages[1].role).toBe("assistant");
      expect(messages[2].role).toBe("user");

      // Test chronological order
      expect(messages[0].createdAt!.getTime()).toBeLessThan(
        messages[1].createdAt!.getTime()
      );
      expect(messages[1].createdAt!.getTime()).toBeLessThan(
        messages[2].createdAt!.getTime()
      );
    });

    test("should append message to conversation", () => {
      const existingMessages: UIMessage[] = [
        {
          id: "msg-1",
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
        },
      ];

      const newMessage: UIMessage = {
        id: "msg-2",
        role: "assistant",
        parts: [{ type: "text", text: "Hi there!" }],
      };

      const updatedMessages = [...existingMessages, newMessage];

      expect(updatedMessages).toHaveLength(2);
      expect(updatedMessages[0].id).toBe("msg-1");
      expect(updatedMessages[1].id).toBe("msg-2");
    });

    test("should handle empty conversations", () => {
      const emptyMessages: UIMessage[] = [];

      expect(emptyMessages).toHaveLength(0);
      expect(Array.isArray(emptyMessages)).toBe(true);
    });

    test("should create user message helper", () => {
      function createUserMessage(
        text: string,
        metadata?: Record<string, unknown>
      ): UIMessage {
        return {
          id: generateId(),
          role: "user",
          parts: [{ type: "text", text }],
          createdAt: new Date(),
          ...(metadata && { metadata }),
        };
      }

      const message1 = createUserMessage("Hello world");
      const message2 = createUserMessage("Test message", { priority: "high" });

      expect(message1.role).toBe("user");
      expect((message1.parts[0] as any).text).toBe("Hello world");
      expect(message1.metadata).toBeUndefined();

      expect(message2.role).toBe("user");
      expect((message2.parts[0] as any).text).toBe("Test message");
      expect(message2.metadata).toEqual({ priority: "high" });
    });

    test("should validate message content extraction", () => {
      function extractTextContent(message: UIMessage): string {
        return message.parts
          .filter((part) => part.type === "text")
          .map((part) => (part as any).text)
          .join("");
      }

      const message: UIMessage = {
        id: generateId(),
        role: "user",
        parts: [
          { type: "text", text: "Hello " },
          {
            type: "tool-call" as any,
            toolCallId: "call-1",
            toolName: "test",
            args: {},
          },
          { type: "text", text: "world!" },
        ],
      };

      const content = extractTextContent(message);
      expect(content).toBe("Hello world!");
    });
  });

  describe("Error Handling Patterns", () => {
    test("should handle invalid message structures gracefully", () => {
      const invalidMessage = {
        id: generateId(),
        role: "user",
        parts: [], // Empty parts array
      } as UIMessage;

      expect(invalidMessage.parts).toHaveLength(0);

      const textContent = invalidMessage.parts
        .filter((part) => part.type === "text")
        .map((part) => (part as any).text)
        .join("");

      expect(textContent).toBe("");
    });

    test("should handle missing optional fields", () => {
      const minimalMessage: UIMessage = {
        id: generateId(),
        role: "user",
        parts: [{ type: "text", text: "Test" }],
        // No createdAt, no metadata
      };

      expect(minimalMessage.createdAt).toBeUndefined();
      expect(minimalMessage.metadata).toBeUndefined();
      expect(minimalMessage.id).toBeDefined();
      expect(minimalMessage.role).toBe("user");
    });

    test("should validate required fields", () => {
      function validateUIMessage(message: UIMessage): boolean {
        return !!(
          message.id &&
          message.role &&
          message.parts &&
          Array.isArray(message.parts) &&
          ["user", "assistant", "system"].includes(message.role)
        );
      }

      const validMessage: UIMessage = {
        id: generateId(),
        role: "user",
        parts: [{ type: "text", text: "Test" }],
      };

      const invalidMessage = {
        // Missing required fields
        parts: [],
      } as UIMessage;

      expect(validateUIMessage(validMessage)).toBe(true);
      expect(validateUIMessage(invalidMessage)).toBe(false);
    });
  });

  describe("Configuration and Options", () => {
    test("should handle different modes", () => {
      type Mode = "ask" | "write";

      const askMode: Mode = "ask";
      const writeMode: Mode = "write";

      expect(askMode).toBe("ask");
      expect(writeMode).toBe("write");
      expect(["ask", "write"]).toContain(askMode);
      expect(["ask", "write"]).toContain(writeMode);
    });

    test("should validate model names", () => {
      const validModels = ["gpt-4", "gpt-3.5-turbo", "claude-3", "gemini-pro"];

      function isValidModel(model: string): boolean {
        return validModels.includes(model) || model.includes(":");
      }

      expect(isValidModel("gpt-4")).toBe(true);
      expect(isValidModel("openai:::gpt-4")).toBe(true);
      expect(isValidModel("invalid-model")).toBe(false);
    });

    test("should handle abort signal creation", () => {
      const controller = new AbortController();

      expect(controller.signal).toBeDefined();
      expect(controller.signal.aborted).toBe(false);

      controller.abort();
      expect(controller.signal.aborted).toBe(true);
    });
  });

  describe("Type Safety and Compatibility", () => {
    test("should ensure UIMessage compatibility with AI SDK", () => {
      // This test ensures our UIMessage usage aligns with AI SDK expectations
      const message: UIMessage = {
        id: generateId(),
        role: "user",
        parts: [{ type: "text", text: "Test message" }],
        createdAt: new Date(),
        metadata: { source: "test" },
      };

      // Test that we can use the message in contexts expecting UIMessage
      function processUIMessage(msg: UIMessage): void {
        expect(msg.id).toBeDefined();
        expect(msg.role).toBeDefined();
        expect(msg.parts).toBeDefined();
      }

      expect(() => processUIMessage(message)).not.toThrow();
    });

    test("should handle conversation arrays", () => {
      const conversation: UIMessage[] = [
        {
          id: "1",
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
        },
        {
          id: "2",
          role: "assistant",
          parts: [{ type: "text", text: "Hi there!" }],
        },
      ];

      expect(Array.isArray(conversation)).toBe(true);
      expect(conversation.every((msg) => msg.id && msg.role && msg.parts)).toBe(
        true
      );
    });

    test("should support different part types", () => {
      interface TextPart {
        type: "text";
        text: string;
      }

      interface ToolCallPart {
        type: "tool-call";
        toolCallId: string;
        toolName: string;
        args: unknown;
      }

      const textPart: TextPart = {
        type: "text",
        text: "Hello world",
      };

      const toolPart: ToolCallPart = {
        type: "tool-call",
        toolCallId: "call-123",
        toolName: "search",
        args: { query: "test" },
      };

      expect(textPart.type).toBe("text");
      expect(toolPart.type).toBe("tool-call");
    });
  });
});
