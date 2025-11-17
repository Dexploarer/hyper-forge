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
import { requireAuthGuard } from "../plugins/auth.plugin";

export const promptRoutes = new Elysia({ prefix: "/api/prompts" })
  // Public routes - Get prompts by type
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
            ...(systemPrompt.content as object),
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

  // Authenticated routes for custom prompt management
  .use(requireAuthGuard)

  // Create custom prompt (user-created)
  .post(
    "/custom",
    async ({ body, set, user }) => {
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
            createdBy: user.id, // Use authenticated user's ID
            metadata: body.metadata || {},
          })
          .returning();

        set.status = 201;
        logger.info(
          { promptId: newPrompt.id, userId: user.id },
          "Custom prompt created",
        );
        return newPrompt;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error, userId: user.id },
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
        content: t.Record(t.String(), t.Unknown()), // Prompt content JSONB - flexible structure
        description: t.Optional(t.String()),
        isPublic: t.Optional(t.Boolean()),
        metadata: t.Optional(t.Record(t.String(), t.Unknown())), // Additional metadata for prompt categorization
      }),
      detail: {
        tags: ["Prompts"],
        summary: "Create custom prompt",
        description: "Create a new user-defined custom prompt template",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // Update custom prompt
  .put(
    "/custom/:id",
    async ({ params, body, set, user }) => {
      try {
        // First, fetch the prompt to check ownership
        const [existingPrompt] = await db
          .select()
          .from(prompts)
          .where(eq(prompts.id, params.id))
          .limit(1);

        if (!existingPrompt) {
          set.status = 404;
          return { error: "Custom prompt not found" };
        }

        // Check if it's a system prompt (cannot be updated)
        if (existingPrompt.isSystem) {
          logger.warn(
            { promptId: params.id, userId: user.id },
            "Attempted to update system prompt",
          );
          set.status = 403;
          return { error: "System prompts cannot be updated" };
        }

        // Check ownership (must be owner or admin)
        if (existingPrompt.createdBy !== user.id && user.role !== "admin") {
          logger.warn(
            {
              promptId: params.id,
              userId: user.id,
              ownerId: existingPrompt.createdBy,
            },
            "Unauthorized prompt update attempt",
          );
          set.status = 403;
          return { error: "Forbidden - you can only update your own prompts" };
        }

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
          .where(eq(prompts.id, params.id))
          .returning();

        logger.info(
          { promptId: params.id, userId: user.id },
          "Custom prompt updated",
        );
        return updatedPrompt;
      } catch (error) {
        logger.error(
          {
            context: "Prompts",
            err: error,
            promptId: params.id,
            userId: user.id,
          },
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
        content: t.Record(t.String(), t.Unknown()), // Prompt content JSONB - flexible structure
        description: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        isPublic: t.Optional(t.Boolean()),
        metadata: t.Optional(t.Record(t.String(), t.Unknown())), // Additional metadata for prompt categorization
      }),
      detail: {
        tags: ["Prompts"],
        summary: "Update custom prompt",
        description: "Update an existing user-defined custom prompt",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // Delete custom prompt
  .delete(
    "/custom/:id",
    async ({ params, set, user }) => {
      try {
        // First, fetch the prompt to check ownership
        const [existingPrompt] = await db
          .select()
          .from(prompts)
          .where(eq(prompts.id, params.id))
          .limit(1);

        if (!existingPrompt) {
          set.status = 404;
          return { error: "Custom prompt not found" };
        }

        // Check if it's a system prompt (cannot be deleted)
        if (existingPrompt.isSystem) {
          logger.warn(
            { promptId: params.id, userId: user.id },
            "Attempted to delete system prompt",
          );
          set.status = 403;
          return { error: "System prompts cannot be deleted" };
        }

        // Check ownership (must be owner or admin)
        if (existingPrompt.createdBy !== user.id && user.role !== "admin") {
          logger.warn(
            {
              promptId: params.id,
              userId: user.id,
              ownerId: existingPrompt.createdBy,
            },
            "Unauthorized prompt deletion attempt",
          );
          set.status = 403;
          return { error: "Forbidden - you can only delete your own prompts" };
        }

        // Now delete
        const [deletedPrompt] = await db
          .delete(prompts)
          .where(eq(prompts.id, params.id))
          .returning();

        logger.info(
          { promptId: params.id, userId: user.id },
          "Custom prompt deleted",
        );
        return { success: true, id: params.id };
      } catch (error) {
        logger.error(
          {
            context: "Prompts",
            err: error,
            promptId: params.id,
            userId: user.id,
          },
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
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // List all custom prompts for a user
  .get(
    "/custom/user/:userId",
    async ({ params, set, user }) => {
      // Authorization: Users can only view their own prompts (unless admin)
      if (params.userId !== user.id && user.role !== "admin") {
        logger.warn(
          { requestedUserId: params.userId, authenticatedUserId: user.id },
          "Unauthorized attempt to view user prompts",
        );
        set.status = 403;
        return { error: "Forbidden - you can only view your own prompts" };
      }

      try {
        logger.info(
          {
            context: "Prompts",
            userId: params.userId,
            authenticatedUser: user.id,
          },
          "Loading user prompts",
        );

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

        logger.info(
          { context: "Prompts", count: userPrompts.length },
          "User prompts loaded successfully",
        );

        return userPrompts;
      } catch (error) {
        logger.error(
          {
            context: "Prompts",
            err: error,
            errorMessage:
              error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            userId: params.userId,
          },
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
        security: [{ BearerAuth: [] }],
      },
    },
  );
