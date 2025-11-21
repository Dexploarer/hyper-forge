/**
 * Material Presets Routes
 * CRUD operations for material presets
 * Supports both system presets (from database) and user-created custom presets
 */

import { Elysia, t } from "elysia";
import { db } from "../db";
import { materialPresets } from "../db/schema/material-presets.schema";
import { eq, and, or, desc, asc, sql } from "drizzle-orm";
import { logger } from "../utils/logger";
import * as Models from "../models";
import { authPlugin } from "../plugins/auth.plugin";
import { NotFoundError, ForbiddenError, InternalServerError } from "../errors";

/**
 * Helper: Build visibility filter conditions for material presets
 * Returns system presets, public presets, and optionally user's private presets
 *
 * @param userId - Optional user ID to include private presets
 * @returns Array of conditions for Drizzle where clause
 */
function buildVisibilityConditions(userId?: string) {
  // Always show system presets and public presets
  // If userId is provided, also show that user's private presets
  if (userId) {
    // or() can return SQL | undefined, but with 3 valid conditions it's guaranteed to return SQL
    // The non-null assertion is safe here because we're passing valid eq() conditions
    return or(
      eq(materialPresets.isSystem, true),
      eq(materialPresets.isPublic, true),
      eq(materialPresets.createdBy, userId),
    )!;
  }

  // Same guarantee for 2 valid conditions
  return or(
    eq(materialPresets.isSystem, true),
    eq(materialPresets.isPublic, true),
  )!;
}

