/**
 * World Configuration API Routes
 * Master parameters for AI content generation
 */

import { Elysia, t } from "elysia";
import { logger } from "../utils/logger";
import { WorldConfigService } from "../services/WorldConfigService";
import * as Models from "../models";

const worldConfigService = new WorldConfigService();

export const worldConfigRoutes = new Elysia({
  prefix: "/api/world-config",
  name: "world-config",
}).guard(
  {
    beforeHandle: ({ request }) => {
      const url = new URL(request.url);
      logger.info(
        { context: "WorldConfig", method: request.method, path: url.pathname },
        "WorldConfig request",
      );
    },
  },
  (app) =>
    app
      // ========================
      // Core CRUD Endpoints (7)
      // ========================

      // GET /api/world-config - List configurations
      .get(
        "/",
        async ({ query, set }) => {
          try {
            const limit = query.limit ? parseInt(query.limit) : 50;
            const offset = query.offset ? parseInt(query.offset) : 0;
            const includeTemplates = query.includeTemplates === "true";

            const configs = await worldConfigService.listConfigurations({
              limit,
              offset,
              includeTemplates,
            });

            return {
              success: true,
              configs,
              count: configs.length,
            };
          } catch (error) {
            logger.error(
              { err: error },
              "[WorldConfig Route] Error listing configurations:",
            );
            set.status = 500;
            return {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to list configurations",
            };
          }
        },
        {
          query: t.Object({
            limit: t.Optional(t.String()),
            offset: t.Optional(t.String()),
            includeTemplates: t.Optional(t.String()),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "List all configurations",
            description: "Get all world configurations with pagination support",
          },
        },
      )

      // GET /api/world-config/active - Get active configuration
      .get(
        "/active",
        async ({ set }) => {
          try {
            const config = await worldConfigService.getActiveConfiguration();

            if (!config) {
              // Return success with null config - this is optional
              return {
                success: true,
                config: null,
              };
            }

            return {
              success: true,
              config,
            };
          } catch (error) {
            logger.error(
              { err: error },
              "[WorldConfig Route] Error getting active configuration:",
            );
            // Return success with null config - world config is optional
            return {
              success: true,
              config: null,
            };
          }
        },
        {
          detail: {
            tags: ["World Configuration"],
            summary: "Get active configuration",
            description:
              "Retrieve the currently active world configuration used for AI generation",
          },
        },
      )

      // GET /api/world-config/:id - Get configuration by ID
      .get(
        "/:id",
        async ({ params }) => {
          const config = await worldConfigService.getConfiguration(params.id);

          if (!config) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Configuration not found",
              }),
              { status: 404 },
            );
          }

          return {
            success: true,
            config,
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Get configuration by ID",
            description: "Retrieve a specific world configuration",
          },
        },
      )

      // POST /api/world-config - Create configuration
      .post(
        "/",
        async ({ body }) => {
          const bodyData = body as any;
          const config = await worldConfigService.createConfiguration(
            bodyData,
            bodyData.createdBy,
          );

          return {
            success: true,
            config,
            message: "Configuration created successfully",
          };
        },
        {
          body: Models.CreateWorldConfigRequest,
          detail: {
            tags: ["World Configuration"],
            summary: "Create new configuration",
            description:
              "Create a new world configuration with optional initial values",
          },
        },
      )

      // PUT /api/world-config/:id - Update configuration
      .put(
        "/:id",
        async ({ params, body }) => {
          const config = await worldConfigService.updateConfiguration(
            params.id,
            body as any,
          );

          return {
            success: true,
            config,
            message: "Configuration updated successfully",
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: Models.UpdateWorldConfigRequest,
          detail: {
            tags: ["World Configuration"],
            summary: "Update configuration",
            description: "Update an existing world configuration",
          },
        },
      )

      // PATCH /api/world-config/:id/section - Update specific section
      .patch(
        "/:id/section",
        async ({ params, body }) => {
          const config = await worldConfigService.updateSection(
            params.id,
            body.section,
            body.data,
          );

          return {
            success: true,
            config,
            message: `Section ${body.section} updated successfully`,
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: Models.PartialUpdateRequest,
          detail: {
            tags: ["World Configuration"],
            summary: "Update specific section",
            description:
              "Update only a specific section of the configuration (races, factions, etc.)",
          },
        },
      )

      // DELETE /api/world-config/:id - Delete configuration
      .delete(
        "/:id",
        async ({ params }) => {
          try {
            await worldConfigService.deleteConfiguration(params.id);

            return {
              success: true,
              message: "Configuration deleted successfully",
            };
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Delete failed";
            return new Response(
              JSON.stringify({
                success: false,
                error: message,
              }),
              { status: 400 },
            );
          }
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Delete configuration",
            description:
              "Delete a configuration (fails if it is currently active)",
          },
        },
      )

      // ========================
      // Active Management (1)
      // ========================

      // POST /api/world-config/:id/activate - Activate configuration
      .post(
        "/:id/activate",
        async ({ params, body }) => {
          const config = await worldConfigService.setActiveConfiguration(
            params.id,
            (body as any)?.activatedBy,
          );

          return {
            success: true,
            config,
            message: "Configuration activated successfully",
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Optional(
            t.Object({
              activatedBy: t.Optional(t.String()),
            }),
          ),
          detail: {
            tags: ["World Configuration"],
            summary: "Activate configuration",
            description:
              "Set this configuration as active (deactivates all others)",
          },
        },
      )

      // ========================
      // Templates (2)
      // ========================

      // GET /api/world-config/templates/list - Get all templates
      .get(
        "/templates/list",
        async () => {
          const templates = await worldConfigService.getTemplates();

          return {
            success: true,
            templates,
            count: templates.length,
          };
        },
        {
          detail: {
            tags: ["World Configuration"],
            summary: "List template configurations",
            description: "Get all configurations marked as templates",
          },
        },
      )

      // POST /api/world-config/from-template/:templateId - Create from template
      .post(
        "/from-template/:templateId",
        async ({ params, body }) => {
          const config = await worldConfigService.createFromTemplate(
            params.templateId,
            body.name,
            body.description,
          );

          return {
            success: true,
            config,
            message: "Configuration created from template",
          };
        },
        {
          params: t.Object({
            templateId: t.String(),
          }),
          body: t.Object({
            name: t.String({ minLength: 1 }),
            description: t.Optional(t.String()),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Create from template",
            description: "Create a new configuration from an existing template",
          },
        },
      )

      // ========================
      // Clone & Import/Export (3)
      // ========================

      // POST /api/world-config/clone - Clone configuration
      .post(
        "/clone",
        async ({ body }) => {
          const config = await worldConfigService.cloneConfiguration(
            body.sourceConfigId,
            body.newName,
            body.newDescription,
          );

          return {
            success: true,
            config,
            message: "Configuration cloned successfully",
          };
        },
        {
          body: Models.CloneConfigRequest,
          detail: {
            tags: ["World Configuration"],
            summary: "Clone configuration",
            description: "Create a copy of an existing configuration",
          },
        },
      )

      // GET /api/world-config/:id/export - Export configuration
      .get(
        "/:id/export",
        async ({ params }) => {
          const exportData = await worldConfigService.exportConfiguration(
            params.id,
          );

          return {
            success: true,
            data: exportData,
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Export configuration",
            description:
              "Export configuration as JSON (excludes sensitive fields)",
          },
        },
      )

      // POST /api/world-config/import - Import configuration
      .post(
        "/import",
        async ({ body }) => {
          const config = await worldConfigService.importConfiguration(
            body.jsonData,
            body.name,
          );

          return {
            success: true,
            config,
            message: "Configuration imported successfully",
          };
        },
        {
          body: t.Object({
            jsonData: t.Any(),
            name: t.String({ minLength: 1 }),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Import configuration",
            description: "Import a configuration from JSON data",
          },
        },
      )

      // ========================
      // Validation & AI (2)
      // ========================

      // GET /api/world-config/:id/validate - Validate configuration
      .get(
        "/:id/validate",
        async ({ params }) => {
          const result = await worldConfigService.validateConfiguration(
            params.id,
          );

          return {
            success: true,
            ...result,
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          response: Models.ValidateConfigResponse,
          detail: {
            tags: ["World Configuration"],
            summary: "Validate configuration",
            description:
              "Check configuration for errors and warnings (e.g., invalid references)",
          },
        },
      )

      // GET /api/world-config/:id/ai-context - Build AI context
      .get(
        "/:id/ai-context",
        async ({ params, set }) => {
          const config = await worldConfigService.getConfiguration(params.id);
          if (!config) {
            set.status = 404;
            return {
              success: false,
              error: "Configuration not found",
            };
          }

          const { context, sections } = await worldConfigService.buildAIContext(
            params.id,
          );

          return {
            success: true,
            context,
            configId: config.id,
            configName: config.name,
            sections,
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Build AI context",
            description:
              "Generate comprehensive AI-ready context string from configuration",
          },
        },
      )

      // ========================
      // Sub-resources - Races (4)
      // ========================

      // POST /api/world-config/:id/races - Add race
      .post(
        "/:id/races",
        async ({ params, body }) => {
          const config = await worldConfigService.getConfiguration(params.id);
          if (!config) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Configuration not found",
              }),
              { status: 404 },
            );
          }

          // Add new race with generated ID and timestamp
          const newRace = {
            ...body,
            id: `race_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
          };

          const updatedConfig = await worldConfigService.updateSection(
            params.id,
            "races",
            [...config.races, newRace],
          );

          return {
            success: true,
            config: updatedConfig,
            race: newRace,
            message: "Race added successfully",
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            name: t.String({ minLength: 1 }),
            description: t.String(),
            traits: t.Array(t.String()),
            culturalBackground: t.String(),
            enabled: t.Boolean(),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Add race",
            description: "Add a new race to the configuration",
          },
        },
      )

      // PUT /api/world-config/:id/races/:raceId - Update race
      .put(
        "/:id/races/:raceId",
        async ({ params, body }) => {
          const config = await worldConfigService.getConfiguration(params.id);
          if (!config) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Configuration not found",
              }),
              { status: 404 },
            );
          }

          const raceIndex = config.races.findIndex(
            (r) => r.id === params.raceId,
          );
          if (raceIndex === -1) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Race not found",
              }),
              { status: 404 },
            );
          }

          const updatedRaces = [...config.races];
          updatedRaces[raceIndex] = {
            ...updatedRaces[raceIndex],
            ...body,
          };

          const updatedConfig = await worldConfigService.updateSection(
            params.id,
            "races",
            updatedRaces,
          );

          return {
            success: true,
            config: updatedConfig,
            race: updatedRaces[raceIndex],
            message: "Race updated successfully",
          };
        },
        {
          params: t.Object({
            id: t.String(),
            raceId: t.String(),
          }),
          body: t.Partial(Models.WorldRace),
          detail: {
            tags: ["World Configuration"],
            summary: "Update race",
            description: "Update an existing race in the configuration",
          },
        },
      )

      // DELETE /api/world-config/:id/races/:raceId - Delete race
      .delete(
        "/:id/races/:raceId",
        async ({ params }) => {
          const config = await worldConfigService.getConfiguration(params.id);
          if (!config) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Configuration not found",
              }),
              { status: 404 },
            );
          }

          const updatedRaces = config.races.filter(
            (r) => r.id !== params.raceId,
          );

          const updatedConfig = await worldConfigService.updateSection(
            params.id,
            "races",
            updatedRaces,
          );

          return {
            success: true,
            config: updatedConfig,
            message: "Race deleted successfully",
          };
        },
        {
          params: t.Object({
            id: t.String(),
            raceId: t.String(),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Delete race",
            description: "Remove a race from the configuration",
          },
        },
      )

      // PATCH /api/world-config/:id/races/:raceId/toggle - Toggle race enabled
      .patch(
        "/:id/races/:raceId/toggle",
        async ({ params, body }) => {
          const config = await worldConfigService.getConfiguration(params.id);
          if (!config) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Configuration not found",
              }),
              { status: 404 },
            );
          }

          const raceIndex = config.races.findIndex(
            (r) => r.id === params.raceId,
          );
          if (raceIndex === -1) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Race not found",
              }),
              { status: 404 },
            );
          }

          const updatedRaces = [...config.races];
          updatedRaces[raceIndex].enabled = body.enabled;

          const updatedConfig = await worldConfigService.updateSection(
            params.id,
            "races",
            updatedRaces,
          );

          return {
            success: true,
            config: updatedConfig,
            race: updatedRaces[raceIndex],
            message: `Race ${body.enabled ? "enabled" : "disabled"} successfully`,
          };
        },
        {
          params: t.Object({
            id: t.String(),
            raceId: t.String(),
          }),
          body: t.Object({
            enabled: t.Boolean(),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Toggle race enabled/disabled",
            description: "Enable or disable a race in the configuration",
          },
        },
      )

      // ========================
      // Sub-resources - Factions (4)
      // ========================

      // POST /api/world-config/:id/factions - Add faction
      .post(
        "/:id/factions",
        async ({ params, body }) => {
          const config = await worldConfigService.getConfiguration(params.id);
          if (!config) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Configuration not found",
              }),
              { status: 404 },
            );
          }

          const newFaction = {
            ...body,
            id: `faction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
          };

          const updatedConfig = await worldConfigService.updateSection(
            params.id,
            "factions",
            [...config.factions, newFaction],
          );

          return {
            success: true,
            config: updatedConfig,
            faction: newFaction,
            message: "Faction added successfully",
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            name: t.String({ minLength: 1 }),
            description: t.String(),
            alignment: t.Union([
              t.Literal("good"),
              t.Literal("neutral"),
              t.Literal("evil"),
            ]),
            goals: t.Array(t.String()),
            rivals: t.Array(t.String()),
            allies: t.Array(t.String()),
            enabled: t.Boolean(),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Add faction",
            description: "Add a new faction to the configuration",
          },
        },
      )

      // PUT /api/world-config/:id/factions/:factionId - Update faction
      .put(
        "/:id/factions/:factionId",
        async ({ params, body }) => {
          const config = await worldConfigService.getConfiguration(params.id);
          if (!config) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Configuration not found",
              }),
              { status: 404 },
            );
          }

          const factionIndex = config.factions.findIndex(
            (f) => f.id === params.factionId,
          );
          if (factionIndex === -1) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Faction not found",
              }),
              { status: 404 },
            );
          }

          const updatedFactions = [...config.factions];
          updatedFactions[factionIndex] = {
            ...updatedFactions[factionIndex],
            ...body,
          };

          const updatedConfig = await worldConfigService.updateSection(
            params.id,
            "factions",
            updatedFactions,
          );

          return {
            success: true,
            config: updatedConfig,
            faction: updatedFactions[factionIndex],
            message: "Faction updated successfully",
          };
        },
        {
          params: t.Object({
            id: t.String(),
            factionId: t.String(),
          }),
          body: t.Partial(Models.WorldFaction),
          detail: {
            tags: ["World Configuration"],
            summary: "Update faction",
            description: "Update an existing faction in the configuration",
          },
        },
      )

      // DELETE /api/world-config/:id/factions/:factionId - Delete faction
      .delete(
        "/:id/factions/:factionId",
        async ({ params }) => {
          const config = await worldConfigService.getConfiguration(params.id);
          if (!config) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Configuration not found",
              }),
              { status: 404 },
            );
          }

          const updatedFactions = config.factions.filter(
            (f) => f.id !== params.factionId,
          );

          const updatedConfig = await worldConfigService.updateSection(
            params.id,
            "factions",
            updatedFactions,
          );

          return {
            success: true,
            config: updatedConfig,
            message: "Faction deleted successfully",
          };
        },
        {
          params: t.Object({
            id: t.String(),
            factionId: t.String(),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Delete faction",
            description: "Remove a faction from the configuration",
          },
        },
      )

      // PATCH /api/world-config/:id/factions/:factionId/toggle - Toggle faction enabled
      .patch(
        "/:id/factions/:factionId/toggle",
        async ({ params, body }) => {
          const config = await worldConfigService.getConfiguration(params.id);
          if (!config) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Configuration not found",
              }),
              { status: 404 },
            );
          }

          const factionIndex = config.factions.findIndex(
            (f) => f.id === params.factionId,
          );
          if (factionIndex === -1) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Faction not found",
              }),
              { status: 404 },
            );
          }

          const updatedFactions = [...config.factions];
          updatedFactions[factionIndex].enabled = body.enabled;

          const updatedConfig = await worldConfigService.updateSection(
            params.id,
            "factions",
            updatedFactions,
          );

          return {
            success: true,
            config: updatedConfig,
            faction: updatedFactions[factionIndex],
            message: `Faction ${body.enabled ? "enabled" : "disabled"} successfully`,
          };
        },
        {
          params: t.Object({
            id: t.String(),
            factionId: t.String(),
          }),
          body: t.Object({
            enabled: t.Boolean(),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Toggle faction enabled/disabled",
            description: "Enable or disable a faction in the configuration",
          },
        },
      )

      // ========================
      // Sub-resources - Skills (4)
      // ========================

      // POST /api/world-config/:id/skills - Add skill
      .post(
        "/:id/skills",
        async ({ params, body }) => {
          const config = await worldConfigService.getConfiguration(params.id);
          if (!config) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Configuration not found",
              }),
              { status: 404 },
            );
          }

          const newSkill = {
            ...body,
            id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
          };

          const updatedConfig = await worldConfigService.updateSection(
            params.id,
            "skills",
            [...config.skills, newSkill],
          );

          return {
            success: true,
            config: updatedConfig,
            skill: newSkill,
            message: "Skill added successfully",
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            name: t.String({ minLength: 1 }),
            category: t.Union([
              t.Literal("combat"),
              t.Literal("magic"),
              t.Literal("stealth"),
              t.Literal("social"),
              t.Literal("crafting"),
            ]),
            description: t.String(),
            prerequisites: t.Array(t.String()),
            tier: t.Number({ minimum: 1, maximum: 5 }),
            enabled: t.Boolean(),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Add skill",
            description: "Add a new skill to the configuration",
          },
        },
      )

      // PUT /api/world-config/:id/skills/:skillId - Update skill
      .put(
        "/:id/skills/:skillId",
        async ({ params, body }) => {
          const config = await worldConfigService.getConfiguration(params.id);
          if (!config) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Configuration not found",
              }),
              { status: 404 },
            );
          }

          const skillIndex = config.skills.findIndex(
            (s) => s.id === params.skillId,
          );
          if (skillIndex === -1) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Skill not found",
              }),
              { status: 404 },
            );
          }

          const updatedSkills = [...config.skills];
          updatedSkills[skillIndex] = {
            ...updatedSkills[skillIndex],
            ...body,
          };

          const updatedConfig = await worldConfigService.updateSection(
            params.id,
            "skills",
            updatedSkills,
          );

          return {
            success: true,
            config: updatedConfig,
            skill: updatedSkills[skillIndex],
            message: "Skill updated successfully",
          };
        },
        {
          params: t.Object({
            id: t.String(),
            skillId: t.String(),
          }),
          body: t.Partial(Models.WorldSkill),
          detail: {
            tags: ["World Configuration"],
            summary: "Update skill",
            description: "Update an existing skill in the configuration",
          },
        },
      )

      // DELETE /api/world-config/:id/skills/:skillId - Delete skill
      .delete(
        "/:id/skills/:skillId",
        async ({ params }) => {
          const config = await worldConfigService.getConfiguration(params.id);
          if (!config) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Configuration not found",
              }),
              { status: 404 },
            );
          }

          const updatedSkills = config.skills.filter(
            (s) => s.id !== params.skillId,
          );

          const updatedConfig = await worldConfigService.updateSection(
            params.id,
            "skills",
            updatedSkills,
          );

          return {
            success: true,
            config: updatedConfig,
            message: "Skill deleted successfully",
          };
        },
        {
          params: t.Object({
            id: t.String(),
            skillId: t.String(),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Delete skill",
            description: "Remove a skill from the configuration",
          },
        },
      )

      // PATCH /api/world-config/:id/skills/:skillId/toggle - Toggle skill enabled
      .patch(
        "/:id/skills/:skillId/toggle",
        async ({ params, body }) => {
          const config = await worldConfigService.getConfiguration(params.id);
          if (!config) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Configuration not found",
              }),
              { status: 404 },
            );
          }

          const skillIndex = config.skills.findIndex(
            (s) => s.id === params.skillId,
          );
          if (skillIndex === -1) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Skill not found",
              }),
              { status: 404 },
            );
          }

          const updatedSkills = [...config.skills];
          updatedSkills[skillIndex].enabled = body.enabled;

          const updatedConfig = await worldConfigService.updateSection(
            params.id,
            "skills",
            updatedSkills,
          );

          return {
            success: true,
            config: updatedConfig,
            skill: updatedSkills[skillIndex],
            message: `Skill ${body.enabled ? "enabled" : "disabled"} successfully`,
          };
        },
        {
          params: t.Object({
            id: t.String(),
            skillId: t.String(),
          }),
          body: t.Object({
            enabled: t.Boolean(),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Toggle skill enabled/disabled",
            description: "Enable or disable a skill in the configuration",
          },
        },
      )

      // ========================
      // History (1)
      // ========================

      // GET /api/world-config/:id/history - Get change history
      .get(
        "/:id/history",
        async ({ params, query }) => {
          const limit = query.limit ? parseInt(query.limit) : 50;

          const history = await worldConfigService.getConfigurationHistory(
            params.id,
            limit,
          );

          return {
            success: true,
            history,
            count: history.length,
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          query: t.Object({
            limit: t.Optional(t.String()),
          }),
          detail: {
            tags: ["World Configuration"],
            summary: "Get configuration history",
            description:
              "Retrieve change history for a configuration (for versioning/audit)",
          },
        },
      ),
);
