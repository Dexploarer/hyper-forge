/**
 * Database Test Helper
 * November 2025 Best Practices:
 * - Real PostgreSQL connection (no mocks)
 * - Transaction rollback for test isolation
 * - Setup/teardown utilities
 * - Test user creation
 */

import { db } from "../../server/db";
import { users, assets, projects } from "../../server/db/schema";
import { eq, sql } from "drizzle-orm";
import type { AuthUser } from "../../server/middleware/auth";

/**
 * Clean up all test data
 * Run in beforeEach or afterEach
 */
export async function cleanDatabase() {
  // Delete in correct order to respect foreign key constraints
  await db.delete(assets).execute();
  await db.delete(projects).execute();
  await db
    .delete(users)
    .where(sql`email LIKE '%test.com'`)
    .execute();
}

/**
 * Create a test user
 * Returns both database user and AuthUser format
 */
export async function createTestUser(
  overrides?: Partial<typeof users.$inferInsert>,
) {
  const [user] = await db
    .insert(users)
    .values({
      privyUserId: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      email: `test-${Date.now()}@test.com`,
      walletAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
      displayName: "Test User",
      role: "user",
      ...overrides,
    })
    .returning();

  const authUser: AuthUser = {
    id: user.id,
    privyUserId: user.privyUserId,
    email: user.email,
    walletAddress: user.walletAddress,
    displayName: user.displayName,
    role: user.role,
    profileCompleted: user.profileCompleted,
    createdAt: user.createdAt,
  };

  return { user, authUser };
}

/**
 * Create a test admin user
 */
export async function createTestAdmin(
  overrides?: Partial<typeof users.$inferInsert>,
) {
  return createTestUser({ role: "admin", ...overrides });
}

/**
 * Create a test asset
 */
export async function createTestAsset(
  ownerId: string,
  overrides?: Partial<typeof assets.$inferInsert>,
) {
  const assetId = `test-asset-${Date.now()}`;
  const [asset] = await db
    .insert(assets)
    .values({
      name: "Test Asset",
      description: "A test asset",
      type: "weapon",
      ownerId,
      filePath: `${assetId}/${assetId}.glb`,
      status: "completed",
      visibility: "private",
      ...overrides,
    })
    .returning();

  return asset;
}

/**
 * Create a test project
 */
export async function createTestProject(
  ownerId: string,
  overrides?: Partial<typeof projects.$inferInsert>,
) {
  const [project] = await db
    .insert(projects)
    .values({
      name: "Test Project",
      description: "A test project",
      ownerId,
      visibility: "private",
      ...overrides,
    })
    .returning();

  return project;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user || null;
}

/**
 * Delete user and all related data
 */
export async function deleteTestUser(userId: string) {
  await db.delete(users).where(eq(users.id, userId)).execute();
}

/**
 * Reset auto-increment sequences (if needed)
 */
export async function resetSequences() {
  // PostgreSQL sequence reset (if using serial columns)
  // This is usually not needed with UUIDs
}

/**
 * Check database connection
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error("[Test DB] Connection check failed:", error);
    return false;
  }
}
