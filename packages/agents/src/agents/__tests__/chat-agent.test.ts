import type { CoreMessage } from "ai";
import { describe, expect, it } from "vitest";
import { cleanMessages } from "../chat-agent";

describe("Chat Agent", () => {
  describe("Message Cleaning", () => {
    // Test the cleanMessages function directly

    it("should remove toolCall tags from message content", () => {
      const messages: CoreMessage[] = [
        {
          role: "user",
          content:
            "Hello, can you help me? [toolCall:call_1_5c1c5c0e-1c1e-4c8e-8c1e-1c5c5e1c5e1c,edit-file]",
        },
      ];

      const cleanedMessages = cleanMessages(messages);

      expect(cleanedMessages[0].content).toBe("Hello, can you help me? ");
    });

    it("should remove multiple toolCall tags from message content", () => {
      const messages: CoreMessage[] = [
        {
          role: "user",
          content:
            "First [toolCall:call_1,edit-file] and second [toolCall:call_2,read-file] request",
        },
      ];

      const cleanedMessages = cleanMessages(messages);

      expect(cleanedMessages[0].content).toBe("First  and second  request");
    });

    it("should handle messages without toolCall tags", () => {
      const messages: CoreMessage[] = [
        {
          role: "user",
          content: "Hello, this is a normal message",
        },
      ];

      const cleanedMessages = cleanMessages(messages);

      expect(cleanedMessages[0].content).toBe(
        "Hello, this is a normal message",
      );
    });

    it("should handle empty messages", () => {
      const messages: CoreMessage[] = [
        {
          role: "user",
          content: "",
        },
      ];

      const cleanedMessages = cleanMessages(messages);

      expect(cleanedMessages[0].content).toBe("");
    });

    it("should handle messages with only toolCall tags", () => {
      const messages: CoreMessage[] = [
        {
          role: "user",
          content:
            "[toolCall:call_1_5c1c5c0e-1c1e-4c8e-8c1e-1c5c5e1c5e1c,edit-file]",
        },
      ];

      const cleanedMessages = cleanMessages(messages);

      expect(cleanedMessages[0].content).toBe("");
    });

    it("should handle complex toolCall tag patterns", () => {
      const messages: CoreMessage[] = [
        {
          role: "user",
          content:
            "Please [toolCall:call_1_abc123-def456-ghi789,terminal] run this command and [toolCall:call_2_xyz789,file-system] check the files",
        },
      ];

      const cleanedMessages = cleanMessages(messages);

      expect(cleanedMessages[0].content).toBe(
        "Please  run this command and  check the files",
      );
    });

    it("should not affect non-string content", () => {
      const messages: CoreMessage[] = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "This is complex content [toolCall:call_1,edit-file]",
            },
          ],
        },
      ];

      const cleanedMessages = cleanMessages(messages);

      expect(cleanedMessages[0].content).toEqual([
        {
          type: "text",
          text: "This is complex content [toolCall:call_1,edit-file]",
        },
      ]);
    });

    it("should preserve other message properties", () => {
      const messages: CoreMessage[] = [
        {
          role: "assistant",
          content: "Response with [toolCall:call_1,edit-file] tag",
          id: "msg-123",
        },
      ];

      const cleanedMessages = cleanMessages(messages);

      expect(cleanedMessages[0]).toEqual({
        role: "assistant",
        content: "Response with  tag",
        id: "msg-123",
      });
    });
  });
});
