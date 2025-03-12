import { streamObject, streamText } from "ai";
import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const chatRouter = router({
  streamText: publicProcedure
    .input(z.object({ question: z.string() }))
    .query(async function* ({ ctx, input }) {
      const { textStream } = streamText({
        messages: [
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
  agents: publicProcedure
    .input(z.object({ question: z.string() }))
    .query(async function* ({ ctx }) {
      const { partialObjectStream } = streamObject({
        model: ctx.ai("gpt-4-turbo"),
        schema: z.object({
          recipe: z.object({
            name: z.string(),
            ingredients: z.array(z.string()),
            steps: z.array(z.string()),
          }),
        }),
        prompt: "Generate a lasagna recipe.",
      });

      for await (const partialObject of partialObjectStream) {
        yield partialObject;
      }
    }),
});
