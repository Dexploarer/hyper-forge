/**
 * Debug Storage Routes Tests
 * Tests for debugging storage configuration and volume mounts
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { debugStorageRoute } from "../../../../server/routes/debug-storage";

describe("Debug Storage Routes", () => {
  let app: Elysia;

  beforeAll(() => {
    app = new Elysia().use(debugStorageRoute);
  });

  describe("GET /api/debug/storage-info", () => {
    it("should return storage information", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/storage-info"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("environment");
      expect(data).toHaveProperty("volume");
      expect(data).toHaveProperty("storage");
      expect(data).toHaveProperty("test");
    });

    it("should return environment information", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/storage-info"),
      );

      const data = await response.json();
      expect(data.environment).toHaveProperty("NODE_ENV");
      expect(data.environment).toHaveProperty("isProduction");
      expect(data.environment).toHaveProperty("isRailway");
      expect(data.environment).toHaveProperty("railwayEnvironment");
    });

    it("should return volume configuration", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/storage-info"),
      );

      const data = await response.json();
      expect(data.volume).toHaveProperty("configured");
      expect(data.volume).toHaveProperty("mountPath");
      expect(data.volume).toHaveProperty("customVolumeVars");
    });

    it("should return storage directory info", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/storage-info"),
      );

      const data = await response.json();
      expect(data.storage).toHaveProperty("rootDir");
      expect(data.storage).toHaveProperty("mediaRoot");
      expect(data.storage).toHaveProperty("directory");
      expect(data.storage).toHaveProperty("fileCount");
      expect(data.storage).toHaveProperty("totalSizeBytes");
      expect(data.storage).toHaveProperty("totalSizeMB");
    });

    it("should test write permissions", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/storage-info"),
      );

      const data = await response.json();
      expect(data.test).toHaveProperty("canWriteTest");
      expect(typeof data.test.canWriteTest).toBe("boolean");
    });

    it("should work without authentication", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/storage-info"),
      );

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/debug/check-file", () => {
    it("should require path parameter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/check-file"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.error).toContain("Missing");
    });

    it("should check file existence", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/debug/check-file?path=/gdd-assets/test.txt",
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("path");
      expect(data).toHaveProperty("fullPath");
      expect(data).toHaveProperty("exists");
    });

    it("should block directory traversal", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/debug/check-file?path=../../etc/passwd",
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.error).toContain("Access denied");
    });

    it("should only allow gdd-assets directory", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/check-file?path=/server/db.ts"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.error).toContain("gdd-assets");
    });

    it("should return file info when file exists", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/debug/check-file?path=/gdd-assets/test.txt",
        ),
      );

      const data = await response.json();
      if (data.exists && data.fileInfo) {
        expect(data.fileInfo).toHaveProperty("size");
        expect(data.fileInfo).toHaveProperty("sizeMB");
        expect(data.fileInfo).toHaveProperty("created");
        expect(data.fileInfo).toHaveProperty("modified");
        expect(data.fileInfo).toHaveProperty("isFile");
        expect(data.fileInfo).toHaveProperty("isDirectory");
      }
    });

    it("should handle non-existent files gracefully", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/debug/check-file?path=/gdd-assets/definitely-does-not-exist-12345.txt",
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.exists).toBe(false);
    });

    it("should handle nested paths", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/debug/check-file?path=/gdd-assets/media/npc/test.png",
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("exists");
    });

    it("should provide example usage when path missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/check-file"),
      );

      const data = await response.json();
      expect(data).toHaveProperty("example");
      expect(data.example).toContain("/api/debug/check-file?path=");
    });
  });

  describe("Security", () => {
    it("should prevent absolute path traversal", async () => {
      const maliciousPaths = [
        "/etc/passwd",
        "/../../etc/passwd",
        "/../../../etc/passwd",
        "/gdd-assets/../../../etc/passwd",
      ];

      for (const path of maliciousPaths) {
        const response = await app.handle(
          new Request(
            `http://localhost/api/debug/check-file?path=${encodeURIComponent(path)}`,
          ),
        );

        const data = await response.json();
        if (!path.includes("gdd-assets")) {
          expect(data.error).toContain("Access denied");
        }
      }
    });

    it("should handle URL encoded traversal attempts", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/debug/check-file?path=%2F..%2F..%2Fetc%2Fpasswd",
        ),
      );

      const data = await response.json();
      expect(data.error).toContain("Access denied");
    });
  });
});
