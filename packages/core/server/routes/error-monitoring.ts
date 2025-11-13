/**
 * Error Monitoring Routes
 * Dashboard for viewing error statistics and trends
 */

import { Elysia, t } from "elysia";
import { apiErrorRepository } from "../repositories/ApiErrorRepository";
import { requireAuth } from "../middleware/auth";
import { ForbiddenError } from "../errors";

export const errorMonitoringRoutes = new Elysia({ prefix: "/api/errors" })
  /**
   * GET /api/errors
   * List recent errors with filtering
   */
  .get(
    "/",
    async ({ query, user }) => {
      // Only authenticated users can view errors
      if (!user) {
        throw new ForbiddenError("Authentication required");
      }

      // Only admins can view all errors
      if (!user.isAdmin) {
        // Regular users can only see their own errors
        query.userId = user.id;
      }

      const errors = await apiErrorRepository.getErrors({
        userId: query.userId,
        endpoint: query.endpoint,
        severity: query.severity,
        category: query.category,
        resolved:
          query.resolved === "true"
            ? true
            : query.resolved === "false"
              ? false
              : undefined,
        limit: parseInt(query.limit || "50", 10),
        offset: parseInt(query.offset || "0", 10),
      });

      return {
        success: true,
        errors,
        pagination: {
          limit: parseInt(query.limit || "50", 10),
          offset: parseInt(query.offset || "0", 10),
        },
      };
    },
    {
      query: t.Object({
        userId: t.Optional(t.String()),
        endpoint: t.Optional(t.String()),
        severity: t.Optional(t.String()),
        category: t.Optional(t.String()),
        resolved: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Error Monitoring"],
        summary: "List recent errors",
        description: "Get paginated list of errors with filtering",
      },
    },
  )

  /**
   * GET /api/errors/stats
   * Get error statistics for a time period
   */
  .get(
    "/stats",
    async ({ query, user }) => {
      if (!user) {
        throw new ForbiddenError("Authentication required");
      }

      if (!user.isAdmin) {
        throw new ForbiddenError("Admin access required");
      }

      const startDate = query.startDate
        ? new Date(query.startDate)
        : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
      const endDate = query.endDate ? new Date(query.endDate) : new Date();

      const stats = await apiErrorRepository.getErrorStats({
        startDate,
        endDate,
      });

      return {
        success: true,
        stats,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      };
    },
    {
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Error Monitoring"],
        summary: "Get error statistics",
        description: "Get aggregated error statistics for a time period",
      },
    },
  )

  /**
   * GET /api/errors/aggregations
   * Get hourly error aggregations
   */
  .get(
    "/aggregations",
    async ({ query, user }) => {
      if (!user) {
        throw new ForbiddenError("Authentication required");
      }

      if (!user.isAdmin) {
        throw new ForbiddenError("Admin access required");
      }

      const startDate = query.startDate
        ? new Date(query.startDate)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      const endDate = query.endDate ? new Date(query.endDate) : new Date();

      const aggregations = await apiErrorRepository.getAggregations({
        startDate,
        endDate,
        endpoint: query.endpoint,
        severity: query.severity,
        category: query.category,
      });

      return {
        success: true,
        aggregations,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      };
    },
    {
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        endpoint: t.Optional(t.String()),
        severity: t.Optional(t.String()),
        category: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Error Monitoring"],
        summary: "Get hourly error aggregations",
        description: "Get pre-computed hourly error statistics for dashboards",
      },
    },
  )

  /**
   * GET /api/errors/:id
   * Get a specific error by ID
   */
  .get(
    "/:id",
    async ({ params, user }) => {
      if (!user) {
        throw new ForbiddenError("Authentication required");
      }

      const error = await apiErrorRepository.getErrorById(params.id);

      if (!error) {
        return {
          success: false,
          error: "Error not found",
        };
      }

      // Regular users can only see their own errors
      if (!user.isAdmin && error.userId !== user.id) {
        throw new ForbiddenError("Access denied");
      }

      return {
        success: true,
        error,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Error Monitoring"],
        summary: "Get error by ID",
        description: "Get detailed information about a specific error",
      },
    },
  )

  /**
   * PATCH /api/errors/:id/resolve
   * Mark an error as resolved
   */
  .patch(
    "/:id/resolve",
    async ({ params, body, user }) => {
      if (!user) {
        throw new ForbiddenError("Authentication required");
      }

      if (!user.isAdmin) {
        throw new ForbiddenError("Admin access required");
      }

      const error = await apiErrorRepository.resolveError(
        params.id,
        user.id,
        body.resolution,
      );

      if (!error) {
        return {
          success: false,
          error: "Error not found",
        };
      }

      return {
        success: true,
        error,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        resolution: t.String(),
      }),
      detail: {
        tags: ["Error Monitoring"],
        summary: "Resolve an error",
        description: "Mark an error as resolved with a resolution note",
      },
    },
  );
