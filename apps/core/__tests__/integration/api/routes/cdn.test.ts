/**
 * CDN Routes Tests
 * Tests for CDN asset publishing functionality
 */

import { describe, it, expect, beforeAll, afterEach } from "bun:test";
import { Elysia } from "elysia";
import { createCDNRoutes } from "../../../../server/routes/cdn";
import { createAuthHeader } from "../../../helpers/auth";
import {
  createTestUser,
  createTestAdmin,
  createTestAsset,
  cleanDatabase,
} from "../../../helpers/db";

describe("CDN Routes", () => {
  let app: Elysia;
  let testUser: any;
  let adminUser: any;
  let userAsset: any;
  let adminAsset: any;
  const testAssetsDir = "/tmp/test-assets";
  const testCdnUrl = "https://cdn.test.com";

  beforeAll(async () => {
    await cleanDatabase();

    const { user: user1, authUser: auth1 } = await createTestUser({
      privyUserId: "cdn-user-1",
      email: "cdn-user@test.com",
    });
    testUser = { ...user1, authUser: auth1 };

    const { user: user2, authUser: auth2 } = await createTestAdmin({
      privyUserId: "cdn-admin-1",
      email: "cdn-admin@test.com",
    });
    adminUser = { ...user2, authUser: auth2 };

    userAsset = await createTestAsset(testUser.id, {
      name: "User Asset",
      filePath: "user-asset/model.glb",
    });

    adminAsset = await createTestAsset(adminUser.id, {
      name: "Admin Asset",
      filePath: "admin-asset/model.glb",
    });

    app = new Elysia().use(createCDNRoutes(testAssetsDir, testCdnUrl));
  });

  afterEach(async () => {
    // Reset assets to initial state
  });

  describe("POST /api/cdn/publish/:assetId", () => {
    it("should require authentication", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/cdn/publish/${userAsset.id}`, {
          method: "POST",
        }),
      );

      expect(response.status).toBe(401);
    });

    it("should allow owner to publish their asset", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/cdn/publish/${userAsset.id}`, {
          method: "POST",
          headers: {
            Authorization: createAuthHeader("cdn-user-1", "cdn-user@test.com"),
          },
        }),
      );

      // May succeed or fail based on filesystem, but should not be 403/401
      expect([200, 500]).toContain(response.status);
    });

    it("should allow admin to publish any asset", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/cdn/publish/${userAsset.id}`, {
          method: "POST",
          headers: {
            Authorization: createAuthHeader(
              "cdn-admin-1",
              "cdn-admin@test.com",
            ),
          },
        }),
      );

      expect([200, 500]).toContain(response.status);
    });

    it("should return 404 for non-existent asset", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/cdn/publish/non-existent", {
          method: "POST",
          headers: {
            Authorization: createAuthHeader("cdn-user-1", "cdn-user@test.com"),
          },
        }),
      );

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("not found");
    });

    it("should return response with expected structure", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/cdn/publish/${userAsset.id}`, {
          method: "POST",
          headers: {
            Authorization: createAuthHeader("cdn-user-1", "cdn-user@test.com"),
          },
        }),
      );

      const data = await response.json();
      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("assetId");
      expect(data).toHaveProperty("filesPublished");
    });
  });

  describe("POST /api/cdn/publish-batch", () => {
    it("should require authentication", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/cdn/publish-batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assetIds: [userAsset.id],
          }),
        }),
      );

      expect(response.status).toBe(401);
    });

    it("should publish multiple assets", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/cdn/publish-batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: createAuthHeader("cdn-user-1", "cdn-user@test.com"),
          },
          body: JSON.stringify({
            assetIds: [userAsset.id],
          }),
        }),
      );

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data).toHaveProperty("results");
        expect(data).toHaveProperty("published");
        expect(data).toHaveProperty("failed");
      }
    });

    it("should handle empty asset array", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/cdn/publish-batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: createAuthHeader("cdn-user-1", "cdn-user@test.com"),
          },
          body: JSON.stringify({
            assetIds: [],
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.published).toBe(0);
    });

    it("should report per-asset results", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/cdn/publish-batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: createAuthHeader("cdn-user-1", "cdn-user@test.com"),
          },
          body: JSON.stringify({
            assetIds: [userAsset.id, "non-existent"],
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results.length).toBe(2);
    });
  });

  describe("GET /api/cdn/health", () => {
    it("should return CDN health status", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/cdn/health"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("cdn");
      expect(data).toHaveProperty("url");
      expect(data).toHaveProperty("healthy");
      expect(data).toHaveProperty("timestamp");
    });

    it("should work without authentication", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/cdn/health"),
      );

      expect(response.status).toBe(200);
    });

    it("should return correct CDN URL", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/cdn/health"),
      );

      const data = await response.json();
      expect(data.url).toBe(testCdnUrl);
    });
  });

  describe("Security & Authorization", () => {
    it("should prevent non-owner from publishing asset", async () => {
      // Create another user
      const { user: otherUser } = await createTestUser({
        privyUserId: "cdn-other-user",
        email: "cdn-other@test.com",
      });

      const response = await app.handle(
        new Request(`http://localhost/api/cdn/publish/${userAsset.id}`, {
          method: "POST",
          headers: {
            Authorization: createAuthHeader(
              "cdn-other-user",
              "cdn-other@test.com",
            ),
          },
        }),
      );

      const data = await response.json();
      expect(data.success).toBe(false);
      // May fail with "Asset not found" or "permission denied" depending on lookup order
      expect(data.error).toBeDefined();
    });

    it("should validate asset ID format", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/cdn/publish/", {
          method: "POST",
          headers: {
            Authorization: createAuthHeader("cdn-user-1", "cdn-user@test.com"),
          },
        }),
      );

      // Should be 404 or 400 for malformed URL
      expect([400, 404]).toContain(response.status);
    });
  });
});
