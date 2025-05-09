import { z } from "zod";
import { stackTypes } from "../types.ts";
import { linksToTechs, type TechInput } from "../utils/techLinks";
import { stacks, links } from "../db/schema";

// ——— Input validation schemas ———
export const techSchema = z.object({
  name: z.string().min(1),
  docsUrl: z.string().url().optional(),
  codeUrl: z.string().url().optional(),
});

export const createStackSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(stackTypes).default("others"),
  technologies: z.array(techSchema).default([]),
});

export const updateStackSchema = createStackSchema.extend({
  id: z.number(),
});

// ——— DTOs returned to callers ———
export type TechDTO = TechInput;
export type StackRow = typeof stacks.$inferSelect;
export type LinkRow = typeof links.$inferSelect;

export type StackDTO = Omit<StackRow, "type"> & {
  type: (typeof stackTypes)[number];
  technologies: TechDTO[];
};

/**
 * Map a joined row (stack + links) into the API DTO.
 */
export function toStackDTO(row: StackRow & { links: LinkRow[] }): StackDTO {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    technologies: linksToTechs(row.links),
  };
}
