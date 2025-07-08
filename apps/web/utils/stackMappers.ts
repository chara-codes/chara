import { Technology, TechStack } from "@/types";
import { StackType } from "@apk/server";

export const serverToClient = (row: {
  id: number;
  title: string;
  description: string | null;
  technologies: Technology[];
  type: StackType;
}): TechStack => ({
  id: String(row.id),
  name: row.title,
  description: row.description ?? "",
  type: row.type,
  technologies: row.technologies,
});

export const clientToInsert = (s: Omit<TechStack, "id">) => ({
  title: s.name,
  description: s.description,
  type: s.type,
  technologies: s.technologies,
});

export const clientToUpdate = (s: TechStack) => ({
  id: Number(s.id),
  title: s.name,
  description: s.description,
  type: s.type,
  technologies: s.technologies,
});

export function matchStack(stack: TechStack, search: string, type: StackType) {
  const typeOk = type === "all" || stack.type === type;
  const searchTrim = search.trim().toLowerCase();
  const searchOk =
    searchTrim === "" || stack.name.toLowerCase().includes(searchTrim);
  return typeOk && searchOk;
}
