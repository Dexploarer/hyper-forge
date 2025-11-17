/**
 * World Configuration Routes Tests
 * Tests for world config management (26+ endpoints)
 * This is a comprehensive test suite for all CRUD, sub-resource, and utility endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { worldConfigRoutes } from "../../../../server/routes/world-config";
import { cleanDatabase } from "../../../helpers/db";

describe("World Configuration Routes", () => {
  let app: Elysia;
  let testConfigId: string;

  beforeAll(async () => {
    await cleanDatabase();
    app = new Elysia().use(worldConfigRoutes);
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("POST /api/world-config - Create Configuration", () => {
    it("should create new configuration", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/world-config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Test Config",
            description: "Test world configuration",
            createdBy: "test-user",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data).toHaveProperty("config");
      expect(data.config).toHaveProperty("id");
      expect(data.config.name).toBe("Test Config");

      // Save for later tests
      testConfigId = data.config.id;
    });

    it("should validate required name field", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/world-config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: "Missing name",
          }),
        }),
      );

      expect([400, 500]).toContain(response.status);
    });
  });

  describe("GET /api/world-config - List Configurations", () => {
    it("should list all configurations", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/world-config"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.configs)).toBe(true);
      expect(data).toHaveProperty("count");
    });

    it("should support limit parameter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/world-config?limit=5"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.configs.length).toBeLessThanOrEqual(5);
    });

    it("should support offset parameter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/world-config?offset=0"),
      );

      expect(response.status).toBe(200);
    });

    it("should support includeTemplates parameter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/world-config?includeTemplates=true"),
      );

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/world-config/:id - Get Configuration", () => {
    it("should return configuration by ID", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/world-config/${testConfigId}`),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.config.id).toBe(testConfigId);
    });

    it("should return 404 for non-existent configuration", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/world-config/non-existent-id"),
      );

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/world-config/active - Get Active Configuration", () => {
    it("should return active configuration if exists", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/world-config/active"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      // config may be null if no active config
      expect(data).toHaveProperty("config");
    });
  });

  describe("PUT /api/world-config/:id - Update Configuration", () => {
    it("should update configuration", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/world-config/${testConfigId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Updated Config",
            description: "Updated description",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.config.name).toBe("Updated Config");
    });
  });

  describe("PATCH /api/world-config/:id/section - Update Section", () => {
    it("should update specific section", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/world-config/${testConfigId}/section`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              section: "races",
              data: [],
            }),
          },
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("should validate section parameter", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/world-config/${testConfigId}/section`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: [],
            }),
          },
        ),
      );

      expect([400, 500]).toContain(response.status);
    });
  });

  describe("POST /api/world-config/:id/activate - Activate Configuration", () => {
    it("should activate configuration", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/world-config/${testConfigId}/activate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              activatedBy: "test-user",
            }),
          },
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.config.isActive).toBe(true);
    });

    it("should work without activatedBy", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/world-config/${testConfigId}/activate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          },
        ),
      );

      expect(response.status).toBe(200);
    });
  });

  describe("Races Sub-Resource", () => {
    let raceId: string;

    describe("POST /api/world-config/:id/races", () => {
      it("should add race to configuration", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/races`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: "Elf",
                description: "Graceful forest dwellers",
                traits: ["Agile", "Long-lived"],
                culturalBackground: "Ancient forest civilization",
                enabled: true,
              }),
            },
          ),
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.race).toHaveProperty("id");
        expect(data.race.name).toBe("Elf");
        raceId = data.race.id;
      });

      it("should validate required fields", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/races`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: "Incomplete",
              }),
            },
          ),
        );

        expect([400, 500]).toContain(response.status);
      });
    });

    describe("PUT /api/world-config/:id/races/:raceId", () => {
      it("should update race", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/races/${raceId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: "High Elf",
                description: "Noble elves",
              }),
            },
          ),
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.race.name).toBe("High Elf");
      });

      it("should return 404 for non-existent race", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/races/non-existent`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: "Test",
              }),
            },
          ),
        );

        expect(response.status).toBe(404);
      });
    });

    describe("PATCH /api/world-config/:id/races/:raceId/toggle", () => {
      it("should toggle race enabled status", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/races/${raceId}/toggle`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                enabled: false,
              }),
            },
          ),
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.race.enabled).toBe(false);
      });
    });

    describe("DELETE /api/world-config/:id/races/:raceId", () => {
      it("should delete race", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/races/${raceId}`,
            {
              method: "DELETE",
            },
          ),
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      });
    });
  });

  describe("Factions Sub-Resource", () => {
    let factionId: string;

    describe("POST /api/world-config/:id/factions", () => {
      it("should add faction", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/factions`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: "The Order",
                description: "Knights of justice",
                alignment: "good",
                goals: ["Protect the realm"],
                rivals: [],
                allies: [],
                enabled: true,
              }),
            },
          ),
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        factionId = data.faction.id;
      });

      it("should validate alignment enum", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/factions`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: "Invalid Faction",
                description: "Test",
                alignment: "invalid",
                goals: [],
                rivals: [],
                allies: [],
                enabled: true,
              }),
            },
          ),
        );

        expect([400, 500]).toContain(response.status);
      });
    });

    describe("PUT /api/world-config/:id/factions/:factionId", () => {
      it("should update faction", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/factions/${factionId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: "The Grand Order",
              }),
            },
          ),
        );

        expect(response.status).toBe(200);
      });
    });

    describe("PATCH /api/world-config/:id/factions/:factionId/toggle", () => {
      it("should toggle faction", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/factions/${factionId}/toggle`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                enabled: false,
              }),
            },
          ),
        );

        expect(response.status).toBe(200);
      });
    });

    describe("DELETE /api/world-config/:id/factions/:factionId", () => {
      it("should delete faction", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/factions/${factionId}`,
            {
              method: "DELETE",
            },
          ),
        );

        expect(response.status).toBe(200);
      });
    });
  });

  describe("Skills Sub-Resource", () => {
    let skillId: string;

    describe("POST /api/world-config/:id/skills", () => {
      it("should add skill", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/skills`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: "Fireball",
                category: "magic",
                description: "Cast a ball of fire",
                prerequisites: [],
                tier: 1,
                enabled: true,
              }),
            },
          ),
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        skillId = data.skill.id;
      });

      it("should validate category enum", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/skills`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: "Invalid Skill",
                category: "invalid",
                description: "Test",
                prerequisites: [],
                tier: 1,
                enabled: true,
              }),
            },
          ),
        );

        expect([400, 500]).toContain(response.status);
      });

      it("should validate tier range", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/skills`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: "Invalid Tier",
                category: "magic",
                description: "Test",
                prerequisites: [],
                tier: 10,
                enabled: true,
              }),
            },
          ),
        );

        expect([400, 500]).toContain(response.status);
      });
    });

    describe("PUT /api/world-config/:id/skills/:skillId", () => {
      it("should update skill", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/skills/${skillId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: "Greater Fireball",
              }),
            },
          ),
        );

        expect(response.status).toBe(200);
      });
    });

    describe("PATCH /api/world-config/:id/skills/:skillId/toggle", () => {
      it("should toggle skill", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/skills/${skillId}/toggle`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                enabled: false,
              }),
            },
          ),
        );

        expect(response.status).toBe(200);
      });
    });

    describe("DELETE /api/world-config/:id/skills/:skillId", () => {
      it("should delete skill", async () => {
        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/${testConfigId}/skills/${skillId}`,
            {
              method: "DELETE",
            },
          ),
        );

        expect(response.status).toBe(200);
      });
    });
  });

  describe("GET /api/world-config/:id/validate - Validate Configuration", () => {
    it("should validate configuration", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/world-config/${testConfigId}/validate`,
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data).toHaveProperty("valid");
      expect(data).toHaveProperty("errors");
      expect(data).toHaveProperty("warnings");
    });
  });

  describe("GET /api/world-config/:id/ai-context - Build AI Context", () => {
    it("should build AI context from configuration", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/world-config/${testConfigId}/ai-context`,
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data).toHaveProperty("context");
      expect(data).toHaveProperty("configId");
      expect(data).toHaveProperty("configName");
      expect(data).toHaveProperty("sections");
      expect(typeof data.context).toBe("string");
    });

    it("should return 404 for non-existent config", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/world-config/non-existent/ai-context",
        ),
      );

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/world-config/:id/history - Get History", () => {
    it("should return configuration history", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/world-config/${testConfigId}/history`,
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.history)).toBe(true);
      expect(data).toHaveProperty("count");
    });

    it("should support limit parameter", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/world-config/${testConfigId}/history?limit=10`,
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.history.length).toBeLessThanOrEqual(10);
    });
  });

  describe("GET /api/world-config/templates/list - List Templates", () => {
    it("should list template configurations", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/world-config/templates/list"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.templates)).toBe(true);
      expect(data).toHaveProperty("count");
    });
  });

  describe("POST /api/world-config/from-template/:templateId", () => {
    it("should create from template", async () => {
      // First create a template
      const templateResponse = await app.handle(
        new Request("http://localhost/api/world-config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Template Config",
            description: "Template for testing",
            isTemplate: true,
          }),
        }),
      );

      if (templateResponse.status === 200) {
        const templateData = await templateResponse.json();
        const templateId = templateData.config.id;

        const response = await app.handle(
          new Request(
            `http://localhost/api/world-config/from-template/${templateId}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: "From Template",
                description: "Created from template",
              }),
            },
          ),
        );

        expect([200, 404, 500]).toContain(response.status);
      }
    });
  });

  describe("POST /api/world-config/clone", () => {
    it("should clone configuration", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/world-config/clone", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceConfigId: testConfigId,
            newName: "Cloned Config",
            newDescription: "Cloned from test",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.config.name).toBe("Cloned Config");
    });
  });

  describe("GET /api/world-config/:id/export", () => {
    it("should export configuration as JSON", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/world-config/${testConfigId}/export`),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data).toHaveProperty("data");
    });
  });

  describe("POST /api/world-config/import", () => {
    it("should import configuration from JSON", async () => {
      // First export to get valid data
      const exportResponse = await app.handle(
        new Request(`http://localhost/api/world-config/${testConfigId}/export`),
      );

      if (exportResponse.status === 200) {
        const exportData = await exportResponse.json();

        const response = await app.handle(
          new Request("http://localhost/api/world-config/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jsonData: exportData.data,
              name: "Imported Config",
            }),
          }),
        );

        expect(response.status).toBe(200);
      }
    });

    it("should validate JSON data", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/world-config/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonData: { invalid: "data" },
            name: "Invalid Import",
          }),
        }),
      );

      expect([400, 500]).toContain(response.status);
    });
  });

  describe("DELETE /api/world-config/:id", () => {
    it("should prevent deleting active configuration", async () => {
      // First activate it
      await app.handle(
        new Request(
          `http://localhost/api/world-config/${testConfigId}/activate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          },
        ),
      );

      const response = await app.handle(
        new Request(`http://localhost/api/world-config/${testConfigId}`, {
          method: "DELETE",
        }),
      );

      expect(response.status).toBe(400);
    });

    it("should delete non-active configuration", async () => {
      // Create a new non-active config
      const createResponse = await app.handle(
        new Request("http://localhost/api/world-config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Delete Me",
            description: "To be deleted",
          }),
        }),
      );

      if (createResponse.status === 200) {
        const createData = await createResponse.json();
        const configId = createData.config.id;

        const response = await app.handle(
          new Request(`http://localhost/api/world-config/${configId}`, {
            method: "DELETE",
          }),
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/world-config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: "{invalid json",
        }),
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle invalid UUIDs", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/world-config/not-a-uuid"),
      );

      expect([404, 500]).toContain(response.status);
    });
  });
});
