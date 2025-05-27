import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { messageSchema } from "../../dto/chat.ts";
import {
  DEFAULT_PROJECT_ID,
  DEFAULT_PROJECT_NAME,
  DEFAULT_STACK_ID,
  ensureChat,
  ensureProjectExists,
  streamObjectAndPersist,
  streamTextAndPersist,
} from "../../repos/chatRepo.ts";
import { myLogger as logger } from "../../utils/logger";

export const chatRouter = router({
  streamText: publicProcedure
    .input(
      z.object({
        project: z.object({ id: z.number(), name: z.string() }),
        stack: z.object({ id: z.string(), name: z.string() }),
        chatId: z.number().optional(),
        question: z.string(),
      }),
    )
    .query(async function* ({ ctx, input }) {
      try {
        const projectId = input?.project?.id ?? DEFAULT_PROJECT_ID;
        const projectName = input?.project?.name ?? DEFAULT_PROJECT_NAME;
        const stackId = input?.stack?.id ?? DEFAULT_STACK_ID;

        // Ensure the project exists or create it
        await ensureProjectExists({
          projectId,
          projectName,
          stackId: Number(stackId)
        });

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
        project: z.object({ id: z.number(), name: z.string() }),
        stack: z.object({ id: z.string(), name: z.string() }),
        chatId: z.number().optional(),
        question: z.string(),
      }),
    )
    .query(async function* ({ ctx, input }) {
      try {
        const projectId = input?.project?.id ?? DEFAULT_PROJECT_ID;
        const projectName = input?.project?.name ?? DEFAULT_PROJECT_NAME;
        const stackId = input?.stack?.id ?? DEFAULT_STACK_ID;

        // Ensure the project exists or create it
        await ensureProjectExists({
          projectId,
          projectName,
          stackId: Number(stackId)
        });


        const chatId =
          input.chatId ??
          (await ensureChat(projectId, input.question.slice(0, 60)));

        yield* streamObjectAndPersist({
          chatId,
          project: input.project,
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
