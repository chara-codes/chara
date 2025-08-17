import { sql } from "drizzle-orm";
import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { chats } from "./chats";

/**
 * Represents individual messages in a chat conversation, storing both user queries
 * and LLM responses.
 *
 * @remarks
 * - Each message belongs to a specific chat conversation
 * - Messages are ordered chronologically by creation timestamp
 * - The role field distinguishes between user messages and LLM responses
 * - Messages maintain the complete conversation history for context
 */

export const messages = sqliteTable(
  "messages",
  {
    /** Unique identifier for the message - compatible with UIMessage.id */
    id: text().primaryKey(),

    /** The message parts as JSON - stores UIMessage.parts array */
    parts: text({ mode: "json" }).notNull(),

    /** Indicates message sender type: 'user', 'assistant', or 'system' */
    role: text().notNull().$type<"user" | "assistant" | "system">(),

    /** Optional metadata as JSON - stores UIMessage.metadata */
    metadata: text({ mode: "json" }),

    /** Commit sha */
    commit: text(),

    /** Timestamp when this message was created */
    createdAt: int("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    /** Timestamp when the message was last updated */
    updatedAt: int("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    /** Foreign key reference to the chat this message belongs to */
    chatId: text()
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
  },
  (table) => ({
    chatIdx: index("idx_messages_chat_id").on(table.chatId),
  })
);
