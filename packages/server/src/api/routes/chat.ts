import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { getHistoryAndPersist, getChatList } from "../../repos/chatRepo.ts";
import { logger } from "@chara-codes/logger";

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

        const history = await getHistoryAndPersist({
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
});
