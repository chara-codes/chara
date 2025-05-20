import { publicProcedure, router } from "../trpc";
import { sessions } from "../../db/schema/sessions";
import { generateUsername } from "../../utils/username";
import { toSessionDTO } from "../../dto/session";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

export const sessionRouter = router({
  // Initialize or retrieve a session
  getOrCreate: publicProcedure
    .input(z.object({ sessionId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (input.sessionId) {
        // Try to find existing session
        const existingSessionArr = await ctx.db
          .select()
          .from(sessions)
          .where(eq(sessions.id, input.sessionId));

        const existingSession = existingSessionArr[0];

        if (existingSession) {
          // Update last accessed time
          await ctx.db
            .update(sessions)
            .set({ lastAccessed: new Date() })
            .where(eq(sessions.id, input.sessionId));

          return toSessionDTO(existingSession);
        }
      }

      // Create new session
      const now = new Date();
      const sessionId = nanoid();
      const newSession = {
        id: sessionId,
        username: generateUsername(),
        lastAccessed: now,
        createdAt: now
      };

      await ctx.db.insert(sessions).values(newSession);
      
      return toSessionDTO(newSession);
    }),
});
