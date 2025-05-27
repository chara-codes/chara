import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { messageSchema } from "../../dto/chat.ts";
import {
  DEFAULT_PROJECT_ID,
  ensureChat,
  findExistingChat,
  streamObjectAndPersist,
  streamTextAndPersist,
  getHistoryAndPersist,
} from "../../repos/chatRepo.ts";
import { myLogger as logger } from "../../utils/logger";

export const chatRouter = router({
  streamText: publicProcedure
    .input(
      z.object({
        project: z.object({ id: z.number(), name: z.string() }),
        chatId: z.number().optional(),
        question: z.string(),
      }),
    )
    .query(async function* ({ ctx, input }) {
      try {
        const projectId = input?.project?.id ?? DEFAULT_PROJECT_ID;
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
        chatId: z.number().optional(),
        question: z.string(),
      }),
    )
    .query(async function* ({ ctx, input }) {
      try {
        const projectId = input?.project?.id ?? DEFAULT_PROJECT_ID;
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

  getHistory: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        chatId: z.number().optional(),
        lastMessageId: z.string().nullable().optional(),
        limit: z.number().optional(),
      }),
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

        const lastMessageId = input?.lastMessageId
          ? parseInt(input.lastMessageId)
          : null;

        if (lastMessageId && isNaN(lastMessageId)) {
          throw new Error("Invalid lastMessageId");
        }

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
