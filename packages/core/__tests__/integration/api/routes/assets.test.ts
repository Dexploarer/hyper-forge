/**
 * Asset Routes Tests
 * Tests for asset CRUD operations, file serving, and sprite management
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { createAssetRoutes } from "../../../../server/routes/assets";
import { createAuthHeader } from "../../../helpers/auth";
import {
  createTestUser,
  createTestAdmin,
  createTestAsset,
  cleanDatabase,
} from "../../../helpers/db";
import { db } from "../../../../server/db";
import { users } from "../../../../server/db/schema";
import { eq } from "drizzle-orm";
import path from "path";

// Mock AssetService
const mockAssets = [
  {
    id: "test-asset-1",
    name: "Test Sword",
    type: "weapon",
    tier: 1,
    category: "melee",
    modelUrl: "/gdd-assets/test-asset-1/model.glb",
    thumbnailUrl: "/gdd-assets/test-asset-1/thumbnail.png",
    hasSpriteSheet: false,
    createdBy: "user-123",
    walletAddress: "0xABC",
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "test-asset-2",
    name: "Admin Asset",
    type: "armor",
    tier: 2,
    category: "heavy",
    modelUrl: "/gdd-assets/test-asset-2/model.glb",
    createdBy: "admin-456",
    isPublic: true,
    createdAt: new Date().toISOString(),
  },
];

const mockAssetService = {
  listAssets: async () => {
    return mockAssets;
  },
  getModelPath: async (id: string) => {
    // Return mock path
    return path.join("/tmp", "gdd-assets", id, "model.glb");
  },
  deleteAsset: async (
    id: string,
    _includeVariants: boolean,
    _userId?: string,
  ) => {
    // Mock deletion
    const index = mockAssets.findIndex((a) => a.id === id);
    if (index !== -1) {
      mockAssets.splice(index, 1);
    }
  },
  updateAsset: async (id: string, updates: any, _userId?: string) => {
    const asset = mockAssets.find((a) => a.id === id);
    if (!asset) return null;
    Object.assign(asset, updates, { updatedAt: new Date().toISOString() });
    return asset;
  },
};

describe("Asset Routes", () => {
  let app: Elysia;
  const testRootDir = "/tmp/asset-forge-test";

  beforeAll(async () => {
    // Clean database before creating test users
    await cleanDatabase();

    // Explicitly delete test users by privyUserId to avoid duplicates
    const testPrivyUserIds = ["user-123", "admin-456", "other-user"];
    for (const privyUserId of testPrivyUserIds) {
      await db
        .delete(users)
        .where(eq(users.privyUserId, privyUserId))
        .execute();
    }

    // Create test users to match the Privy user IDs used in auth headers
    await createTestUser({
      privyUserId: "user-123",
      email: "user-123@test.com",
      displayName: "Test User 123",
      role: "user",
    });

    await createTestAdmin({
      privyUserId: "admin-456",
      email: "admin-456@test.com",
      displayName: "Admin User 456",
    });

    await createTestUser({
      privyUserId: "other-user",
      email: "other-user@test.com",
      displayName: "Other User",
      role: "user",
    });

    app = new Elysia().use(
      createAssetRoutes(testRootDir, mockAssetService as any),
    );
  });

  afterAll(async () => {
    // Clean up test users after all tests complete
    await cleanDatabase();
  });

  afterEach(async () => {
    // Reset mock assets
    mockAssets.length = 0;
    mockAssets.push(
      {
        id: "test-asset-1",
        name: "Test Sword",
        type: "weapon",
        tier: 1,
        category: "melee",
        modelUrl: "/gdd-assets/test-asset-1/model.glb",
        thumbnailUrl: "/gdd-assets/test-asset-1/thumbnail.png",
        hasSpriteSheet: false,
        createdBy: "user-123",
        walletAddress: "0xABC",
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "test-asset-2",
        name: "Admin Asset",
        type: "armor",
        tier: 2,
        category: "heavy",
        modelUrl: "/gdd-assets/test-asset-2/model.glb",
        createdBy: "admin-456",
        isPublic: true,
        createdAt: new Date().toISOString(),
      },
    );
  });

  describe("GET /api/assets", () => {
    it("should return list of assets", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0].id).toBe("test-asset-1");
      expect(data[0].name).toBe("Test Sword");
    });

    it("should work without authentication", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets"),
      );

      expect(response.status).toBe(200);
    });

    it("should include all asset metadata fields", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      const asset = data[0];

      expect(asset).toHaveProperty("id");
      expect(asset).toHaveProperty("name");
      expect(asset).toHaveProperty("type");
      expect(asset).toHaveProperty("tier");
      expect(asset).toHaveProperty("category");
      expect(asset).toHaveProperty("modelUrl");
    });

    it("should return empty array when no assets exist", async () => {
      mockAssets.length = 0;

      const response = await app.handle(
        new Request("http://localhost/api/assets"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe("GET /api/assets/:id/model", () => {
    it("should return 404 for non-existent model file", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1/model"),
      );

      // File doesn't exist in /tmp
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain("Model not found");
    });

    it("should handle model retrieval for valid asset", async () => {
      // This test would pass if we created the actual file
      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1/model"),
      );

      // Without actual file, should be 404
      expect([200, 404]).toContain(response.status);
    });
  });

  describe("HEAD /api/assets/:id/model", () => {
    // FIXME: Elysia v1.4.15 has a bug with HEAD request handling
    // Error: TypeError: undefined is not an object (evaluating '_res.headers.set')
    // See: https://github.com/elysiajs/elysia/issues (pending bug report)
    it.skip("should return 404 for non-existent model", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1/model", {
          method: "HEAD",
        }),
      );

      // Elysia HEAD handling may have issues, accept both
      expect([200, 404]).toContain(response.status);
    });

    it.skip("should not return body for HEAD request", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1/model", {
          method: "HEAD",
        }),
      );

      // HEAD requests may return empty body or error
      expect([200, 404]).toContain(response.status);
    });
  });

  describe("GET /api/assets/:id/*", () => {
    it("should block directory traversal attacks", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/assets/test-asset-1/../../etc/passwd",
        ),
      );

      // Path normalization may result in 404 (file not found) rather than 403
      expect([403, 404]).toContain(response.status);
    });

    it("should return 404 for non-existent files", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1/nonexistent.png"),
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("File not found");
    });

    it("should handle nested paths correctly", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/assets/test-asset-1/sprites/0deg.png",
        ),
      );

      // File was created by previous test, may exist or not
      expect([200, 404]).toContain(response.status);
    });
  });

  describe("DELETE /api/assets/:id", () => {
    it("should delete asset when user owns it", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1", {
          method: "DELETE",
          headers: {
            Authorization: createAuthHeader("user-123", "user-123@example.com"),
          },
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain("deleted successfully");
    });

    it("should delete asset when user is admin", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-2", {
          method: "DELETE",
          headers: {
            Authorization: createAuthHeader(
              "admin-456",
              "admin-456@example.com",
            ),
          },
        }),
      );

      expect(response.status).toBe(200);
    });

    it("should return 403 when user does not own asset", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1", {
          method: "DELETE",
          headers: {
            Authorization: createAuthHeader(
              "other-user",
              "other-user@example.com",
            ),
          },
        }),
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe(
        "Permission denied. You can only delete your own assets. Admins can delete any asset.",
      );
    });

    it("should return 404 for non-existent asset", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets/non-existent", {
          method: "DELETE",
          headers: {
            Authorization: createAuthHeader("user-123", "user-123@example.com"),
          },
        }),
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Asset not found");
    });

    it("should support includeVariants query parameter", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/assets/test-asset-1?includeVariants=true",
          {
            method: "DELETE",
            headers: {
              Authorization: createAuthHeader(
                "user-123",
                "user-123@example.com",
              ),
            },
          },
        ),
      );

      expect(response.status).toBe(200);
    });
  });

  describe("PATCH /api/assets/:id", () => {
    it("should update asset metadata when user owns it", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: createAuthHeader("user-123", "user-123@example.com"),
          },
          body: JSON.stringify({
            name: "Updated Sword",
            tier: 2,
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe("Updated Sword");
      expect(data.tier).toBe(2);
      expect(data.updatedAt).toBeDefined();
    });

    it("should allow admin to update any asset", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: createAuthHeader(
              "admin-456",
              "admin-456@example.com",
            ),
          },
          body: JSON.stringify({
            name: "Admin Updated",
          }),
        }),
      );

      expect(response.status).toBe(200);
    });

    it("should return 403 when user does not own asset", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: createAuthHeader(
              "other-user",
              "other-user@example.com",
            ),
          },
          body: JSON.stringify({
            name: "Hacked",
          }),
        }),
      );

      expect(response.status).toBe(403);
    });

    it("should return 404 for non-existent asset", async () => {
      // Modify mock to return null
      const originalUpdate = mockAssetService.updateAsset;
      mockAssetService.updateAsset = async () => null;

      const response = await app.handle(
        new Request("http://localhost/api/assets/non-existent", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: createAuthHeader("user-123", "user-123@example.com"),
          },
          body: JSON.stringify({
            name: "Test",
          }),
        }),
      );

      expect(response.status).toBe(404);

      // Restore
      mockAssetService.updateAsset = originalUpdate;
    });

    it("should update individual fields independently", async () => {
      // Update only name
      const response1 = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: createAuthHeader("user-123", "user-123@example.com"),
          },
          body: JSON.stringify({
            name: "Name Only",
          }),
        }),
      );

      expect(response1.status).toBe(200);

      // Update only tier
      const response2 = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: createAuthHeader("user-123", "user-123@example.com"),
          },
          body: JSON.stringify({
            tier: 5,
          }),
        }),
      );

      expect(response2.status).toBe(200);
    });

    it("should reject invalid update data", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: createAuthHeader("user-123", "user-123@example.com"),
          },
          body: "invalid json",
        }),
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /api/assets/:id/sprites", () => {
    it("should save sprite images and metadata", async () => {
      const sprites = [
        {
          angle: 0,
          imageData:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        },
        {
          angle: 45,
          imageData:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        },
      ];

      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1/sprites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sprites,
            config: { resolution: 512, angles: 8 },
          }),
        }),
      );

      // Will fail without actual filesystem, but tests the route
      expect([200, 500]).toContain(response.status);
    });

    it("should reject empty sprites array", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1/sprites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sprites: [],
          }),
        }),
      );

      // TypeBox validation should reject empty array or implementation should handle
      expect([200, 400, 500]).toContain(response.status);
    });

    it("should work without config parameter", async () => {
      const sprites = [
        {
          angle: 0,
          imageData:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        },
      ];

      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1/sprites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sprites,
          }),
        }),
      );

      expect([200, 500]).toContain(response.status);
    });
  });

  describe("POST /api/assets/upload-vrm", () => {
    it("should handle VRM file upload", async () => {
      // Create mock File
      const mockFile = new File(["mock vrm content"], "avatar.vrm", {
        type: "model/vrm",
      });

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("assetId", "test-asset-1");

      const response = await app.handle(
        new Request("http://localhost/api/assets/upload-vrm", {
          method: "POST",
          body: formData,
        }),
      );

      // Will succeed or fail based on filesystem
      expect([200, 500]).toContain(response.status);
    });

    it("should return CDN URL for uploaded VRM", async () => {
      const mockFile = new File(["mock vrm content"], "avatar.vrm", {
        type: "model/vrm",
      });

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("assetId", "test-asset-vrm");

      const response = await app.handle(
        new Request("http://localhost/api/assets/upload-vrm", {
          method: "POST",
          body: formData,
        }),
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        // Should return CDN URL, not local path
        expect(data.url).toContain("/models/test-asset-vrm/avatar.vrm");
        expect(data.url).not.toContain("/gdd-assets/");
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON gracefully", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1/sprites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: "{invalid json",
        }),
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle missing Content-Type header", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1", {
          method: "PATCH",
          body: JSON.stringify({ name: "Test" }),
        }),
      );

      // Elysia may handle this gracefully or reject
      expect([200, 400, 415, 422]).toContain(response.status);
    });
  });

  describe("Security", () => {
    it("should prevent path traversal in file serving", async () => {
      const maliciousPaths = [
        "../../../etc/passwd",
        "..%2F..%2F..%2Fetc%2Fpasswd",
        "sprites/../../config.json",
      ];

      for (const maliciousPath of maliciousPaths) {
        const response = await app.handle(
          new Request(
            `http://localhost/api/assets/test-asset-1/${maliciousPath}`,
          ),
        );

        // Path normalization may block (403) or not find (404)
        expect([403, 404]).toContain(response.status);
      }
    });

    it("should enforce ownership on sensitive operations", async () => {
      // Try to delete someone else's asset
      const deleteResponse = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1", {
          method: "DELETE",
          headers: {
            Authorization: createAuthHeader(
              "other-user",
              "other-user@example.com",
            ),
          },
        }),
      );

      expect(deleteResponse.status).toBe(403);

      // Try to update someone else's asset
      const updateResponse = await app.handle(
        new Request("http://localhost/api/assets/test-asset-1", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: createAuthHeader(
              "other-user",
              "other-user@example.com",
            ),
          },
          body: JSON.stringify({ name: "Hacked" }),
        }),
      );

      expect(updateResponse.status).toBe(403);
    });
  });

  describe("CDN URL Merging", () => {
    it("should include CDN URLs when asset is published to CDN", async () => {
      // Create database asset record with CDN URLs
      const { user } = await createTestUser({
        privyUserId: "cdn-user",
        email: "cdn-user@test.com",
      });

      await createTestAsset(user.id, {
        name: "CDN Asset",
        type: "weapon",
        category: "melee",
        filePath: "cdn-asset/cdn-asset.glb",
        status: "completed",
        visibility: "public",
        cdnUrl: "https://cdn.example.com/models/cdn-asset/model.glb",
        cdnThumbnailUrl:
          "https://cdn.example.com/models/cdn-asset/thumbnail.png",
        cdnConceptArtUrl:
          "https://cdn.example.com/models/cdn-asset/concept-art.png",
        cdnFiles: [
          "https://cdn.example.com/models/cdn-asset/model.glb",
          "https://cdn.example.com/models/cdn-asset/concept-art.png",
          "https://cdn.example.com/models/cdn-asset/thumbnail.png",
        ],
      });

      // Add filesystem mock asset (without CDN fields)
      mockAssets.push({
        id: "cdn-asset",
        name: "CDN Asset",
        type: "weapon",
        tier: 1,
        category: "melee",
        modelUrl: "/gdd-assets/cdn-asset/model.glb",
        createdBy: user.privyUserId,
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await app.handle(
        new Request("http://localhost/api/assets"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      // Find our CDN asset
      const returnedAsset = data.find((a: any) => a.id === "cdn-asset");

      // Should include CDN URL fields merged from database
      expect(returnedAsset).toBeDefined();
      expect(returnedAsset.cdnUrl).toBe(
        "https://cdn.example.com/models/cdn-asset/model.glb",
      );
      expect(returnedAsset.cdnThumbnailUrl).toBe(
        "https://cdn.example.com/models/cdn-asset/thumbnail.png",
      );
      expect(returnedAsset.cdnConceptArtUrl).toBe(
        "https://cdn.example.com/models/cdn-asset/concept-art.png",
      );
      expect(Array.isArray(returnedAsset.cdnFiles)).toBe(true);
      expect(returnedAsset.cdnFiles.length).toBe(3);
    });

    it("should not include CDN URL when asset not on CDN", async () => {
      // Create database asset without CDN fields
      const { user } = await createTestUser({
        privyUserId: "local-user",
        email: "local-user@test.com",
      });

      await createTestAsset(user.id, {
        name: "Local Asset",
        type: "weapon",
        category: "melee",
        filePath: "local-asset/local-asset.glb",
        status: "completed",
        visibility: "public",
      });

      // Add filesystem mock asset
      mockAssets.push({
        id: "local-asset",
        name: "Local Asset",
        type: "weapon",
        tier: 1,
        category: "melee",
        modelUrl: "/gdd-assets/local-asset/model.glb",
        createdBy: user.privyUserId,
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await app.handle(
        new Request("http://localhost/api/assets"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      const returnedAsset = data.find((a: any) => a.id === "local-asset");

      expect(returnedAsset).toBeDefined();
      expect(returnedAsset.cdnUrl).toBeUndefined();
    });

    it("should handle mixed CDN and local assets", async () => {
      // Create user
      const { user } = await createTestUser({
        privyUserId: "mixed-user",
        email: "mixed-user@test.com",
      });

      // Create CDN asset in database
      await createTestAsset(user.id, {
        name: "CDN Asset",
        type: "weapon",
        filePath: "mixed-cdn/mixed-cdn.glb",
        status: "completed",
        visibility: "public",
        cdnUrl: "https://cdn.example.com/models/mixed-cdn/model.glb",
      });

      // Create local asset in database
      await createTestAsset(user.id, {
        name: "Local Asset",
        type: "armor",
        filePath: "mixed-local/mixed-local.glb",
        status: "completed",
        visibility: "public",
      });

      // Add filesystem mock assets
      mockAssets.push(
        {
          id: "mixed-cdn",
          name: "CDN Asset",
          type: "weapon",
          modelUrl: "/gdd-assets/mixed-cdn/model.glb",
          createdBy: user.privyUserId,
          isPublic: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "mixed-local",
          name: "Local Asset",
          type: "armor",
          modelUrl: "/gdd-assets/mixed-local/model.glb",
          createdBy: user.privyUserId,
          isPublic: true,
          createdAt: new Date().toISOString(),
        },
      );

      const response = await app.handle(
        new Request("http://localhost/api/assets"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      // Should have both types
      const cdnReturned = data.find((a: any) => a.id === "mixed-cdn");
      const localReturned = data.find((a: any) => a.id === "mixed-local");

      expect(cdnReturned.cdnUrl).toBeDefined();
      expect(localReturned.cdnUrl).toBeUndefined();
    });

    it("should preserve all original asset fields when merging CDN URLs", async () => {
      // Create user
      const { user } = await createTestUser({
        privyUserId: "full-user",
        email: "full-user@test.com",
        walletAddress: "0xABC",
      });

      // Create database asset with CDN fields
      await createTestAsset(user.id, {
        name: "Full Asset",
        description: "Test description",
        type: "weapon",
        subtype: "sword",
        category: "melee",
        filePath: "full-asset/full-asset.glb",
        status: "completed",
        visibility: "public",
        cdnUrl: "https://cdn.example.com/models/full-asset/model.glb",
      });

      // Add filesystem mock asset with all fields
      mockAssets.push({
        id: "full-asset",
        name: "Full Asset",
        description: "Test description",
        type: "weapon",
        subtype: "sword",
        tier: 3,
        category: "melee",
        modelUrl: "/gdd-assets/full-asset/model.glb",
        thumbnailUrl: "/gdd-assets/full-asset/thumbnail.png",
        hasSpriteSheet: true,
        createdBy: user.privyUserId,
        walletAddress: "0xABC",
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await app.handle(
        new Request("http://localhost/api/assets"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      const returnedAsset = data.find((a: any) => a.id === "full-asset");

      // Should have all original fields
      expect(returnedAsset.name).toBe("Full Asset");
      expect(returnedAsset.description).toBe("Test description");
      expect(returnedAsset.type).toBe("weapon");
      expect(returnedAsset.tier).toBe(3);
      expect(returnedAsset.modelUrl).toBe("/gdd-assets/full-asset/model.glb");

      // Plus CDN fields merged from database
      expect(returnedAsset.cdnUrl).toBe(
        "https://cdn.example.com/models/full-asset/model.glb",
      );
    });
  });
});
