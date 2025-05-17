import { z } from "zod";

// Custom schema for session data that properly
export const sessionSchema = z.object({
  id: z.string(),
  username: z.string(),
  createdAt: z.number().or(z.date()),
  lastAccessed: z.number().or(z.date())
});

export type SessionDTO = {
  id: string;
  username: string;
  createdAt: Date;
  lastAccessed: Date;
};

export function toSessionDTO(data: unknown): SessionDTO {
  const raw = sessionSchema.parse(data);
  return {
    id: raw.id,
    username: raw.username,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt : new Date(raw.createdAt),
    lastAccessed: raw.lastAccessed instanceof Date ? raw.lastAccessed : new Date(raw.lastAccessed)
  };
}
