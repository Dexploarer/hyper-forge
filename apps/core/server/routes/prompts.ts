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
import { NotFoundError, ForbiddenError } from "../errors";
import { randomUUID } from "crypto";

/**
 * TypeBox schema for JSON-serializable values
 * Matches the JSONValue type from service-types.ts
 */
const JSONValue: any = t.Recursive((Self) =>
  t.Union([
    t.String(),
    t.Number(),
    t.Boolean(),
    t.Null(),
    t.Array(Self),
    t.Record(t.String(), Self),
  ]),
);

export const promptRoutes = new Elysia({ prefix: "/api/prompts" })
  // Public routes - Get prompts by type
  .get(
    "/:type",
    async ({ params, query }) => {
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

      if (!systemPrompt) {
        throw new NotFoundError("Prompt", type);
      }

      // Safe type check before spreading
      const content = systemPrompt.content;
      if (
        typeof content !== "object" ||
        content === null ||
        Array.isArray(content)
      ) {
        logger.error(
          { promptId: systemPrompt.id, contentType: typeof content },
          "Invalid prompt content structure",
        );
        throw new Error("Invalid prompt content structure");
      }

      logger.info({ type, promptId: systemPrompt.id }, "Prompt loaded");

      return {
        ...content,
        _metadata: {
          id: systemPrompt.id,
          version: systemPrompt.version,
          isSystem: systemPrompt.isSystem,
        },
      };
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

  // Authenticated routes for custom prompt management
  .use(requireAuthGuard)

  // Create custom prompt (user-created)
  .post(
    "/custom",
    async ({ body, set, user }) => {
      const promptId = randomUUID();

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
        { promptId: newPrompt.id, userId: user.id, type: body.type },
        "Custom prompt created",
      );
      return newPrompt;
    },
    {
      body: t.Object({
        type: t.String(),
        name: t.String(),
        content: t.Record(t.String(), JSONValue), // Prompt content JSONB - flexible structure
        description: t.Optional(t.String()),
        isPublic: t.Optional(t.Boolean()),
        metadata: t.Optional(t.Record(t.String(), JSONValue)), // Additional metadata for prompt categorization
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
    async ({ params, body, user }) => {
      // First, fetch the prompt to check ownership
      const [existingPrompt] = await db
        .select()
        .from(prompts)
        .where(eq(prompts.id, params.id))
        .limit(1);

      if (!existingPrompt) {
        throw new NotFoundError("Custom prompt", params.id);
      }

      // Check if it's a system prompt (cannot be updated)
      if (existingPrompt.isSystem) {
        logger.warn(
          { promptId: params.id, userId: user.id },
          "Attempted to update system prompt",
        );
        throw new ForbiddenError("System prompts cannot be updated");
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
        throw new ForbiddenError("You can only update your own prompts");
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
        { promptId: params.id, userId: user.id, name: body.name },
        "Custom prompt updated",
      );
      return updatedPrompt;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.String(),
        content: t.Record(t.String(), JSONValue), // Prompt content JSONB - flexible structure
        description: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        isPublic: t.Optional(t.Boolean()),
        metadata: t.Optional(t.Record(t.String(), JSONValue)), // Additional metadata for prompt categorization
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
    async ({ params, user }) => {
      // First, fetch the prompt to check ownership
      const [existingPrompt] = await db
        .select()
        .from(prompts)
        .where(eq(prompts.id, params.id))
        .limit(1);

      if (!existingPrompt) {
        throw new NotFoundError("Custom prompt", params.id);
      }

      // Check if it's a system prompt (cannot be deleted)
      if (existingPrompt.isSystem) {
        logger.warn(
          { promptId: params.id, userId: user.id },
          "Attempted to delete system prompt",
        );
        throw new ForbiddenError("System prompts cannot be deleted");
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
        throw new ForbiddenError("You can only delete your own prompts");
      }

      // Now delete
      await db.delete(prompts).where(eq(prompts.id, params.id)).returning();

      logger.info(
        { promptId: params.id, userId: user.id, type: existingPrompt.type },
        "Custom prompt deleted",
      );
      return { success: true, id: params.id };
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
    async ({ params, user }) => {
      // Authorization: Users can only view their own prompts (unless admin)
      if (params.userId !== user.id && user.role !== "admin") {
        logger.warn(
          { requestedUserId: params.userId, authenticatedUserId: user.id },
          "Unauthorized attempt to view user prompts",
        );
        throw new ForbiddenError("You can only view your own prompts");
      }

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
        {
          userId: params.userId,
          authenticatedUser: user.id,
          count: userPrompts.length,
        },
        "User prompts loaded",
      );

      return userPrompts;
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
