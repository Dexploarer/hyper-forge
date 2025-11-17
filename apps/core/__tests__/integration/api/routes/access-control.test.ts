/**
 * Access Control Integration Tests
 * Tests visibility-based authorization for assets (private/public)
 * Uses real database and authentication - NO MOCKS
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import { db } from "../../../../server/db";
import { assets, users } from "../../../../server/db/schema";
import { eq } from "drizzle-orm";
import type { AuthUser } from "../../../../server/middleware/auth";
import {
  canViewAsset,
  canModifyAsset,
  canPublishAsset,
  getAssetFromPath,
} from "../../../../server/middleware/assetAuth";

describe("Access Control - Visibility System", () => {
  let testUser1: typeof users.$inferSelect;
  let testUser2: typeof users.$inferSelect;
  let adminUser: typeof users.$inferSelect;
  let publicAsset: typeof assets.$inferSelect;
  let privateAsset: typeof assets.$inferSelect;

  beforeAll(async () => {
    // Create test users
    const [user1] = await db
      .insert(users)
      .values({
        privyUserId: "test-user-1",
        email: "user1@test.com",
        walletAddress: "0xUser1",
        displayName: "Test User 1",
        role: "member",
      })
      .returning();
    testUser1 = user1;

    const [user2] = await db
      .insert(users)
      .values({
        privyUserId: "test-user-2",
        email: "user2@test.com",
        walletAddress: "0xUser2",
        displayName: "Test User 2",
        role: "member",
      })
      .returning();
    testUser2 = user2;

    const [admin] = await db
      .insert(users)
      .values({
        privyUserId: "test-admin",
        email: "admin@test.com",
        walletAddress: "0xAdmin",
        displayName: "Test Admin",
        role: "admin",
      })
      .returning();
    adminUser = admin;
  });

  beforeEach(async () => {
    // Create test assets before each test
    const [pubAsset] = await db
      .insert(assets)
      .values({
        name: "Public Sword",
        description: "A public test asset",
        type: "weapon",
        ownerId: testUser1.id,
        filePath: "public-sword/public-sword.glb",
        status: "completed",
        visibility: "public", // PUBLIC
      })
      .returning();
    publicAsset = pubAsset;

    const [privAsset] = await db
      .insert(assets)
      .values({
        name: "Private Armor",
        description: "A private test asset",
        type: "armor",
        ownerId: testUser1.id,
        filePath: "private-armor/private-armor.glb",
        status: "completed",
        visibility: "private", // PRIVATE
      })
      .returning();
    privateAsset = privAsset;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(assets).where(eq(assets.ownerId, testUser1.id));
    await db.delete(users).where(eq(users.id, testUser1.id));
    await db.delete(users).where(eq(users.id, testUser2.id));
    await db.delete(users).where(eq(users.id, adminUser.id));
  });

  describe("canViewAsset - Public Assets", () => {
    it("should allow unauthenticated users to view public assets", () => {
      const canView = canViewAsset(publicAsset, undefined);
      expect(canView).toBe(true);
    });

    it("should allow authenticated users to view public assets", () => {
      const authUser: AuthUser = {
        id: testUser2.id,
        privyUserId: testUser2.privyUserId,
        email: testUser2.email,
        walletAddress: testUser2.walletAddress,
        displayName: testUser2.displayName,
        role: testUser2.role,
        profileCompleted: testUser2.profileCompleted,
        createdAt: testUser2.createdAt,
      };

      const canView = canViewAsset(publicAsset, authUser);
      expect(canView).toBe(true);
    });

    it("should allow owner to view their own public assets", () => {
      const authUser: AuthUser = {
        id: testUser1.id,
        privyUserId: testUser1.privyUserId,
        email: testUser1.email,
        walletAddress: testUser1.walletAddress,
        displayName: testUser1.displayName,
        role: testUser1.role,
        profileCompleted: testUser1.profileCompleted,
        createdAt: testUser1.createdAt,
      };

      const canView = canViewAsset(publicAsset, authUser);
      expect(canView).toBe(true);
    });
  });

  describe("canViewAsset - Private Assets", () => {
    it("should NOT allow unauthenticated users to view private assets", () => {
      const canView = canViewAsset(privateAsset, undefined);
      expect(canView).toBe(false);
    });

    it("should NOT allow other users to view private assets", () => {
      const authUser: AuthUser = {
        id: testUser2.id,
        privyUserId: testUser2.privyUserId,
        email: testUser2.email,
        walletAddress: testUser2.walletAddress,
        displayName: testUser2.displayName,
        role: testUser2.role,
        profileCompleted: testUser2.profileCompleted,
        createdAt: testUser2.createdAt,
      };

      const canView = canViewAsset(privateAsset, authUser);
      expect(canView).toBe(false);
    });

    it("should allow owner to view their own private assets", () => {
      const authUser: AuthUser = {
        id: testUser1.id,
        privyUserId: testUser1.privyUserId,
        email: testUser1.email,
        walletAddress: testUser1.walletAddress,
        displayName: testUser1.displayName,
        role: testUser1.role,
        profileCompleted: testUser1.profileCompleted,
        createdAt: testUser1.createdAt,
      };

      const canView = canViewAsset(privateAsset, authUser);
      expect(canView).toBe(true);
    });

    it("should allow admins to view all private assets", () => {
      const authUser: AuthUser = {
        id: adminUser.id,
        privyUserId: adminUser.privyUserId,
        email: adminUser.email,
        walletAddress: adminUser.walletAddress,
        displayName: adminUser.displayName,
        role: adminUser.role,
        profileCompleted: adminUser.profileCompleted,
        createdAt: adminUser.createdAt,
      };

      const canView = canViewAsset(privateAsset, authUser);
      expect(canView).toBe(true);
    });
  });

  describe("canModifyAsset - Public Assets", () => {
    it("should NOT allow unauthenticated users to modify public assets", () => {
      const canModify = canModifyAsset(publicAsset, undefined);
      expect(canModify).toBe(false);
    });

    it("should NOT allow other users to modify public assets", () => {
      const authUser: AuthUser = {
        id: testUser2.id,
        privyUserId: testUser2.privyUserId,
        email: testUser2.email,
        walletAddress: testUser2.walletAddress,
        displayName: testUser2.displayName,
        role: testUser2.role,
        profileCompleted: testUser2.profileCompleted,
        createdAt: testUser2.createdAt,
      };

      const canModify = canModifyAsset(publicAsset, authUser);
      expect(canModify).toBe(false);
    });

    it("should allow owner to modify their own public assets", () => {
      const authUser: AuthUser = {
        id: testUser1.id,
        privyUserId: testUser1.privyUserId,
        email: testUser1.email,
        walletAddress: testUser1.walletAddress,
        displayName: testUser1.displayName,
        role: testUser1.role,
        profileCompleted: testUser1.profileCompleted,
        createdAt: testUser1.createdAt,
      };

      const canModify = canModifyAsset(publicAsset, authUser);
      expect(canModify).toBe(true);
    });

    it("should allow admins to modify any public assets", () => {
      const authUser: AuthUser = {
        id: adminUser.id,
        privyUserId: adminUser.privyUserId,
        email: adminUser.email,
        walletAddress: adminUser.walletAddress,
        displayName: adminUser.displayName,
        role: adminUser.role,
        profileCompleted: adminUser.profileCompleted,
        createdAt: adminUser.createdAt,
      };

      const canModify = canModifyAsset(publicAsset, authUser);
      expect(canModify).toBe(true);
    });
  });

  describe("canModifyAsset - Private Assets", () => {
    it("should NOT allow unauthenticated users to modify private assets", () => {
      const canModify = canModifyAsset(privateAsset, undefined);
      expect(canModify).toBe(false);
    });

    it("should NOT allow other users to modify private assets", () => {
      const authUser: AuthUser = {
        id: testUser2.id,
        privyUserId: testUser2.privyUserId,
        email: testUser2.email,
        walletAddress: testUser2.walletAddress,
        displayName: testUser2.displayName,
        role: testUser2.role,
        profileCompleted: testUser2.profileCompleted,
        createdAt: testUser2.createdAt,
      };

      const canModify = canModifyAsset(privateAsset, authUser);
      expect(canModify).toBe(false);
    });

    it("should allow owner to modify their own private assets", () => {
      const authUser: AuthUser = {
        id: testUser1.id,
        privyUserId: testUser1.privyUserId,
        email: testUser1.email,
        walletAddress: testUser1.walletAddress,
        displayName: testUser1.displayName,
        role: testUser1.role,
        profileCompleted: testUser1.profileCompleted,
        createdAt: testUser1.createdAt,
      };

      const canModify = canModifyAsset(privateAsset, authUser);
      expect(canModify).toBe(true);
    });

    it("should allow admins to modify any private assets", () => {
      const authUser: AuthUser = {
        id: adminUser.id,
        privyUserId: adminUser.privyUserId,
        email: adminUser.email,
        walletAddress: adminUser.walletAddress,
        displayName: adminUser.displayName,
        role: adminUser.role,
        profileCompleted: adminUser.profileCompleted,
        createdAt: adminUser.createdAt,
      };

      const canModify = canModifyAsset(privateAsset, authUser);
      expect(canModify).toBe(true);
    });
  });

  describe("canPublishAsset", () => {
    it("should use same logic as canModifyAsset", () => {
      const ownerAuth: AuthUser = {
        id: testUser1.id,
        privyUserId: testUser1.privyUserId,
        email: testUser1.email,
        walletAddress: testUser1.walletAddress,
        displayName: testUser1.displayName,
        role: testUser1.role,
        profileCompleted: testUser1.profileCompleted,
        createdAt: testUser1.createdAt,
      };

      const otherAuth: AuthUser = {
        id: testUser2.id,
        privyUserId: testUser2.privyUserId,
        email: testUser2.email,
        walletAddress: testUser2.walletAddress,
        displayName: testUser2.displayName,
        role: testUser2.role,
        profileCompleted: testUser2.profileCompleted,
        createdAt: testUser2.createdAt,
      };

      // Owner can publish
      expect(canPublishAsset(publicAsset, ownerAuth)).toBe(true);
      expect(canPublishAsset(privateAsset, ownerAuth)).toBe(true);

      // Other users cannot publish
      expect(canPublishAsset(publicAsset, otherAuth)).toBe(false);
      expect(canPublishAsset(privateAsset, otherAuth)).toBe(false);

      // Unauthenticated cannot publish
      expect(canPublishAsset(publicAsset, undefined)).toBe(false);
      expect(canPublishAsset(privateAsset, undefined)).toBe(false);
    });
  });

  describe("getAssetFromPath - Database Integration", () => {
    it("should retrieve asset by extracting asset ID from file path", async () => {
      const asset = await getAssetFromPath("public-sword");
      expect(asset).not.toBeNull();
      expect(asset?.name).toBe("Public Sword");
      expect(asset?.visibility).toBe("public");
    });

    it("should return null for non-existent assets", async () => {
      const asset = await getAssetFromPath("non-existent-asset");
      expect(asset).toBeNull();
    });

    it("should retrieve private assets from database", async () => {
      const asset = await getAssetFromPath("private-armor");
      expect(asset).not.toBeNull();
      expect(asset?.name).toBe("Private Armor");
      expect(asset?.visibility).toBe("private");
    });
  });

  describe("Complete Access Control Scenarios", () => {
    it("should enforce complete workflow: public asset, any viewer", async () => {
      // Get asset from database
      const asset = await getAssetFromPath("public-sword");
      expect(asset).not.toBeNull();

      // Unauthenticated user can view
      expect(canViewAsset(asset!, undefined)).toBe(true);

      // Unauthenticated user cannot modify
      expect(canModifyAsset(asset!, undefined)).toBe(false);

      // Unauthenticated user cannot publish
      expect(canPublishAsset(asset!, undefined)).toBe(false);
    });

    it("should enforce complete workflow: private asset, owner access", async () => {
      const asset = await getAssetFromPath("private-armor");
      expect(asset).not.toBeNull();

      const ownerAuth: AuthUser = {
        id: testUser1.id,
        privyUserId: testUser1.privyUserId,
        email: testUser1.email,
        walletAddress: testUser1.walletAddress,
        displayName: testUser1.displayName,
        role: testUser1.role,
        profileCompleted: testUser1.profileCompleted,
        createdAt: testUser1.createdAt,
      };

      // Owner can view their private asset
      expect(canViewAsset(asset!, ownerAuth)).toBe(true);

      // Owner can modify their private asset
      expect(canModifyAsset(asset!, ownerAuth)).toBe(true);

      // Owner can publish their private asset
      expect(canPublishAsset(asset!, ownerAuth)).toBe(true);
    });

    it("should enforce complete workflow: private asset, other user denied", async () => {
      const asset = await getAssetFromPath("private-armor");
      expect(asset).not.toBeNull();

      const otherAuth: AuthUser = {
        id: testUser2.id,
        privyUserId: testUser2.privyUserId,
        email: testUser2.email,
        walletAddress: testUser2.walletAddress,
        displayName: testUser2.displayName,
        role: testUser2.role,
        profileCompleted: testUser2.profileCompleted,
        createdAt: testUser2.createdAt,
      };

      // Other user CANNOT view private asset
      expect(canViewAsset(asset!, otherAuth)).toBe(false);

      // Other user CANNOT modify private asset
      expect(canModifyAsset(asset!, otherAuth)).toBe(false);

      // Other user CANNOT publish private asset
      expect(canPublishAsset(asset!, otherAuth)).toBe(false);
    });

    it("should enforce complete workflow: admin has full access", async () => {
      const privateAssetDb = await getAssetFromPath("private-armor");
      const publicAssetDb = await getAssetFromPath("public-sword");

      const adminAuth: AuthUser = {
        id: adminUser.id,
        privyUserId: adminUser.privyUserId,
        email: adminUser.email,
        walletAddress: adminUser.walletAddress,
        displayName: adminUser.displayName,
        role: adminUser.role,
        profileCompleted: adminUser.profileCompleted,
        createdAt: adminUser.createdAt,
      };

      // Admin can view all assets
      expect(canViewAsset(privateAssetDb!, adminAuth)).toBe(true);
      expect(canViewAsset(publicAssetDb!, adminAuth)).toBe(true);

      // Admin can modify all assets
      expect(canModifyAsset(privateAssetDb!, adminAuth)).toBe(true);
      expect(canModifyAsset(publicAssetDb!, adminAuth)).toBe(true);

      // Admin can publish all assets
      expect(canPublishAsset(privateAssetDb!, adminAuth)).toBe(true);
      expect(canPublishAsset(publicAssetDb!, adminAuth)).toBe(true);
    });
  });
});
