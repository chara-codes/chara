import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { getHistoryAndPersist } from "../../repos/chatRepo.ts";
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
});
