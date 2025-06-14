import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { stackIconTypes, stackTypes } from "../../types.ts";
import { relations } from "drizzle-orm";
import { links } from "./links";
import { mcp } from "./mcp";

export const stacks = sqliteTable("stacks", {
  /** Unique identifier for the technology stack */
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Name of the technology stack */
  title: text("title").notNull(),
  /** Stack type */
  type: text("type", { enum: stackTypes }).notNull().default("others"),
  /** Short description of the technology stack */
  shortDescription: text("shortDescription"),
  /** Detailed description of the technology stack and its components */
  description: text("description"),
  /** Tech stack icon */
  icon: text("icon", { enum: stackIconTypes }).notNull().default("code"),
  /** Indicates if the stack is new */
  isNew: integer("is_new", { mode: "boolean" }).notNull().default(true),
  /** Stack popularity rating */
  popularity: integer("popularity").notNull().default(0),
  /** Timestamp when the stack entry was created */
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  /** Timestamp when the stack entry was last updated */
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const stacksToOtherRelations = relations(stacks, ({ many }) => ({
  links: many(links),
  mcps: many(mcp),
}));
