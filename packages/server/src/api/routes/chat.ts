import { logger } from "@chara-codes/logger";
import { z } from "zod";
import {
  createChat,
  getChatList,
  getHistory,
  saveMessage,
  updateMessage,
  deleteMessages,
} from "../../repos/chatRepo.ts";
import { publicProcedure, router } from "../trpc";

export const chatRouter = router({
  getHistory: publicProcedure
    .input(
      z.object({
        chatId: z.number(),
        lastMessageId: z.string().nullable().optional(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const chatId = input.chatId;

        const lastMessageId = input.lastMessageId
          ? Number(input.lastMessageId)
          : null;

        const history = await getHistory({
          chatId,
          lastMessageId,
          limit: input.limit,
        });

        return {
          chatId: chatId,
          history: history.messages,
          hasMore: history.hasMore,
        };
      } catch (err) {
        logger.error(JSON.stringify(err), "getHistory endpoint failed");
        throw err;
      }
    }),

  getChatList: publicProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        parentId: z.number().nullable().optional(),
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

  saveMessage: publicProcedure
    .input(
      z.object({
        chatId: z.number(),
        content: z.string(),
        role: z.string(),
        commit: z.string().optional(),
        context: z.any().optional(),
        toolCalls: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const message = await saveMessage({
          chatId: input.chatId,
          content: input.content,
          role: input.role,
          commit: input.commit,
          context: input.context,
          toolCalls: input.toolCalls,
        });

        return message;
      } catch (err) {
        logger.error(JSON.stringify(err), "saveMessage endpoint failed");
        throw err;
      }
    }),

  updateMessage: publicProcedure
    .input(
      z.object({
        messageId: z.number(),
        commit: z.string().optional(),
        content: z.string().optional(),
        context: z.any().optional(),
        toolCalls: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const message = await updateMessage({
          messageId: input.messageId,
          commit: input.commit,
          content: input.content,
          context: input.context,
          toolCalls: input.toolCalls,
        });

        return message;
      } catch (err) {
        logger.error(JSON.stringify(err), "updateMessage endpoint failed");
        throw err;
      }
    }),

  deleteMessages: publicProcedure
    .input(
      z.object({
        chatId: z.number(),
        messageId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await deleteMessages({
          chatId: input.chatId,
          messageId: input.messageId,
        });

        return result;
      } catch (err) {
        logger.error(JSON.stringify(err), "deleteMessages endpoint failed");
        throw err;
      }
    }),
});
