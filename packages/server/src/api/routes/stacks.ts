import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { stacks } from "../../db/schema/stacks";
import { publicProcedure, router } from "../trpc";
import { eq } from "drizzle-orm/expressions";

const stacksInsertSchema = createInsertSchema(stacks);
const stacksUpdateSchema = createUpdateSchema(stacks);

export const stacksRouter = router({
  create: publicProcedure
    .input(stacksInsertSchema)
    .mutation(async ({ ctx, input }) => {
      const stack = await ctx.db.insert(stacks).values(input);
      return { id: Number(stack.lastInsertRowid) };
    }),
  update: publicProcedure
    .input(stacksUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(stacks)
        .set(input)
        .where(eq(stacks.id, Number(input.id)));
      return { id: input.id };
    }),
});
