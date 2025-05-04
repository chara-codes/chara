import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import {
  DEFAULT_PROJECT_ID,
  ensureChat,
  streamTextAndPersist,
} from "../../repos/chatRepo.ts";
import { myLogger as logger } from "../../utils/logger";

export const messagesRouter = router({
  ask: publicProcedure
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
        logger.error(JSON.stringify(err), "messages.ask endpoint failed");
        throw err;
      }
    }),
});
