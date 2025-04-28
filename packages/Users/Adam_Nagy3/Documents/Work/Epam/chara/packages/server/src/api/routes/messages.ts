import { z } from "zod";
import { streamText } from "ai";
import { publicProcedure, router } from "../trpc";

export const messagesRouter = router({
  ask: publicProcedure
    .input(z.object({ question: z.string() }))
    .query(async function* ({ ctx, input }) {
      const { textStream } = streamText({
        messages: [
          {
            role: "system",
            content: "Answer for question in markdown format",
          },
          {
            role: "user",
            content: input.question,
          },
        ],
        model: ctx.ai(process.env.AI_MODEL || "gpt-4o-mini"),
      });
      for await (const textPart of textStream) {
        yield textPart;
      }
    }),
});
