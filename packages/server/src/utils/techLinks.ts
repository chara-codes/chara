import type { z } from "zod";
import { type LinkRow, techSchema } from "../dto/stack";

export type TechInput = z.infer<typeof techSchema>;

/**
 * Convert UI‑level “tech” objects into Link rows for bulk insert.
 */
export function techsToLinks(techs: TechInput[], stackId: number) {
  return techs
    .flatMap((tech) =>
      tech.links.map((link) => ({
        title: tech.name,
        url: link.url,
        description: link.type,
        stackId,
      })),
    )
    .filter(Boolean) as Omit<LinkRow, "id" | "createdAt">[];
}

/**
 * Fold Link rows back into distinct tech objects for the API layer.
 */
export function linksToTechs(rows: LinkRow[]): TechInput[] {
  const map = new Map<string, TechInput>();

  for (const link of rows) {
    const tech = map.get(link.title) ?? {
      name: link.title,
      links: [],
    };

    tech.links.push({
      url: link.url,
      type: link.description || undefined,
    });

    map.set(link.title, tech);
  }

  return [...map.values()];
}
