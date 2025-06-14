import { z } from "zod";
import { stackTypes, stackIconTypes } from "../types.ts";
import { linksToTechs, type TechInput } from "../utils/techLinks";
import { stacks, links, mcp } from "../db/schema";
import { mcpsToStack, type McpInput } from "../utils/mcpUtils";

// ——— Input validation schemas ———
export const linkSchema = z.object({
  url: z.string().url().min(1),
  type: z.string().optional(),
});

export const techSchema = z.object({
  name: z.string().min(1),
  links: z.array(linkSchema).default([]),
});

export const mcpSchema = z.object({
  name: z.string().min(1),
  serverConfig: z.object({
    command: z.string().min(1),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
  }),
});

export const createStackSchema = z.object({
  title: z.string().min(1),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(stackTypes).default("others"),
  icon: z.enum(stackIconTypes).default("code"),
  isNew: z.boolean().default(true),
  popularity: z.number().min(0).max(10).default(0),
  technologies: z.array(techSchema).default([]),
  mcps: z.array(mcpSchema).default([]),
});

export const updateStackSchema = createStackSchema.extend({
  id: z.number(),
});

// ——— DTOs returned to callers ———
export type TechDTO = TechInput;
export type McpDTO = McpInput;
export type StackRow = typeof stacks.$inferSelect;
export type LinkRow = typeof links.$inferSelect;
export type McpRow = typeof mcp.$inferSelect;

export type StackDTO = Omit<StackRow, "type"> & {
  type: (typeof stackTypes)[number];
  isNew: boolean;
  popularity: number;
  technologies: TechDTO[];
  mcps: McpDTO[];
};

/**
 * Map a joined row (stack + links + mcp) into the API DTO.
 */
export function toStackDTO(
  row: StackRow & { links?: LinkRow[]; mcps?: McpRow[] },
): StackDTO {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    shortDescription: row.shortDescription,
    description: row.description,
    icon: row.icon,
    isNew: row.isNew,
    popularity: row.popularity,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    technologies: linksToTechs(row.links ?? []),
    mcps: mcpsToStack(row.mcps ?? []),
  };
}
