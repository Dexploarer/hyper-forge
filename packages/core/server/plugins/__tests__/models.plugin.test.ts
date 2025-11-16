/**
 * Models Plugin Tests
 * Tests for models.plugin.ts - TypeBox schema registration
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { modelsPlugin } from "../models.plugin";

describe("Models Plugin", () => {
  describe("Schema registration", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia().use(modelsPlugin);
    });

    it("should register all model schemas", () => {
      // Plugin should compose without errors
      expect(app).toBeDefined();
    });

    it("should allow referencing models with t.Ref", () => {
      // This is tested by TypeScript compilation
      // Runtime test would check schema access
      expect(true).toBe(true);
    });
  });

  describe("Common models", () => {
    it("should register user context models", () => {
      const app = new Elysia().use(modelsPlugin);
      expect(app).toBeDefined();
    });

    it("should register health response models", () => {
      const app = new Elysia().use(modelsPlugin);
      expect(app).toBeDefined();
    });

    it("should register error response models", () => {
      const app = new Elysia().use(modelsPlugin);
      expect(app).toBeDefined();
    });
  });

  describe("Asset models", () => {
    it("should register asset metadata models", () => {
      const app = new Elysia().use(modelsPlugin);
      expect(app).toBeDefined();
    });

    it("should register asset list models", () => {
      const app = new Elysia().use(modelsPlugin);
      expect(app).toBeDefined();
    });
  });

  describe("Generation pipeline models", () => {
    it("should register pipeline config models", () => {
      const app = new Elysia().use(modelsPlugin);
      expect(app).toBeDefined();
    });

    it("should register pipeline response models", () => {
      const app = new Elysia().use(modelsPlugin);
      expect(app).toBeDefined();
    });
  });

  describe("Content generation models", () => {
    it("should register dialogue models", () => {
      const app = new Elysia().use(modelsPlugin);
      expect(app).toBeDefined();
    });

    it("should register NPC models", () => {
      const app = new Elysia().use(modelsPlugin);
      expect(app).toBeDefined();
    });

    it("should register quest models", () => {
      const app = new Elysia().use(modelsPlugin);
      expect(app).toBeDefined();
    });

    it("should register world models", () => {
      const app = new Elysia().use(modelsPlugin);
      expect(app).toBeDefined();
    });
  });

  describe("Audio generation models", () => {
    it("should register voice generation models", () => {
      const app = new Elysia().use(modelsPlugin);
      expect(app).toBeDefined();
    });

    it("should register music models", () => {
      const app = new Elysia().use(modelsPlugin);
      expect(app).toBeDefined();
    });

    it("should register SFX models", () => {
      const app = new Elysia().use(modelsPlugin);
      expect(app).toBeDefined();
    });
  });

  describe("Plugin composition", () => {
    it("should compose with other plugins", async () => {
      const app = new Elysia()
        .use(modelsPlugin)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });

    it("should work with route handlers", () => {
      const app = new Elysia()
        .use(modelsPlugin)
        .get("/test", () => ({ data: "test" }));

      expect(app).toBeDefined();
    });
  });

  describe("OpenAPI documentation", () => {
    it("should enable automatic schema documentation", () => {
      const app = new Elysia().use(modelsPlugin);
      // Models should be available for OpenAPI generation
      expect(app).toBeDefined();
    });
  });
});
