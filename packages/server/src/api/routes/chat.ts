import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import {
  DEFAULT_PROJECT_ID,
  findExistingChat,
  getHistoryAndPersist,
} from "../../repos/chatRepo.ts";
import { logger } from "@chara-codes/logger";

export const chatRouter = router({
  getHistory: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        chatId: z.number().optional(),
        lastMessageId: z.string().nullable().optional(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const projectId = input?.projectId ?? DEFAULT_PROJECT_ID;

        const chatId = input.chatId ?? (await findExistingChat(projectId));

        if (!chatId) {
          return {
            projectId: input.projectId,
            chatId: null,
            history: [],
          };
        }

        const lastMessageId = input.lastMessageId
          ? Number(input.lastMessageId)
          : null;

        const history = await getHistoryAndPersist({
          chatId,
          lastMessageId,
          limit: input.limit,
        });

        return {
          projectId: input.projectId,
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
