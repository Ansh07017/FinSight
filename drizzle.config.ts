import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.PG_CONNECTION_STRING) {
  throw new Error("PG_CONNECTION_STRING is missing in .env");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.PG_CONNECTION_STRING,
    ssl: {
      rejectUnauthorized: false
    }
  },
});