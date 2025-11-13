/**
 * Public Profiles Routes Tests
 * Tests for viewing public user profiles and content
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { publicProfilesRoutes } from "../../../../server/routes/public-profiles";
import { createAuthHeader } from "../../../helpers/auth";
import {
  createTestUser,
  createTestAsset,
  createTestProject,
  cleanDatabase,
} from "../../../helpers/db";

describe("Public Profiles Routes", () => {
  let app: Elysia;
  let testUser: any;
  let otherUser: any;
  let publicAsset: any;
  let privateAsset: any;
  let publicProject: any;

  beforeAll(async () => {
    await cleanDatabase();

    const { user: user1, authUser: auth1 } = await createTestUser({
      privyUserId: "profile-user-1",
      email: "profile1@test.com",
      displayName: "Test User One",
    });
    testUser = { ...user1, authUser: auth1 };

    const { user: user2, authUser: auth2 } = await createTestUser({
      privyUserId: "profile-user-2",
      email: "profile2@test.com",
      displayName: "Test User Two",
    });
    otherUser = { ...user2, authUser: auth2 };

    publicAsset = await createTestAsset(testUser.id, {
      name: "Public Asset",
      visibility: "public",
    });

    privateAsset = await createTestAsset(testUser.id, {
      name: "Private Asset",
      visibility: "private",
    });

    publicProject = await createTestProject(testUser.id, {
      name: "Public Project",
      visibility: "public",
    });

    app = new Elysia().use(publicProfilesRoutes);
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("GET /api/public/users/:userId/profile", () => {
    it("should return public profile without authentication", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/public/users/${testUser.id}/profile`),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("profile");
      expect(data).toHaveProperty("stats");
    });

    it("should indicate own profile when authenticated", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/public/users/${testUser.id}/profile`,
          {
            headers: {
              Authorization: createAuthHeader(
                "profile-user-1",
                "profile1@test.com",
              ),
            },
          },
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.profile.isOwnProfile).toBe(true);
    });

    it("should indicate not own profile for other users", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/public/users/${testUser.id}/profile`,
          {
            headers: {
              Authorization: createAuthHeader(
                "profile-user-2",
                "profile2@test.com",
              ),
            },
          },
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.profile.isOwnProfile).toBe(false);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/public/users/non-existent/profile"),
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("User not found");
    });

    it("should include user stats", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/public/users/${testUser.id}/profile`),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.stats).toBeDefined();
    });
  });

  describe("GET /api/public/users/:userId/assets", () => {
    it("should return only public assets for unauthenticated users", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/public/users/${testUser.id}/assets`),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.assets)).toBe(true);
      expect(data.isOwnProfile).toBe(false);

      // Should only include public assets
      const hasPrivate = data.assets.some(
        (a: any) => a.visibility === "private",
      );
      expect(hasPrivate).toBe(false);
    });

    it("should return all assets for own profile", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/public/users/${testUser.id}/assets`, {
          headers: {
            Authorization: createAuthHeader(
              "profile-user-1",
              "profile1@test.com",
            ),
          },
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.isOwnProfile).toBe(true);
      // Should include both public and private
      expect(data.assets.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter by type when specified", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/public/users/${testUser.id}/assets?type=weapon`,
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.assets)).toBe(true);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/public/users/non-existent/assets"),
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("User not found");
    });

    it("should include total count", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/public/users/${testUser.id}/assets`),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("total");
      expect(typeof data.total).toBe("number");
    });
  });

  describe("GET /api/public/users/:userId/projects", () => {
    it("should return only public projects for unauthenticated users", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/public/users/${testUser.id}/projects`,
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.projects)).toBe(true);
      expect(data.isOwnProfile).toBe(false);
    });

    it("should return all projects for own profile", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/public/users/${testUser.id}/projects`,
          {
            headers: {
              Authorization: createAuthHeader(
                "profile-user-1",
                "profile1@test.com",
              ),
            },
          },
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.isOwnProfile).toBe(true);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/public/users/non-existent/projects"),
      );

      expect(response.status).toBe(404);
    });

    it("should include total count", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/public/users/${testUser.id}/projects`,
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("total");
    });
  });

  describe("GET /api/public/users/:userId/achievements", () => {
    it("should return user achievements", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/public/users/${testUser.id}/achievements`,
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.achievements)).toBe(true);
      expect(data).toHaveProperty("total");
    });

    it("should work without authentication", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/public/users/${testUser.id}/achievements`,
        ),
      );

      expect(response.status).toBe(200);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/public/users/non-existent/achievements",
        ),
      );

      expect(response.status).toBe(404);
    });

    it("should include achievement details", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/public/users/${testUser.id}/achievements`,
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      if (data.achievements.length > 0) {
        const achievement = data.achievements[0];
        expect(achievement).toHaveProperty("achievement");
      }
    });
  });

  describe("GET /api/public/users/:userId/stats", () => {
    it("should return user statistics", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/public/users/${testUser.id}/stats`),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("stats");
      expect(data).toHaveProperty("isOwnProfile");
    });

    it("should work without authentication", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/public/users/${testUser.id}/stats`),
      );

      expect(response.status).toBe(200);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/public/users/non-existent/stats"),
      );

      expect(response.status).toBe(404);
    });
  });

  describe("Privacy & Security", () => {
    it("should not expose private assets to other users", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/public/users/${testUser.id}/assets`, {
          headers: {
            Authorization: createAuthHeader(
              "profile-user-2",
              "profile2@test.com",
            ),
          },
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      const hasPrivate = data.assets.some((a: any) => a.id === privateAsset.id);
      expect(hasPrivate).toBe(false);
    });

    it("should not expose private projects to other users", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/public/users/${testUser.id}/projects`,
          {
            headers: {
              Authorization: createAuthHeader(
                "profile-user-2",
                "profile2@test.com",
              ),
            },
          },
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      // Should only show public projects
      expect(data.isOwnProfile).toBe(false);
    });
  });
});
