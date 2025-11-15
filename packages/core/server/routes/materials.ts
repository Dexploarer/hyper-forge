/**
 * Material Presets Routes
 * CRUD operations for material presets
 * Supports both system presets (from database) and user-created custom presets
 */

import { Elysia, t } from "elysia";
import { db } from "../db";
import { materialPresets } from "../db/schema/material-presets.schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { logger } from "../utils/logger";
import * as Models from "../models";
import { requireAuth } from "../middleware/auth";

export const createMaterialRoutes = (rootDir: string) => {
  return (
    new Elysia({ prefix: "/api", name: "materials" })
      // Get all material presets (system + public user presets)
      .get(
        "/material-presets",
        async ({ query, set }) => {
          try {
            const { category, tier, includeInactive = "false", userId } = query;

            // Build query conditions
            const conditions = [];

            // Always show system presets and public presets
            // If userId is provided, also show that user's private presets
            if (userId) {
              conditions.push(
                or(
                  eq(materialPresets.isSystem, true),
                  eq(materialPresets.isPublic, true),
                  eq(materialPresets.createdBy, userId),
                )!,
              );
            } else {
              conditions.push(
                or(
                  eq(materialPresets.isSystem, true),
                  eq(materialPresets.isPublic, true),
                )!,
              );
            }

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
              .orderBy(materialPresets.tier, materialPresets.name);

            return results;
          } catch (error) {
            logger.error(
              { context: "Material Presets", err: error },
              "Error loading material presets",
            );
            set.status = 500;
            return { error: "Failed to load material presets" };
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
              set.status = 404;
              return { error: "Material preset not found" };
            }

            return preset;
          } catch (error) {
            logger.error(
              { context: "Material Presets", err: error },
              `Error loading material preset: ${params.id}`,
            );
            set.status = 500;
            return { error: "Failed to load material preset" };
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

            set.status = 201;
            return newPreset;
          } catch (error) {
            logger.error(
              { context: "Material Presets", err: error },
              "Error creating custom material preset",
            );
            set.status = 500;
            return { error: "Failed to create custom material preset" };
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
            metadata: t.Optional(t.Any()),
          }),
          detail: {
            tags: ["Material Presets"],
            summary: "Create custom material preset",
            description: "Create a new user-defined custom material preset",
          },
        },
      )

      // Update material preset
      .put(
        "/material-presets/:id",
        async ({ params, body, set }) => {
          try {
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
              .where(
                and(
                  eq(materialPresets.id, params.id),
                  eq(materialPresets.isSystem, false),
                ),
              )
              .returning();

            if (!updatedPreset) {
              set.status = 404;
              return {
                error: "Material preset not found or is a system preset",
              };
            }

            return updatedPreset;
          } catch (error) {
            logger.error(
              { context: "Material Presets", err: error },
              `Error updating material preset: ${params.id}`,
            );
            set.status = 500;
            return { error: "Failed to update material preset" };
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
            metadata: t.Optional(t.Any()),
          }),
          detail: {
            tags: ["Material Presets"],
            summary: "Update material preset",
            description:
              "Update an existing user-defined material preset (system presets cannot be updated)",
          },
        },
      )

      // Delete material preset
      .delete(
        "/material-presets/:id",
        async ({ params, set, request, headers }) => {
          // Require authentication (any authenticated user can delete)
          const authResult = await requireAuth({ request, headers });
          if (authResult instanceof Response) {
            set.status = 401;
            return { error: "Unauthorized - authentication required" };
          }

          try {
            const [deletedPreset] = await db
              .delete(materialPresets)
              .where(
                and(
                  eq(materialPresets.id, params.id),
                  eq(materialPresets.isSystem, false),
                ),
              )
              .returning();

            if (!deletedPreset) {
              set.status = 404;
              return {
                error: "Material preset not found or is a system preset",
              };
            }

            return { success: true, id: params.id };
          } catch (error) {
            logger.error(
              { context: "Material Presets", err: error },
              `Error deleting material preset: ${params.id}`,
            );
            set.status = 500;
            return { error: "Failed to delete material preset" };
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
          },
        },
      )

      // List user's custom material presets
      .get(
        "/material-presets/user/:userId",
        async ({ params, set, request, headers }) => {
          // Require authentication (any authenticated user can delete)
          const authResult = await requireAuth({ request, headers });
          if (authResult instanceof Response) {
            set.status = 401;
            return { error: "Unauthorized - authentication required" };
          }

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
            set.status = 500;
            return { error: "Failed to load user material presets" };
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
          },
        },
      )

      // Get material presets grouped by category
      .get(
        "/material-presets/by-category",
        async ({ query, set }) => {
          try {
            const { userId, includeInactive = "false" } = query;

            const conditions = [];

            if (userId) {
              conditions.push(
                or(
                  eq(materialPresets.isSystem, true),
                  eq(materialPresets.isPublic, true),
                  eq(materialPresets.createdBy, userId),
                )!,
              );
            } else {
              conditions.push(
                or(
                  eq(materialPresets.isSystem, true),
                  eq(materialPresets.isPublic, true),
                )!,
              );
            }

            if (includeInactive !== "true") {
              conditions.push(eq(materialPresets.isActive, true));
            }

            const results = await db
              .select()
              .from(materialPresets)
              .where(and(...conditions))
              .orderBy(materialPresets.tier, materialPresets.name);

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
            set.status = 500;
            return { error: "Failed to load material presets by category" };
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
  );
};
