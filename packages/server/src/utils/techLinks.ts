import type { z } from "zod";
import { type LinkRow, linkSchema } from "../dto/stack";

export type TechInput = z.infer<typeof linkSchema>;

/**
 * Convert UI‑level “tech” objects into Link rows for bulk insert.
 */
export function techsToLinks(links: TechInput[], stackId: number) {
  return links.map(({ title, description, url }) => ({
    title,
    description: description ?? null,
    url,
    stackId,
  })) as Omit<LinkRow, "id" | "createdAt">[];
}

/**
 * Fold Link rows back into distinct tech objects for the API layer.
 */
export function linksToTechs(rows: LinkRow[]): TechInput[] {
  return rows.map(({ title, description, url }) => ({
    title,
    description: description ?? undefined,
    url,
  }));
}
