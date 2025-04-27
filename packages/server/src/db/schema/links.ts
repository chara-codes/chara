import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { stacks } from "./stacks";
import { relations, sql } from "drizzle-orm";

/**
 * Represents web links/URLs that have been saved to stacks.
 * Links are the primary content items that can be scanned and processed into chunks.
 *
 * @remarks
 * - Each link belongs to a specific stack (collection)
 * - Links track when they were created and last scanned for content
 * - Links provide the source URLs for content chunking and processing
 */

export const links = sqliteTable("links", {
  /** Unique identifier for the link */
  id: int().primaryKey({
    autoIncrement: true,
  }),
  /** Display title for the linked content */
  title: text().notNull(),
  /** The complete URL pointing to the linked content */
  url: text().unique().notNull(),
  /** Timestamp when this link was created */
  createdAt: int({ mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  /** Timestamp of when the link was last scanned for content processing */
  scannedAt: int({ mode: "timestamp" }),
  /** Foreign key reference to the stack this link belongs to */
  stackId: int()
    .notNull()
    .references(() => stacks.id, { onDelete: "cascade" }),
});

export const stacksRelations = relations(stacks, ({ many }) => ({
  links: many(links),
}));
export const linksRelations = relations(links, ({ one }) => ({
  stack: one(stacks, {
    fields: [links.stackId],
    references: [stacks.id],
  }),
}));
