import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { myLogger as logger } from "../../utils/logger";
import { createStackSchema, updateStackSchema } from "../../dto/stack.ts";
import * as repo from "../../repos/stackRepo.ts";
import { TRPCError } from "@trpc/server";

export const stacksRouter = router({
  list: publicProcedure.query(async () => repo.listWithLinks()),

  byId: publicProcedure.input(z.number()).query(async ({ input }) => {
    const row = await repo.findById(input);
    if (!row) throw new TRPCError({ code: "NOT_FOUND" });
    return row;
  }),

  create: publicProcedure
    .input(createStackSchema)
    .mutation(async ({ input }) => repo.create(input)),

  update: publicProcedure
    .input(updateStackSchema)
    .mutation(async ({ input }) => repo.update(input)),

  remove: publicProcedure.input(z.number()).mutation(async ({ input }) => {
    await repo.remove(input);
    return { id: input };
  }),

  duplicate: publicProcedure.input(z.number()).mutation(async ({ input }) => {
    try {
      return await repo.duplicate(input);
    } catch (err) {
      logger.error("Duplicate failed", { err, id: input });
      if (err instanceof repo.StackNotFoundError) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),
});
