import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { messageSchema } from "../../dto/chat.ts";
import {
  DEFAULT_PROJECT_ID,
  ensureChat,
  streamObjectAndPersist,
  streamTextAndPersist,
} from "../../repos/chatRepo.ts";
import { myLogger as logger } from "../../utils/logger";

export const chatRouter = router({
  streamText: publicProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        chatId: z.number().optional(),
        question: z.string(),
      }),
    )
    .query(async function* ({ ctx, input }) {
      try {
        const projectId = input.projectId ?? DEFAULT_PROJECT_ID;
        const chatId =
          input.chatId ??
          (await ensureChat(projectId, input.question.slice(0, 60)));
        yield* streamTextAndPersist({ chatId, question: input.question, ctx });
      } catch (err) {
        logger.error(JSON.stringify(err), "streamText endpoint failed");
        throw err;
      }
    }),

  streamObject: publicProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        chatId: z.number().optional(),
        question: z.string(),
      }),
    )
    .query(async function* ({ ctx, input }) {
      try {
        const projectId = input.projectId ?? DEFAULT_PROJECT_ID;
        const chatId =
          input.chatId ??
          (await ensureChat(projectId, input.question.slice(0, 60)));
        yield* streamObjectAndPersist({
          chatId,
          question: input.question,
          ctx,
          schema: messageSchema,
        });
      } catch (err) {
        logger.error(JSON.stringify(err), "streamObject endpoint failed");
        throw err;
      }
    }),
});
