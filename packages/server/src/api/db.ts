import "dotenv/config";
import { sql } from "drizzle-orm";

import { drizzle } from "drizzle-orm/libsql";

export const db = drizzle({
  connection: {
    url: String(process.env.DATABASE_URL),
    authToken: String(process.env.DATABASE_AUTH_TOKEN),
  },
});
