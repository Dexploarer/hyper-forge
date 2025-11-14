/**
 * Prompts Routes
 * CRUD operations for AI generation prompts
 * Supports both system prompts (from database) and user-created custom prompts
 */

import { Elysia, t } from "elysia";
import { db } from "../db";
import { prompts } from "../db/schema/prompts.schema";
import { eq, and, or, desc } from "drizzle-orm";
import { logger } from "../utils/logger";
import { requireAuth } from "../middleware/auth";

export const promptRoutes = new Elysia({ prefix: "/api/prompts" })
  // Get all prompts of a specific type
  .get(
    "/:type",
    async ({ params, query, set }) => {
      try {
        const { type } = params;
        const { includeInactive = "false" } = query;

        // Build query conditions
        const conditions = [eq(prompts.type, type)];

        if (includeInactive !== "true") {
          conditions.push(eq(prompts.isActive, true));
        }

        const results = await db
          .select()
          .from(prompts)
          .where(and(...conditions))
          .orderBy(desc(prompts.createdAt));

        // Return the first result for system prompts (there should only be one per type)
        // For user prompts, return all matching
        const systemPrompt = results.find((p) => p.isSystem);

        if (systemPrompt) {
          return {
            ...systemPrompt.content,
            _metadata: {
              id: systemPrompt.id,
              version: systemPrompt.version,
              isSystem: systemPrompt.isSystem,
            },
          };
        }

        set.status = 404;
        return { error: `No prompts found for type: ${type}` };
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          `Error loading prompts for type: ${params.type}`,
        );
        set.status = 500;
        return { error: "Failed to load prompts" };
      }
    },
    {
      params: t.Object({
        type: t.String(),
      }),
      query: t.Object({
        includeInactive: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Prompts"],
        summary: "Get prompts by type",
        description:
          "Retrieve prompt templates by type (generation, asset-type, game-style, material, etc.)",
      },
    },
  )

  // Backward compatibility routes for existing frontend code
  .get(
    "/game-styles",
    async ({ set }) => {
      try {
        const result = await db
          .select()
          .from(prompts)
          .where(
            and(eq(prompts.type, "game-style"), eq(prompts.isActive, true)),
          )
          .limit(1);

        if (result.length === 0) {
          set.status = 404;
          return { error: "Game style prompts not found" };
        }

        return result[0].content;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          "Error loading game style prompts",
        );
        set.status = 500;
        return { error: "Failed to load game style prompts" };
      }
    },
    {
      detail: {
        tags: ["Prompts"],
        summary: "Get game style prompts",
        description:
          "Retrieve game style prompt templates for asset generation",
      },
    },
  )

  .get(
    "/asset-types",
    async ({ set }) => {
      try {
        const result = await db
          .select()
          .from(prompts)
          .where(
            and(eq(prompts.type, "asset-type"), eq(prompts.isActive, true)),
          )
          .limit(1);

        if (result.length === 0) {
          set.status = 404;
          return { error: "Asset type prompts not found" };
        }

        return result[0].content;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          "Error loading asset type prompts",
        );
        set.status = 500;
        return { error: "Failed to load asset type prompts" };
      }
    },
    {
      detail: {
        tags: ["Prompts"],
        summary: "Get asset type prompts",
        description:
          "Retrieve asset type prompt templates for different asset categories",
      },
    },
  )

  .get(
    "/materials",
    async ({ set }) => {
      try {
        const result = await db
          .select()
          .from(prompts)
          .where(and(eq(prompts.type, "material"), eq(prompts.isActive, true)))
          .limit(1);

        if (result.length === 0) {
          set.status = 404;
          return { error: "Material prompts not found" };
        }

        return result[0].content;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          "Error loading material prompts",
        );
        set.status = 500;
        return { error: "Failed to load material prompts" };
      }
    },
    {
      detail: {
        tags: ["Prompts"],
        summary: "Get material prompts",
        description: "Retrieve material prompt templates for texturing",
      },
    },
  )

  .get(
    "/generation",
    async ({ set }) => {
      try {
        const result = await db
          .select()
          .from(prompts)
          .where(
            and(eq(prompts.type, "generation"), eq(prompts.isActive, true)),
          )
          .limit(1);

        if (result.length === 0) {
          set.status = 404;
          return { error: "Generation prompts not found" };
        }

        return result[0].content;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          "Error loading generation prompts",
        );
        set.status = 500;
        return { error: "Failed to load generation prompts" };
      }
    },
    {
      detail: {
        tags: ["Prompts"],
        summary: "Get generation prompts",
        description: "Retrieve generation prompt templates for the pipeline",
      },
    },
  )

  .get(
    "/gpt4-enhancement",
    async ({ set }) => {
      try {
        const result = await db
          .select()
          .from(prompts)
          .where(
            and(
              eq(prompts.type, "gpt4-enhancement"),
              eq(prompts.isActive, true),
            ),
          )
          .limit(1);

        if (result.length === 0) {
          set.status = 404;
          return { error: "GPT-4 enhancement prompts not found" };
        }

        return result[0].content;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          "Error loading GPT-4 enhancement prompts",
        );
        set.status = 500;
        return { error: "Failed to load GPT-4 enhancement prompts" };
      }
    },
    {
      detail: {
        tags: ["Prompts"],
        summary: "Get GPT-4 enhancement prompts",
        description: "Retrieve GPT-4 prompt enhancement templates",
      },
    },
  )

  .get(
    "/weapon-detection",
    async ({ set }) => {
      try {
        const result = await db
          .select()
          .from(prompts)
          .where(
            and(
              eq(prompts.type, "weapon-detection"),
              eq(prompts.isActive, true),
            ),
          )
          .limit(1);

        if (result.length === 0) {
          set.status = 404;
          return { error: "Weapon detection prompts not found" };
        }

        return result[0].content;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          "Error loading weapon detection prompts",
        );
        set.status = 500;
        return { error: "Failed to load weapon detection prompts" };
      }
    },
    {
      detail: {
        tags: ["Prompts"],
        summary: "Get weapon detection prompts",
        description: "Retrieve weapon detection prompt templates for AI vision",
      },
    },
  )

  // Create custom prompt (user-created)
  .post(
    "/custom",
    async ({ body, set }) => {
      try {
        const promptId = `user-${body.type}-${Date.now()}`;

        const [newPrompt] = await db
          .insert(prompts)
          .values({
            id: promptId,
            type: body.type,
            name: body.name,
            content: body.content,
            description: body.description || null,
            version: "1.0",
            isSystem: false,
            isActive: true,
            isPublic: body.isPublic || false,
            createdBy: body.createdBy || null,
            metadata: body.metadata || {},
          })
          .returning();

        set.status = 201;
        return newPrompt;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          "Error creating custom prompt",
        );
        set.status = 500;
        return { error: "Failed to create custom prompt" };
      }
    },
    {
      body: t.Object({
        type: t.String(),
        name: t.String(),
        content: t.Any(), // JSONB content
        description: t.Optional(t.String()),
        isPublic: t.Optional(t.Boolean()),
        createdBy: t.Optional(t.String()),
        metadata: t.Optional(t.Any()),
      }),
      detail: {
        tags: ["Prompts"],
        summary: "Create custom prompt",
        description: "Create a new user-defined custom prompt template",
      },
    },
  )

  // Update custom prompt
  .put(
    "/custom/:id",
    async ({ params, body, set }) => {
      try {
        const [updatedPrompt] = await db
          .update(prompts)
          .set({
            name: body.name,
            content: body.content,
            description: body.description || null,
            isActive: body.isActive !== undefined ? body.isActive : true,
            isPublic: body.isPublic !== undefined ? body.isPublic : false,
            metadata: body.metadata || {},
            updatedAt: new Date(),
          })
          .where(and(eq(prompts.id, params.id), eq(prompts.isSystem, false)))
          .returning();

        if (!updatedPrompt) {
          set.status = 404;
          return { error: "Custom prompt not found or is a system prompt" };
        }

        return updatedPrompt;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          `Error updating custom prompt: ${params.id}`,
        );
        set.status = 500;
        return { error: "Failed to update custom prompt" };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.String(),
        content: t.Any(),
        description: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        isPublic: t.Optional(t.Boolean()),
        metadata: t.Optional(t.Any()),
      }),
      detail: {
        tags: ["Prompts"],
        summary: "Update custom prompt",
        description: "Update an existing user-defined custom prompt",
      },
    },
  )

  // Delete custom prompt
  .delete(
    "/custom/:id",
    async ({ params, set, request, headers }) => {
      // Require authentication (any authenticated user can delete)
      const authResult = await requireAuth({ request, headers });
      if (authResult instanceof Response) {
        set.status = 401;
        return { error: "Unauthorized - authentication required" };
      }

      try {
        const [deletedPrompt] = await db
          .delete(prompts)
          .where(and(eq(prompts.id, params.id), eq(prompts.isSystem, false)))
          .returning();

        if (!deletedPrompt) {
          set.status = 404;
          return { error: "Custom prompt not found or is a system prompt" };
        }

        return { success: true, id: params.id };
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          `Error deleting custom prompt: ${params.id}`,
        );
        set.status = 500;
        return { error: "Failed to delete custom prompt" };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Prompts"],
        summary: "Delete custom prompt",
        description:
          "Delete a user-defined custom prompt (system prompts cannot be deleted)",
      },
    },
  )

  // List all custom prompts for a user
  .get(
    "/custom/user/:userId",
    async ({ params, set, request, headers }) => {
      // Require authentication (any authenticated user can delete)
      const authResult = await requireAuth({ request, headers });
      if (authResult instanceof Response) {
        set.status = 401;
        return { error: "Unauthorized - authentication required" };
      }

      try {
        const userPrompts = await db
          .select()
          .from(prompts)
          .where(
            and(
              eq(prompts.createdBy, params.userId),
              eq(prompts.isSystem, false),
            ),
          )
          .orderBy(desc(prompts.createdAt));

        return userPrompts;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          `Error loading user prompts for: ${params.userId}`,
        );
        set.status = 500;
        return { error: "Failed to load user prompts" };
      }
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
      detail: {
        tags: ["Prompts"],
        summary: "List user's custom prompts",
        description: "Get all custom prompts created by a specific user",
      },
    },
  );
