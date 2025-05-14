import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { publicProcedure, router } from "../trpc";
import { eq } from "drizzle-orm";
import { links } from "../../db/schema/links";
import { z } from "zod";

const linksInsertSchema = createInsertSchema(links);
const linksUpdateSchema = createUpdateSchema(links);

export const linksRouter = router({
  add: publicProcedure
    .input(linksInsertSchema)
    .mutation(async ({ ctx, input }) => {
      const link = await ctx.db.insert(links).values(input);
      return { id: Number(link.lastInsertRowid) };
    }),
  update: publicProcedure
    .input(linksUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(links)
        .set(input)
        .where(eq(links.id, Number(input.id)));
      return { id: input.id };
    }),
  delete: publicProcedure.input(z.number()).mutation(async ({ input, ctx }) => {
    await ctx.db.delete(links).where(eq(links.id, input));
    return { id: input };
  }),
});
