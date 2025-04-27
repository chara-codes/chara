import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { stackTypes } from "../../types.ts";

/**
 * Represents technology stacks used in projects.
 *
 * A stack is a collection of technologies, frameworks, libraries, or tools
 * that are used together in a project. This table stores information about
 * these technology combinations, including their names and descriptions.
 */

export const stacks = sqliteTable("stacks", {
  /** Unique identifier for the technology stack */
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Name of the technology stack (e.g.\, \`MERN\`, \`LAMP\`, \`JAMstack\`) */
  title: text("title").notNull(),
  /** Stack type (e.g.\, \`frontend\`, \`backend\`, \`mobile\`) */
  type: text("type", { enum: stackTypes }).notNull().default("others"),
  /** Detailed description of the technology stack and its components */
  description: text("description"),
  /** Timestamp when the stack entry was created */
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  /** Timestamp when the stack entry was last updated */
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
