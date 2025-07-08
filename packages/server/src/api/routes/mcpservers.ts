import { publicProcedure } from "../trpc";
import { z } from "zod";
import { observable } from "@trpc/server/observable";
import { logger } from "@chara-codes/logger";

type EmitFunction = (data: {
  instructionId: string;
  command: string;
  params: string;
}) => void;
const clients: Record<string, EmitFunction> = {};

// Map to store pending response resolvers
const pendingResponses = new Map<string, (result: string) => void>();

// Export to allow server functions to access clients and response queue
export const trpcMCPCalls = { clients, pendingResponses };

export const mcpClientsSubscriptions = publicProcedure
  .input(z.object({ clientId: z.string() }))
  .subscription(({ input }) => {
    return observable<{
      instructionId: string;
      command: string;
      params: string;
    }>((emit) => {
      clients[input.clientId] = (data) => emit.next(data);

      return () => {
        delete clients[input.clientId];
      };
    });
  });

export const mcpClientsMutations = publicProcedure
  .input(
    z.object({
      clientId: z.string(),
      instructionId: z.string(),
      result: z.string(),
    })
  )
  .mutation(({ input }) => {
    const resolver = pendingResponses.get(input.instructionId);
    if (resolver) {
      resolver(input.result);
      pendingResponses.delete(input.instructionId);
    }
    return { ok: true };
  });
