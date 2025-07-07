import "dotenv/config";

import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../db/schema";

const dbFileName =
  process.env.DATABASE_URL?.replace("file:", "") || ".chara/chara.db";

const dbFile = Bun.file(dbFileName);

if (!(await dbFile.exists())) {
  await Bun.write(dbFileName, "");
}

export const db = drizzle({
  connection: {
    url: String(process.env.DATABASE_URL || "file:.chara/chara.db"),
    authToken: String(process.env.DATABASE_AUTH_TOKEN),
  },
  schema,
});
