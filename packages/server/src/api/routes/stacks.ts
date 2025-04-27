import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { db } from "../db";
import { stacks } from "../../db/schema";
import { desc, eq, like } from "drizzle-orm";

const base = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

export const stacksRouter = router({
  list: publicProcedure.query(async () => {
    return db.select().from(stacks).orderBy(desc(stacks.createdAt));
  }),

  byId: publicProcedure
    .input(z.number())
    .query(({ input: id }) =>
      db.select().from(stacks).where(eq(stacks.id, id)).get(),
    ),

  create: publicProcedure.input(base).mutation(async ({ input }) => {
    const [row] = await db.insert(stacks).values(input).returning();
    return row;
  }),

  update: publicProcedure
    .input(base.extend({ id: z.number() }))
    .mutation(async ({ input: { id, ...data } }) => {
      const [row] = await db
        .update(stacks)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(stacks.id, id))
        .returning();
      return row;
    }),

  remove: publicProcedure.input(z.number()).mutation(async ({ input: id }) => {
    await db.delete(stacks).where(eq(stacks.id, id));
    return { id };
  }),

  duplicate: publicProcedure
    .input(z.number())
    .mutation(async ({ input: id }) => {
      // load the source record
      const source = await db
        .select()
        .from(stacks)
        .where(eq(stacks.id, id))
        .get();

      if (!source) throw new Error("Stack not found");

      // craft a unique title: "Title (copy)", "Title (copy 2)", …
      const base = source.title.replace(/\s\(copy.*?\)$/, "");
      const siblings = await db
        .select({ count: stacks.id })
        .from(stacks)
        .where(like(stacks.title, `${base} (copy%`))
        .get();
      const suffix = siblings?.count
        ? ` (copy ${siblings.count + 1})`
        : " (copy)";
      const title = `${base}${suffix}`;

      // insert the clone; createdAt/updatedAt default to NOW
      const [row] = await db
        .insert(stacks)
        .values({
          title,
          description: source.description,
        })
        .returning();

      return row;
    }),
});
