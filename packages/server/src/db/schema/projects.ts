import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { stacks } from "./stacks";

/**
 * Represents project instances created from stacks.
 * Projects serve as containers for related chat conversations about a specific stack's content.
 * 
 * @remarks
 * - Each project is associated with a specific stack (collection of links)
 * - Projects can contain multiple chat conversations
 * - Projects help organize conversations around specific topics or resources
 * - Projects inherit context from their associated stack's content
 */

export const projects = sqliteTable("projects", {
  /** Unique identifier for the project */
  id: int().primaryKey({
    autoIncrement: true,
  }),
  /** Display name of the project */
  name: text().notNull(),
  /** Timestamp when this project was created */
  createdAt: int("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  /** Foreign key reference to the stack this project is based on */
  stackId: int()
    .notNull()
    .references(() => stacks.id),
});
