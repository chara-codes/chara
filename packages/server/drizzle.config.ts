import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema/",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: `./${process.env.DB_FILE}`,
  },
  verbose: true,
  strict: true,
});
