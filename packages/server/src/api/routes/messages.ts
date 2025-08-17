import { z } from "zod";
import { ensureChat } from "../../repos/chatRepo-legacy.ts";
import { logger } from "../../utils/logger";
import { publicProcedure, router } from "../trpc";

export const messagesRouter = router({
  ask: publicProcedure
    .input(
      z.object({
        chatId: z.number().optional(),
        question: z.string(),
      })
    )
    .subscription(async function* ({ input }) {
      try {
        await ensureChat(input.question.slice(0, 60));

        // Return a simple message indicating AI functionality has been removed
        yield "AI functionality has been removed from the server. This endpoint no longer provides AI-powered responses.";
      } catch (err) {
        logger.error(JSON.stringify(err), "messages.ask endpoint failed");
        throw err;
      }
    }),
});
