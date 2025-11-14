/**
 * API Error Repository
 * Handles database operations for error tracking and aggregation
 */

import { db } from "../db/db";
import {
  apiErrors,
  errorAggregations,
  type NewApiError,
  type ApiError,
  type NewErrorAggregation,
  type ErrorAggregation,
} from "../db/schema/api-errors.schema";
import { eq, and, gte, lt, desc, sql } from "drizzle-orm";
import { logger } from "../utils/logger";

export class ApiErrorRepository {
  /**
   * Log an error to the database
   */
  async logError(
    data: Omit<NewApiError, "id" | "createdAt">,
  ): Promise<ApiError> {
    try {
      const [error] = await db
        .insert(apiErrors)
        .values({
          ...data,
          createdAt: new Date(),
        })
        .returning();

      return error;
    } catch (err) {
      logger.error({ err, errorData: data }, "Failed to log error to database");
      throw err;
    }
  }

  /**
   * Get errors with pagination and filtering
   */
  async getErrors(filters: {
    userId?: string;
    endpoint?: string;
    severity?: string;
    category?: string;
    resolved?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiError[]> {
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(apiErrors.userId, filters.userId));
    }
    if (filters.endpoint) {
      conditions.push(eq(apiErrors.endpoint, filters.endpoint));
    }
    if (filters.severity) {
      conditions.push(eq(apiErrors.severity, filters.severity as any));
    }
    if (filters.category) {
      conditions.push(eq(apiErrors.category, filters.category as any));
    }
    if (filters.resolved !== undefined) {
      conditions.push(eq(apiErrors.resolved, filters.resolved));
    }

    const query = db
      .select()
      .from(apiErrors)
      .orderBy(desc(apiErrors.createdAt))
      .limit(filters.limit || 100)
      .offset(filters.offset || 0);

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }

    return query;
  }

  /**
   * Get error by ID
   */
  async getErrorById(id: string): Promise<ApiError | undefined> {
    const [error] = await db
      .select()
      .from(apiErrors)
      .where(eq(apiErrors.id, id))
      .limit(1);

    return error;
  }

  /**
   * Mark error as resolved
   */
  async resolveError(
    id: string,
    resolvedBy: string,
    resolution: string,
  ): Promise<ApiError | undefined> {
    const [error] = await db
      .update(apiErrors)
      .set({
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        resolution,
      })
      .where(eq(apiErrors.id, id))
      .returning();

    return error;
  }

  /**
   * Get error aggregations for time period
   */
  async getAggregations(filters: {
    startDate: Date;
    endDate: Date;
    endpoint?: string;
    severity?: string;
    category?: string;
  }): Promise<ErrorAggregation[]> {
    const conditions = [
      gte(errorAggregations.hourBucket, filters.startDate),
      lt(errorAggregations.hourBucket, filters.endDate),
    ];

    if (filters.endpoint) {
      conditions.push(eq(errorAggregations.endpoint, filters.endpoint));
    }
    if (filters.severity) {
      conditions.push(eq(errorAggregations.severity, filters.severity as any));
    }
    if (filters.category) {
      conditions.push(eq(errorAggregations.category, filters.category as any));
    }

    return db
      .select()
      .from(errorAggregations)
      .where(and(...conditions))
      .orderBy(desc(errorAggregations.hourBucket));
  }

  /**
   * Create or update error aggregation
   */
  async upsertAggregation(
    data: Omit<NewErrorAggregation, "id" | "updatedAt">,
  ): Promise<ErrorAggregation> {
    const [aggregation] = await db
      .insert(errorAggregations)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          errorAggregations.hourBucket,
          errorAggregations.endpoint,
          errorAggregations.severity,
          errorAggregations.category,
        ],
        set: {
          totalErrors: sql`${errorAggregations.totalErrors} + ${data.totalErrors}`,
          uniqueUsers: sql`${errorAggregations.uniqueUsers} + ${data.uniqueUsers}`,
          lastOccurrence: data.lastOccurrence,
          updatedAt: new Date(),
        },
      })
      .returning();

    return aggregation;
  }

  /**
   * Delete old errors (data retention)
   */
  async deleteOldErrors(olderThan: Date): Promise<number> {
    const result = await db
      .delete(apiErrors)
      .where(lt(apiErrors.createdAt, olderThan));

    return (result as any).rowCount || 0;
  }

  /**
   * Get error statistics
   */
  async getErrorStats(filters: { startDate: Date; endDate: Date }): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    topEndpoints: Array<{ endpoint: string; count: number }>;
  }> {
    const errors = await db
      .select()
      .from(apiErrors)
      .where(
        and(
          gte(apiErrors.createdAt, filters.startDate),
          lt(apiErrors.createdAt, filters.endDate),
        ),
      );

    const bySeverity: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const endpointCounts: Record<string, number> = {};

    for (const error of errors) {
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      endpointCounts[error.endpoint] =
        (endpointCounts[error.endpoint] || 0) + 1;
    }

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    return {
      total: errors.length,
      bySeverity,
      byCategory,
      topEndpoints,
    };
  }
}

// Export singleton instance
export const apiErrorRepository = new ApiErrorRepository();
