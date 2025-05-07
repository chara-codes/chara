import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema/",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: String(process.env.DATABASE_URL),
  },
  verbose: true,
  strict: true,
});
