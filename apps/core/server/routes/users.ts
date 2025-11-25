/**
 * User Profile Routes
 * Manage user profiles and admin dashboard
 */

import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/auth.plugin";
import { userService } from "../services/UserService";
import { ActivityLogService } from "../services/ActivityLogService";
import { ApiKeyService } from "../services/ApiKeyService";
import type { AuthUser } from "../types/auth";
// Import drizzle-typebox schemas for Elysia validation
import { UserProfileUpdateSchema } from "../db/typebox-schemas";

export const usersRoutes = new Elysia({ prefix: "/api/users" })
  // Regular authenticated user routes
  .group("", (app) =>
    app
      .use(authPlugin)
      // Get current user profile (requires authentication)
      .get(
        "/me",
        async (context) => {
          const { user } = context as typeof context & { user: AuthUser };
          return { user };
        },
        {
          detail: {
            tags: ["Users"],
            summary: "Get current user profile",
            description:
              "Gets the current authenticated user profile. Requires Privy JWT.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Update/Complete user profile (requires authentication)
      .post(
        "/complete-profile",
        async (context) => {
          const { user, body, request } = context as typeof context & {
            user: AuthUser;
          };
          const { displayName, email, discordUsername } = body;

          // Update profile (only set profileCompleted if not already set)
          const markCompleted = !user.profileCompleted;

          // Build update object - only include discordUsername if provided
          const updateData: {
            displayName: string;
            email: string;
            discordUsername?: string;
          } = {
            displayName,
            email,
          };
          if (discordUsername !== undefined) {
            updateData.discordUsername = discordUsername;
          }

          const updatedUser = await userService.updateProfile(
            user.id,
            updateData,
            markCompleted,
          );

          // Log profile update
          const changes = Object.keys(updateData);
          if (markCompleted) changes.push("profileCompleted");
          await ActivityLogService.logProfileUpdated({
            userId: user.id,
            changes,
            request,
          });

          return { user: updatedUser };
        },
        {
          // Using drizzle-typebox schema for validation
          // Defined once in Drizzle, used for both DB and API validation
          body: UserProfileUpdateSchema,
          detail: {
            tags: ["Users"],
            summary: "Update user profile",
            description:
              "Save or update user profile information. Requires Privy JWT.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Update user settings (requires authentication)
      .post(
        "/settings",
        async (context) => {
          const { user, body } = context as typeof context & { user: AuthUser };
          const { settings } = body;

          const updatedUser = await userService.updateSettings(
            user.id,
            settings,
          );

          return { user: updatedUser };
        },
        {
          body: t.Object({
            // User settings is a key-value map with unknown structure
            settings: t.Record(t.String(), t.Unknown()),
          }),
          detail: {
            tags: ["Users"],
            summary: "Update user settings",
            description:
              "Update user preferences and settings. Settings are merged with existing values. Requires Privy JWT.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // API Key Management Routes (NON-BREAKING: New feature)
      // Generate new API key
      .post(
        "/api-keys",
        async (context) => {
          const { user, body } = context as typeof context & { user: AuthUser };
          const apiKeyService = new ApiKeyService();

          const { key, keyId } = await apiKeyService.generateApiKey(user.id, {
            name: body.name,
            permissions: body.permissions,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
          });

          return {
            success: true,
            key, // ONLY shown once!
            keyId,
            prefix: key.substring(0, 16),
            message: "Save this key securely. It will not be shown again.",
          };
        },
        {
          body: t.Object({
            name: t.String({
              minLength: 1,
              maxLength: 255,
              description: "Friendly name for the API key",
            }),
            permissions: t.Optional(
              t.Array(t.String(), {
                description: "Optional scoped permissions (future use)",
              }),
            ),
            expiresAt: t.Optional(
              t.String({
                format: "date-time",
                description: "Optional expiration date (ISO 8601)",
              }),
            ),
          }),
          detail: {
            tags: ["Users", "API Keys"],
            summary: "Generate new API key",
            description:
              "Generate a new API key for programmatic access. The key is only shown once - save it securely! Keys work alongside existing Privy JWT authentication.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // List API keys (without revealing actual keys)
      .get(
        "/api-keys",
        async (context) => {
          const { user } = context as typeof context & { user: AuthUser };
          const apiKeyService = new ApiKeyService();
          const keys = await apiKeyService.listApiKeys(user.id);

          return {
            success: true,
            keys,
          };
        },
        {
          detail: {
            tags: ["Users", "API Keys"],
            summary: "List API keys",
            description:
              "List all API keys for the current user. Only shows key prefixes, not full keys.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Get specific API key details
      .get(
        "/api-keys/:keyId",
        async (context) => {
          const { user, params } = context as typeof context & {
            user: AuthUser;
          };
          const apiKeyService = new ApiKeyService();
          const key = await apiKeyService.getApiKey(user.id, params.keyId);

          if (!key) {
            return {
              success: false,
              error: "API key not found",
            };
          }

          return {
            success: true,
            key,
          };
        },
        {
          params: t.Object({
            keyId: t.String({ format: "uuid" }),
          }),
          detail: {
            tags: ["Users", "API Keys"],
            summary: "Get API key details",
            description:
              "Get detailed information about a specific API key. Does not return the actual key.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Revoke API key (soft delete)
      .delete(
        "/api-keys/:keyId",
        async (context) => {
          const { user, params } = context as typeof context & {
            user: AuthUser;
          };
          const apiKeyService = new ApiKeyService();

          try {
            await apiKeyService.revokeApiKey(user.id, params.keyId);
            return {
              success: true,
              message: "API key revoked successfully",
            };
          } catch (error) {
            return {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to revoke API key",
            };
          }
        },
        {
          params: t.Object({
            keyId: t.String({ format: "uuid" }),
          }),
          detail: {
            tags: ["Users", "API Keys"],
            summary: "Revoke API key",
            description:
              "Revoke an API key. The key will immediately stop working. This action cannot be undone.",
            security: [{ BearerAuth: [] }],
          },
        },
      ),
  )

  // Admin-only routes
  .group("", (app) =>
    app.use(authPlugin).get(
      "/",
      async ({ query }) => {
        // Build filters from query params
        const filters: {
          role?: "admin" | "member";
          profileCompleted?: boolean;
          search?: string;
        } = {};

        if (query.role) {
          filters.role = query.role as "admin" | "member";
        }

        if (query.profileCompleted !== undefined) {
          filters.profileCompleted = query.profileCompleted === "true";
        }

        if (query.search) {
          filters.search = query.search;
        }

        const allUsers = await userService.getAllUsers(filters);

        return { users: allUsers };
      },
      {
        query: t.Object({
          role: t.Optional(t.Union([t.Literal("admin"), t.Literal("member")])),
          profileCompleted: t.Optional(t.String()),
          search: t.Optional(t.String()),
        }),
        detail: {
          tags: ["Users"],
          summary: "Get all users (Admin only)",
          description:
            "Get all users for admin dashboard with optional filtering by role, profile completion, and search (name/email/privyId). Requires admin role.",
          security: [{ BearerAuth: [] }],
        },
      },
    ),
  );
