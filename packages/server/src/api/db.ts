import "dotenv/config";

import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../db/schema";

export const db = drizzle({
  connection: {
    url: String(process.env.DATABASE_URL),
    authToken: String(process.env.DATABASE_AUTH_TOKEN),
  },
  schema,
});
