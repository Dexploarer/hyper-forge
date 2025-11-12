import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function checkTables() {
  try {
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('achievements', 'user_achievements')
      ORDER BY table_name;
    `);

    console.log("Tables found:", result.rows);

    if (result.rows.length === 0) {
      console.log("⚠️  No achievements tables found in database");
    } else {
      console.log("✓ Achievements tables exist");
    }
  } catch (error) {
    console.error("Error checking tables:", error);
  } finally {
    process.exit(0);
  }
}

checkTables();
