import { UIMessage } from "ai";
import { z } from "zod";
import {
  addMessageToChat,
  createChat,
  deleteChat,
  deleteMessagesFromChat,
  getChatList,
  getChatWithMessages,
  getFirstMessageFromRecentChats,
  loadUIMessages,
  saveUIMessages,
  updateChat,
} from "../../repos/chatRepo.ts";
import { logger } from "../../utils/logger.ts";
import { publicProcedure, router } from "../trpc";

// Zod schema for UIMessage validation
const UIMessagePartSchema = z.union([
  z.object({
    type: z.literal("text"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("tool-call"),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.any(),
  }),
  z.object({
    type: z.literal("tool-result"),
    toolCallId: z.string(),
    result: z.any(),
    isError: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("reasoning"),
    reasoning: z.string(),
  }),
  z.object({
    type: z.literal("source"),
    sourceType: z.string(),
    id: z.string(),
    url: z.string().optional(),
    title: z.string().optional(),
  }),
]);

const UIMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(UIMessagePartSchema),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date().optional(),
});

export const chatRouter = router({
  // Get chat messages in UIMessage format
  getMessages: publicProcedure
    .input(
      z.object({
        chatId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const messages = await loadUIMessages(input.chatId);
        return {
          chatId: input.chatId,
          messages,
        };
      } catch (err) {
        logger.error(JSON.stringify(err), "getMessages endpoint failed");
        throw err;
      }
    }),

  // Get chat with all its messages
  getChat: publicProcedure
    .input(
      z.object({
        chatId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await getChatWithMessages(input.chatId);
        return result;
      } catch (err) {
        logger.error(JSON.stringify(err), "getChat endpoint failed");
        throw err;
      }
    }),

  // Get list of chats
  getChatList: publicProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        parentId: z.string().nullable().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await getChatList({
          limit: input.limit,
          offset: input.offset,
          parentId: input.parentId,
        });

        return {
          chats: result.chats,
          hasMore: result.hasMore,
        };
      } catch (err) {
        logger.error(JSON.stringify(err), "getChatList endpoint failed");
        throw err;
      }
    }),

  // Get first message from recent chats
  getFirstMessageFromRecentChats: publicProcedure
    .input(
      z.object({
        chatLimit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await getFirstMessageFromRecentChats({
          chatLimit: input.chatLimit,
        });

        return result;
      } catch (err) {
        logger.error(
          JSON.stringify(err),
          "getFirstMessageFromRecentChats endpoint failed"
        );
        throw err;
      }
    }),

  // Create a new chat
  createChat: publicProcedure
    .input(
      z.object({
        title: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const chat = await createChat(input.title);
        return chat;
      } catch (err) {
        logger.error(JSON.stringify(err), "createChat endpoint failed");
        throw err;
      }
    }),

  // Update chat metadata
  updateChat: publicProcedure
    .input(
      z.object({
        chatId: z.string(),
        title: z.string().optional(),
        status: z
          .enum(["idle", "in_progress", "completed", "error"])
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const chat = await updateChat({
          chatId: input.chatId,
          title: input.title,
          status: input.status,
        });

        return chat;
      } catch (err) {
        logger.error(JSON.stringify(err), "updateChat endpoint failed");
        throw err;
      }
    }),

  // Save complete conversation in UIMessage format
  saveMessages: publicProcedure
    .input(
      z.object({
        chatId: z.string(),
        messages: z.array(UIMessageSchema),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await saveUIMessages(input.chatId, input.messages);
        return {
          success: true,
          chatId: input.chatId,
          messageCount: input.messages.length,
        };
      } catch (err) {
        logger.error(JSON.stringify(err), "saveMessages endpoint failed");
        throw err;
      }
    }),

  // Add a single message to a chat
  addMessage: publicProcedure
    .input(
      z.object({
        chatId: z.string(),
        message: UIMessageSchema,
      })
    )
    .mutation(async ({ input }) => {
      try {
        await addMessageToChat(input.chatId, input.message);
        return {
          success: true,
          chatId: input.chatId,
          messageId: input.message.id,
        };
      } catch (err) {
        logger.error(JSON.stringify(err), "addMessage endpoint failed");
        throw err;
      }
    }),

  // Delete chat and all its messages
  deleteChat: publicProcedure
    .input(
      z.object({
        chatId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await deleteChat(input.chatId);
        return result;
      } catch (err) {
        logger.error(JSON.stringify(err), "deleteChat endpoint failed");
        throw err;
      }
    }),

  // Delete messages from a specific point onwards
  deleteMessages: publicProcedure
    .input(
      z.object({
        chatId: z.string(),
        fromMessageId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await deleteMessagesFromChat(
          input.chatId,
          input.fromMessageId
        );
        return result;
      } catch (err) {
        logger.error(JSON.stringify(err), "deleteMessages endpoint failed");
        throw err;
      }
    }),

  // Stream-compatible endpoint for AI SDK integration
  processMessages: publicProcedure
    .input(
      z.object({
        chatId: z.string(),
        messages: z.array(UIMessageSchema),
        model: z.string(),
        mode: z.enum(["ask", "write"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // This endpoint would typically be used by the chat processor
        // to trigger message processing and return a stream response

        // For now, just save the messages and return success
        // The actual streaming would be handled by the chat processor
        await saveUIMessages(input.chatId, input.messages);

        return {
          success: true,
          chatId: input.chatId,
          messageCount: input.messages.length,
          model: input.model,
          mode: input.mode,
        };
      } catch (err) {
        logger.error(JSON.stringify(err), "processMessages endpoint failed");
        throw err;
      }
    }),

  // Append user message and get updated conversation
  appendUserMessage: publicProcedure
    .input(
      z.object({
        chatId: z.string(),
        text: z.string(),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Load existing messages
        const existingMessages = await loadUIMessages(input.chatId);

        // Create new user message
        const userMessage: UIMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          role: "user",
          parts: [{ type: "text", text: input.text }],
          createdAt: new Date(),
          ...(input.metadata && { metadata: input.metadata }),
        };

        // Add to existing messages
        const updatedMessages = [...existingMessages, userMessage];

        // Save all messages
        await saveUIMessages(input.chatId, updatedMessages);

        return {
          success: true,
          chatId: input.chatId,
          messages: updatedMessages,
          newMessageId: userMessage.id,
        };
      } catch (err) {
        logger.error(JSON.stringify(err), "appendUserMessage endpoint failed");
        throw err;
      }
    }),
});
