import "dotenv/config";
import { Database } from "bun:sqlite";
import {
  generateSQLiteDrizzleJson,
  generateSQLiteMigration,
} from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../db/schema";

const dbFileName =
  process.env.DATABASE_URL?.replace("file:", "") || ".chara/chara.db";

async function initializeDatabase() {
  try {
    const dbFile = Bun.file(dbFileName);

    if (!(await dbFile.exists())) {
      await Bun.write(dbFileName, "");
      const db = new Database(dbFileName, { create: true });

      const [previous, current] = await Promise.all(
        [{}, schema].map((schemaObject) =>
          generateSQLiteDrizzleJson(schemaObject)
        )
      );

      const statements = await generateSQLiteMigration(previous, current);
      const migration = statements.join("\n");
      db.exec(migration);
      db.close();
    }
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

// Initialize database on module load but handle errors gracefully
initializeDatabase().catch((error) => {
  console.error("Failed to initialize database:", error);
});

export const db = drizzle({
  client: new Database(dbFileName),
  schema,
});
