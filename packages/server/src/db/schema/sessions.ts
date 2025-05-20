import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Represents user sessions in the system.
 * Stores anonymous session data with randomly generated usernames.
 */
export const sessions = sqliteTable("sessions", {
  /** Unique identifier for the session */
  id: text("id").primaryKey(),
  /** Generated fun username for the session */
  username: text("username").notNull(),
  /** Last time the session was accessed */
  lastAccessed: integer("last_accessed", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  /** When the session was created */
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
