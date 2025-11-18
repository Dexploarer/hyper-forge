/**
 * Row Level Security (RLS) Plugin
 * Sets the current user context in PostgreSQL for RLS policies
 */

import { Elysia } from "elysia";
import { db } from "../db/db";
import { sql } from "drizzle-orm";
import { logger } from "../utils/logger";

/**
 * RLS Plugin - Sets PostgreSQL session variable for RLS policies
 *
 * This plugin must be applied AFTER authentication middleware
 * It sets the `app.current_user_id` session variable that RLS policies use
 */
export const rlsPlugin = new Elysia({ name: "rls" }).derive(async (context) => {
  // Get authenticated user from context (set by auth middleware)
  const user = (context as any).user;

  // Set PostgreSQL session variable for RLS
  if (user?.id) {
    try {
      // Set the current user ID for this database session
      await db.execute(
        sql`SELECT set_config('app.current_user_id', ${user.id}::text, false)`,
      );

      logger.debug(
        { userId: user.id },
        "[RLS] Set current user context for request",
      );
    } catch (error) {
      logger.error(
        { err: error, userId: user.id },
        "[RLS] Failed to set user context",
      );
      // Don't throw - allow request to continue but log the error
      // RLS policies will deny access if context isn't set
    }
  } else {
    // No authenticated user - RLS will deny access to protected resources
    logger.debug("[RLS] No authenticated user, RLS policies will apply");
  }

  return {};
});

/**
 * Clear RLS context (useful for tests or cleanup)
 */
export async function clearRLSContext() {
  try {
    await db.execute(sql`SELECT set_config('app.current_user_id', '', false)`);
  } catch (error) {
    logger.warn({ err: error }, "[RLS] Failed to clear user context");
  }
}
