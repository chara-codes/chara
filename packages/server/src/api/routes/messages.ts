import { z } from "zod";
import { streamText } from 'ai'
import { publicProcedure, router } from "../trpc";
import { red } from "picocolors";
import { selectAIProvider } from "../../utils/select-ai-provider";
import { openai } from "@ai-sdk/openai";

export const messagesRouter = router({
  ask: publicProcedure.input(z.string()).query(async function* ({ ctx, input }) {
    const { textStream } = streamText({
      messages: [{
        role: 'user',
        content: input,
      }],
      model: ctx.ai(process.env.AI_MODEL || 'gpt-4o-mini')
    });
    for await (const textPart of textStream) {
      yield textPart
    }
  }),
})
