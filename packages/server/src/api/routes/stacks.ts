import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { db } from "../db";
import { links, stacks } from "../../db/schema";
import { eq, like, sql } from "drizzle-orm";
import { stackTypes } from "../../types";

const techSchema = z.object({
  name: z.string().min(1),
  docsUrl: z.string().url().optional(),
  codeUrl: z.string().url().optional(),
});

const base = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(stackTypes).default("others"),
  technologies: z.array(techSchema).default([]),
});

export const stacksRouter = router({
  /* ---- LIST with embedded tech array ---- */
  list: publicProcedure.query(async () => {
    const rows = await db.query.stacks.findMany({ with: { links: true } });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      description: r.description,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      technologies: linksToTechs(r.links),
    }));
  }),

  /* ---- GET single ---- */
  byId: publicProcedure.input(z.number()).query(async ({ input: id }) => {
    const row = await db.query.stacks.findFirst({
      where: eq(stacks.id, id),
      with: { links: true },
    });
    if (!row) return null;
    return {
      ...row,
      technologies: linksToTechs(row.links),
    };
  }),

  /* ---- CREATE ---- */
  create: publicProcedure.input(base).mutation(async ({ input }) => {
    return db.transaction(async (tx) => {
      const [stack] = await tx
        .insert(stacks)
        .values({
          title: input.title,
          type: input.type,
          description: input.description,
        })
        .returning();
      if (input.technologies.length) {
        await tx
          .insert(links)
          .values(techsToLinks(input.technologies, stack.id))
          .run();
      }
      return {
        ...stack,
        technologies: input.technologies,
      };
    });
  }),

  /* ---- UPDATE (replace link set) ---- */
  update: publicProcedure
    .input(base.extend({ id: z.number() }))
    .mutation(async ({ input: { id, ...data } }) => {
      return db.transaction(async (tx) => {
        /* update main row */
        const [stack] = await tx
          .update(stacks)
          .set({
            title: data.title,
            description: data.description,
            type: data.type,
            updatedAt: new Date(),
          })
          .where(eq(stacks.id, id))
          .returning();

        /* replace links */
        await tx.delete(links).where(eq(links.stackId, id));
        if (data.technologies.length) {
          await tx
            .insert(links)
            .values(techsToLinks(data.technologies, id))
            .run();
        }

        return { ...stack, technologies: data.technologies };
      });
    }),

  /* ---- DELETE ---- */
  remove: publicProcedure.input(z.number()).mutation(async ({ input: id }) => {
    await db.delete(stacks).where(eq(stacks.id, id));
    return { id };
  }),

  /* ---- DUPLICATE (clone links too) ---- */
  duplicate: publicProcedure
    .input(z.number())
    .mutation(async ({ input: id }) => {
      return db.transaction(async (tx) => {
        /* 1. load the source stack + its links */
        const src = await tx.query.stacks.findFirst({
          where: eq(stacks.id, id),
          with: { links: true }, // src.links is an array (possibly empty)
        });
        if (!src) throw new Error("Stack not found");

        /* 2. craft a unique title */
        const base = src.title.replace(/\s\(copy.*?\)$/, "");
        const row = await tx
          .select({ cnt: sql<number>`count(*)` }) // ← alias + typed
          .from(stacks)
          .where(like(stacks.title, `${base} (copy%`))
          .get();

        const n = (row?.cnt ?? 0) + 1;
        const title = n === 1 ? `${base} (copy)` : `${base} (copy ${n})`;

        /* 3. insert the new stack row */
        const [clone] = await tx
          .insert(stacks)
          .values({ title, type: src.type, description: src.description })
          .returning();

        /* 4. clone links (if any) */
        if (src.links?.length) {
          await tx
            .insert(links)
            .values(
              src.links.map((l) => ({
                title: l.title,
                url: l.url,
                stackId: clone.id,
              })),
            )
            .run();
        }

        return {
          ...clone,
          technologies: linksToTechs(src.links ?? []),
        };
      });
    }),
});

function techsToLinks(techs: z.infer<typeof techSchema>[], stackId: number) {
  return techs
    .flatMap((t) => [
      t.docsUrl && { title: t.name, url: t.docsUrl, stackId },
      t.codeUrl && { title: t.name, url: t.codeUrl, stackId },
    ])
    .filter(Boolean) as Omit<typeof links.$inferInsert, "id" | "createdAt">[];
}

function linksToTechs(rows: (typeof links.$inferSelect)[]) {
  const map = new Map<string, z.infer<typeof techSchema>>();
  for (const l of rows) {
    const obj = map.get(l.title) ?? { name: l.title };
    if (/github|gitlab|bitbucket|code/i.test(l.url)) obj.codeUrl = l.url;
    else obj.docsUrl = l.url;
    map.set(l.title, obj);
  }
  return [...map.values()];
}
