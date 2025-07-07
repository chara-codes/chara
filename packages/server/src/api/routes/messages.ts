import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { DEFAULT_PROJECT_ID, ensureChat } from "../../repos/chatRepo.ts";
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
    .subscription(async function* ({ input }) {
      try {
        const projectId = input.projectId ?? DEFAULT_PROJECT_ID;
        await ensureChat(projectId, input.question.slice(0, 60));

        // Return a simple message indicating AI functionality has been removed
        yield "AI functionality has been removed from the server. This endpoint no longer provides AI-powered responses.";
      } catch (err) {
        logger.error(JSON.stringify(err), "messages.ask endpoint failed");
        throw err;
      }
    }),
});
