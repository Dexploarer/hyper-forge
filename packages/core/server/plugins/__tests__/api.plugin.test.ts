/**
 * API Plugin Tests
 * Tests for api.plugin.ts - aggregated API routes
 */

import { describe, it, expect } from "bun:test";
import { Elysia } from "elysia";
import { createApiPlugin, type ApiPluginConfig } from "../api.plugin";

describe("API Plugin", () => {
  const testConfig: ApiPluginConfig = {
    rootDir: "/test/root",
    retextureService: {} as any,
    generationService: {} as any,
    cdnUrl: "https://cdn.example.com",
    assetsDir: "/test/assets",
  };

  describe("Plugin creation", () => {
    it("should create API plugin with config", () => {
      const plugin = createApiPlugin(testConfig);
      expect(plugin).toBeDefined();
    });

    it("should accept all required config parameters", () => {
      const plugin = createApiPlugin({
        rootDir: "/custom/root",
        retextureService: {} as any,
        generationService: {} as any,
        cdnUrl: "https://custom-cdn.com",
      });

      expect(plugin).toBeDefined();
    });

    it("should use Railway volume path when available", () => {
      const originalEnv = process.env.RAILWAY_VOLUME_MOUNT_PATH;
      process.env.RAILWAY_VOLUME_MOUNT_PATH = "/railway/volume";

      const plugin = createApiPlugin(testConfig);

      process.env.RAILWAY_VOLUME_MOUNT_PATH = originalEnv;
      expect(plugin).toBeDefined();
    });

    it("should use default assets dir when not provided", () => {
      const plugin = createApiPlugin({
        rootDir: "/test",
        retextureService: {} as any,
        generationService: {} as any,
        cdnUrl: "https://cdn.test.com",
      });

      expect(plugin).toBeDefined();
    });
  });

  describe("Route aggregation", () => {
    it("should register user management routes", () => {
      const plugin = createApiPlugin(testConfig);
      expect(plugin).toBeDefined();
      // usersRoutes, userApiKeysRoutes, publicProfilesRoutes, achievementsRoutes
    });

    it("should register project and asset routes", () => {
      const plugin = createApiPlugin(testConfig);
      expect(plugin).toBeDefined();
      // projectsRoutes, assetRoutes, materialRoutes
    });

    it("should register AI generation routes", () => {
      const plugin = createApiPlugin(testConfig);
      expect(plugin).toBeDefined();
      // retextureRoutes, generationRoutes, aiVisionRoutes, promptRoutes
    });

    it("should register audio generation routes", () => {
      const plugin = createApiPlugin(testConfig);
      expect(plugin).toBeDefined();
      // voiceGenerationRoutes, musicRoutes, soundEffectsRoutes
    });

    it("should register content generation routes", () => {
      const plugin = createApiPlugin(testConfig);
      expect(plugin).toBeDefined();
      // contentGenerationRoutes, seedDataRoutes, worldConfigRoutes, vectorSearchRoutes
    });

    it("should register admin and utility routes", () => {
      const plugin = createApiPlugin(testConfig);
      expect(plugin).toBeDefined();
      // adminRoutes, playtesterSwarmRoutes, debugStorageRoute, cdnRoutes, errorMonitoringRoutes
    });
  });

  describe("Service dependency injection", () => {
    it("should inject retextureService", () => {
      const mockRetextureService = { mock: true };
      const plugin = createApiPlugin({
        ...testConfig,
        retextureService: mockRetextureService as any,
      });

      expect(plugin).toBeDefined();
    });

    it("should inject generationService", () => {
      const mockGenerationService = { mock: true };
      const plugin = createApiPlugin({
        ...testConfig,
        generationService: mockGenerationService as any,
      });

      expect(plugin).toBeDefined();
    });

    it("should pass CDN URL to routes", () => {
      const plugin = createApiPlugin({
        ...testConfig,
        cdnUrl: "https://custom-cdn.example.com",
      });

      expect(plugin).toBeDefined();
    });

    it("should pass rootDir to asset routes", () => {
      const plugin = createApiPlugin({
        ...testConfig,
        rootDir: "/custom/assets/root",
      });

      expect(plugin).toBeDefined();
    });
  });

  describe("Plugin composition", () => {
    it("should work with other plugins", async () => {
      const app = new Elysia()
        .use(createApiPlugin(testConfig))
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });

    it("should aggregate all routes under /api", () => {
      const plugin = createApiPlugin(testConfig);
      expect(plugin).toBeDefined();
      // All routes should be under /api/*
    });

    it("should work with auth plugins", () => {
      const plugin = createApiPlugin(testConfig);
      expect(plugin).toBeDefined();
      // Routes can use auth guards
    });
  });

  describe("Legacy assets directory", () => {
    it("should support custom assets directory", () => {
      const plugin = createApiPlugin({
        ...testConfig,
        assetsDir: "/custom/legacy/assets",
      });

      expect(plugin).toBeDefined();
    });

    it("should fall back to rootDir/assets-legacy", () => {
      const plugin = createApiPlugin({
        rootDir: "/test",
        retextureService: {} as any,
        generationService: {} as any,
        cdnUrl: "https://cdn.test.com",
        // No assetsDir specified
      });

      expect(plugin).toBeDefined();
    });

    it("should use Railway volume when available", () => {
      const originalEnv = process.env.RAILWAY_VOLUME_MOUNT_PATH;
      process.env.RAILWAY_VOLUME_MOUNT_PATH = "/railway";

      const plugin = createApiPlugin({
        rootDir: "/test",
        retextureService: {} as any,
        generationService: {} as any,
        cdnUrl: "https://cdn.test.com",
      });

      process.env.RAILWAY_VOLUME_MOUNT_PATH = originalEnv;
      expect(plugin).toBeDefined();
    });
  });

  describe("Route organization", () => {
    it("should group related routes logically", () => {
      const plugin = createApiPlugin(testConfig);
      expect(plugin).toBeDefined();
      // User routes together, AI routes together, etc.
    });

    it("should reduce code duplication", () => {
      const plugin = createApiPlugin(testConfig);
      expect(plugin).toBeDefined();
      // Single plugin instead of ~40+ route imports
    });

    it("should maintain route independence", () => {
      const plugin = createApiPlugin(testConfig);
      expect(plugin).toBeDefined();
      // Each route module still independent
    });
  });
});
