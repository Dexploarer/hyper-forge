/**
 * Drizzle Kit Configuration
 * Auto-generates SQL migrations from TypeScript schema
 * Note: Bun auto-loads .env files, no dotenv needed
 */

import type { Config } from "drizzle-kit";

export default {
  schema: "./server/db/schema/index.ts",
  out: "./server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
