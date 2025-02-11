import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { stacksRouter } from "./stacks";
import { linksRouter } from "./links";

export const appRouter = router({
  stacks: stacksRouter,
  lnks: linksRouter,

  // test are public procedures & routes
  a: router({
    test: publicProcedure.query(async () => {
      return "A test! 👋";
    }),
    exec: publicProcedure.input(z.string()).mutation(({ input }) => {
      return `Input ${input}`;
    }),
  }),
  hello: publicProcedure.query(async () => {
    return "Hi! 👋";
  }),
  test: publicProcedure
    .input(
      z.object({
        test: z.string(),
        zz: z.number(),
      }),
    )
    .query(async ({ input }) => {
      return `Test! 👋 ${JSON.stringify(input)}`;
    }),
});

export type AppRouter = typeof appRouter;
