import type { z } from "zod";
import { type LinkRow, techSchema } from "../dto/stack";
import type { LinkType } from "../types.ts";

export type TechInput = z.infer<typeof techSchema>;

/**
 * Convert UI‑level “tech” objects into Link rows for bulk insert.
 */
export function techsToLinks(techs: TechInput[], stackId: number) {
  return techs
    .flatMap((t) => [
      t.docsUrl && {
        title: t.name,
        url: t.docsUrl,
        kind: "docs" as LinkType,
        stackId,
      },
      t.codeUrl && {
        title: t.name,
        url: t.codeUrl,
        kind: "code" as LinkType,
        stackId,
      },
    ])
    .filter(Boolean) as Omit<LinkRow, "id" | "createdAt">[];
}

/**
 * Fold Link rows back into distinct tech objects for the API layer.
 */
export function linksToTechs(rows: LinkRow[]): TechInput[] {
  const map = new Map<string, TechInput>();

  for (const l of rows) {
    const tech = map.get(l.title) ?? { name: l.title };

    if (l.kind === "code") tech.codeUrl = l.url;
    if (l.kind === "docs") tech.docsUrl = l.url;

    map.set(l.title, tech);
  }
  return [...map.values()];
}