export const materialRoutes = new Elysia({ prefix: "/api", name: "materials" })
  // Get all material presets (system + public user presets)
  .get(
    "/material-presets",
    async ({ query, set }) => {
      try {
        const { category, tier, includeInactive = "false", userId } = query;

        // Build query conditions using helper
        const conditions = [buildVisibilityConditions(userId)];

        if (includeInactive !== "true") {
          conditions.push(eq(materialPresets.isActive, true));
        }

        if (category) {
          conditions.push(eq(materialPresets.category, category));
        }

        if (tier) {
          conditions.push(eq(materialPresets.tier, parseInt(tier)));
        }

        const results = await db
          .select()
          .from(materialPresets)
          .where(and(...conditions))
          .orderBy(asc(materialPresets.tier), asc(materialPresets.name));

        return results;
      } catch (error) {
        logger.error(
          { context: "Material Presets", err: error },
          "Error loading material presets",
        );
        throw new InternalServerError("Failed to load material presets", {
          originalError: error,
        });
      }
    },
    {
      query: t.Object({
        category: t.Optional(t.String()),
        tier: t.Optional(t.String()),
        includeInactive: t.Optional(t.String()),
        userId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Material Presets"],
        summary: "Get all material presets",
        description:
          "Returns system presets, public user presets, and optionally user's private presets if userId is provided",
      },
    },
  )

  // Get single material preset by ID
  .get(
    "/material-presets/:id",
    async ({ params, set }) => {
      try {
        const [preset] = await db
          .select()
          .from(materialPresets)
          .where(eq(materialPresets.id, params.id))
          .limit(1);

        if (!preset) {
          throw new NotFoundError("Material preset", params.id);
        }

        return preset;
      } catch (error) {
        // Re-throw ApiErrors as-is
        if (
          error instanceof NotFoundError ||
          error instanceof InternalServerError
        ) {
          throw error;
        }

        logger.error(
          { context: "Material Presets", err: error },
          `Error loading material preset: ${params.id}`,
        );
        throw new InternalServerError("Failed to load material preset", {
          originalError: error,
          presetId: params.id,
        });
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Material Presets"],
        summary: "Get material preset by ID",
        description: "Retrieve a single material preset by its ID",
      },
    },
  )

  // Get material presets grouped by category (public endpoint)
  .get(
    "/material-presets/by-category",
    async ({ query, set }) => {
      try {
        const { userId, includeInactive = "false" } = query;

        // Build query conditions using helper
        const conditions = [buildVisibilityConditions(userId)];

        if (includeInactive !== "true") {
          conditions.push(eq(materialPresets.isActive, true));
        }

        const results = await db
          .select()
          .from(materialPresets)
          .where(and(...conditions))
          .orderBy(asc(materialPresets.tier), asc(materialPresets.name));

        // Group by category
        const grouped = results.reduce(
          (acc, preset) => {
            if (!acc[preset.category]) {
              acc[preset.category] = [];
            }
            acc[preset.category].push(preset);
            return acc;
          },
          {} as Record<string, typeof results>,
        );

        return grouped;
      } catch (error) {
        logger.error(
          { context: "Material Presets", err: error },
          "Error loading material presets by category",
        );
        throw new InternalServerError(
          "Failed to load material presets by category",
          { originalError: error },
        );
      }
    },
    {
      query: t.Object({
        userId: t.Optional(t.String()),
        includeInactive: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Material Presets"],
        summary: "Get material presets grouped by category",
        description:
          "Returns material presets organized by category (metal, leather, wood, custom, etc.)",
      },
    },
  )

  // Create custom material preset (user-created)
  .post(
    "/material-presets/custom",
    async ({ body, set }) => {
      try {
        const presetId = `user-${body.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

        const [newPreset] = await db
          .insert(materialPresets)
          .values({
            id: presetId,
            name: body.name.toLowerCase().replace(/\s+/g, "-"),
            displayName: body.displayName,
            stylePrompt: body.stylePrompt,
            description: body.description || null,
            category: body.category,
            tier: body.tier || 1,
            color: body.color || null,
            isSystem: false,
            isActive: true,
            isPublic: body.isPublic || false,
            createdBy: body.createdBy || null,
            metadata: body.metadata || {},
          })
          .returning();

        return newPreset;
      } catch (error) {
        logger.error(
          { context: "Material Presets", err: error },
          "Error creating custom material preset",
        );
        throw new InternalServerError(
          "Failed to create custom material preset",
          {
            originalError: error,
          },
        );
      }
    },
    {
      body: t.Object({
        displayName: t.String(),
        name: t.String(),
        stylePrompt: t.String(),
        category: t.String(),
        description: t.Optional(t.String()),
        tier: t.Optional(t.Number()),
        color: t.Optional(t.String()),
        isPublic: t.Optional(t.Boolean()),
        createdBy: t.Optional(t.String()),
        metadata: t.Optional(t.Record(t.String(), t.Unknown())), // Material preset metadata - custom properties
      }),
      detail: {
        tags: ["Material Presets"],
        summary: "Create custom material preset",
        description: "Create a new user-defined custom material preset",
      },
    },
  )

  // Authenticated routes for material preset management
  .use(authPlugin)

  // Update material preset
  .put(
    "/material-presets/:id",
    async ({ params, body, set, user }) => {
      try {
        // First, fetch the preset to check ownership
        const [existingPreset] = await db
          .select()
          .from(materialPresets)
          .where(eq(materialPresets.id, params.id))
          .limit(1);

        if (!existingPreset) {
          throw new NotFoundError("Material preset", params.id);
        }

        // Check if it's a system preset (cannot be updated)
        if (existingPreset.isSystem) {
          logger.warn(
            { presetId: params.id, userId: user?.id || "anonymous" },
            "Attempted to update system material preset",
          );
          throw new ForbiddenError("System presets cannot be updated", {
            presetId: params.id,
            userId: user?.id || "anonymous",
          });
        }

        // Update the preset (ownership check removed for single-team simplification)
        const [updatedPreset] = await db
          .update(materialPresets)
          .set({
            displayName: body.displayName,
            stylePrompt: body.stylePrompt,
            description: body.description || null,
            category: body.category,
            tier: body.tier,
            color: body.color || null,
            isActive: body.isActive !== undefined ? body.isActive : true,
            isPublic: body.isPublic !== undefined ? body.isPublic : false,
            metadata: body.metadata || {},
            updatedAt: new Date(),
          })
          .where(eq(materialPresets.id, params.id))
          .returning();

        logger.info(
          { presetId: params.id, userId: user?.id || "anonymous" },
          "Material preset updated",
        );
        return updatedPreset;
      } catch (error) {
        // Re-throw ApiErrors as-is
        if (
          error instanceof NotFoundError ||
          error instanceof ForbiddenError ||
          error instanceof InternalServerError
        ) {
          throw error;
        }

        logger.error(
          {
            context: "Material Presets",
            err: error,
            presetId: params.id,
            userId: user?.id || "anonymous",
          },
          `Error updating material preset: ${params.id}`,
        );
        throw new InternalServerError("Failed to update material preset", {
          originalError: error,
          presetId: params.id,
          userId: user?.id || "anonymous",
        });
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        displayName: t.String(),
        stylePrompt: t.String(),
        category: t.String(),
        tier: t.Number(),
        description: t.Optional(t.String()),
        color: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        isPublic: t.Optional(t.Boolean()),
        metadata: t.Optional(t.Record(t.String(), t.Unknown())), // Material preset metadata - custom properties
      }),
      detail: {
        tags: ["Material Presets"],
        summary: "Update material preset",
        description:
          "Update an existing user-defined material preset (system presets cannot be updated)",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // Delete material preset
  .delete(
    "/material-presets/:id",
    async ({ params, set, user }) => {
      try {
        // First, fetch the preset to check ownership
        const [existingPreset] = await db
          .select()
          .from(materialPresets)
          .where(eq(materialPresets.id, params.id))
          .limit(1);

        if (!existingPreset) {
          throw new NotFoundError("Material preset", params.id);
        }

        // Check if it's a system preset (cannot be deleted)
        if (existingPreset.isSystem) {
          logger.warn(
            { presetId: params.id, userId: user?.id || "anonymous" },
            "Attempted to delete system material preset",
          );
          throw new ForbiddenError("System presets cannot be deleted", {
            presetId: params.id,
            userId: user?.id || "anonymous",
          });
        }

        // Delete the preset (ownership check removed for single-team simplification)
        const [deletedPreset] = await db
          .delete(materialPresets)
          .where(eq(materialPresets.id, params.id))
          .returning();

        logger.info(
          { presetId: params.id, userId: user?.id || "anonymous" },
          "Material preset deleted",
        );
        return { success: true, id: params.id };
      } catch (error) {
        // Re-throw ApiErrors as-is
        if (
          error instanceof NotFoundError ||
          error instanceof ForbiddenError ||
          error instanceof InternalServerError
        ) {
          throw error;
        }

        logger.error(
          {
            context: "Material Presets",
            err: error,
            presetId: params.id,
            userId: user?.id || "anonymous",
          },
          `Error deleting material preset: ${params.id}`,
        );
        throw new InternalServerError("Failed to delete material preset", {
          originalError: error,
          presetId: params.id,
          userId: user?.id || "anonymous",
        });
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Material Presets"],
        summary: "Delete material preset",
        description:
          "Delete a user-defined material preset (system presets cannot be deleted)",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // List user's custom material presets
  .get(
    "/material-presets/user/:userId",
    async ({ params, set, user }) => {
      // Note: Any authenticated user can view user presets (not just the owner)
      // This allows discovery of public presets by other users
      try {
        const userPresets = await db
          .select()
          .from(materialPresets)
          .where(
            and(
              eq(materialPresets.createdBy, params.userId),
              eq(materialPresets.isSystem, false),
            ),
          )
          .orderBy(desc(materialPresets.createdAt));

        return userPresets;
      } catch (error) {
        logger.error(
          { context: "Material Presets", err: error },
          `Error loading user material presets for: ${params.userId}`,
        );
        throw new InternalServerError("Failed to load user material presets", {
          originalError: error,
          userId: params.userId,
        });
      }
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
      detail: {
        tags: ["Material Presets"],
        summary: "List user's custom material presets",
        description:
          "Get all custom material presets created by a specific user",
        security: [{ BearerAuth: [] }],
      },
    },
  );
