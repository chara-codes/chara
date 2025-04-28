import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { links } from "./links";
import { sql } from "drizzle-orm";

/**
 * Represents segments of content extracted from linked documents.
 * Each chunk contains a portion of text and its vector embedding for semantic search.
 *
 * @remarks
 * - Chunks are created by splitting document content into smaller, meaningful segments
 * - Each chunk is associated with a parent link via linkId
 * - Vector embeddings are used for similarity search across chunks
 */

export const chunks = sqliteTable("chunks", {
  /** Unique identifier for the chunk */
  id: int().primaryKey({
    autoIncrement: true,
  }),
  /** The actual text content of this chunk */
  content: text().notNull(),
  /** Vector embedding of the content, used for semantic similarity search */
  vector: text({ mode: "json" }).notNull().$type<Array<number>>(),
  /** Source URL where this chunk's content originated from */
  url: text().notNull(),
  /** Timestamp when this chunk was created */
  createdAt: int({ mode: "timestamp" }).default(sql`(CURRENT_TIMESTAMP)`),
  /** Foreign key reference to the parent link this chunk belongs to */
  linkId: int()
    .notNull()
    .references(() => links.id),
});
