/**
 * API Error Repository
 * Database operations for error tracking and monitoring
 */

import { db } from "../db/db";
import { logger } from "../utils/logger";
import {
  apiErrors,
  errorAggregations,
  type ApiError,
  type NewApiError,
  type ErrorAggregation,
  type NewErrorAggregation,
} from "../db/schema/api-errors.schema";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import { BaseRepository } from "./BaseRepository";

export interface ErrorFilters {
  userId?: string;
  endpoint?: string;
  severity?: string;
  category?: string;
  resolved?: boolean;
  limit?: number;
  offset?: number;
}

export interface AggregationFilters {
  startDate: Date;
  endDate: Date;
  endpoint?: string;
  severity?: string;
  category?: string;
}

export interface ErrorStats {
  totalErrors: number;
  resolvedErrors: number;
  unresolvedErrors: number;
  errorsBySeverity: Record<string, number>;
  errorsByCategory: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
}

export class ApiErrorRepository extends BaseRepository<typeof apiErrors> {
  constructor() {
    super(apiErrors, "ApiErrorRepository");
  }

  /**
   * Log a new API error
   */
  async logError(data: NewApiError): Promise<ApiError> {
    return this.create(data);
  }

  /**
   * Get errors with filtering and pagination
   */
  async getErrors(filters: ErrorFilters): Promise<ApiError[]> {
    return this.executeQuery(async () => {
      const conditions: Record<string, any> = {};

      if (filters.userId) {
        conditions.userId = eq(apiErrors.userId, filters.userId);
      }

      if (filters.endpoint) {
        conditions.endpoint = eq(apiErrors.endpoint, filters.endpoint);
      }

      if (filters.severity) {
        conditions.severity = eq(apiErrors.severity, filters.severity as any);
      }

      if (filters.category) {
        conditions.category = eq(apiErrors.category, filters.category as any);
      }

      if (filters.resolved !== undefined) {
        conditions.resolved = eq(apiErrors.resolved, filters.resolved);
      }

      return this.findMany(conditions, {
        limit: filters.limit,
        offset: filters.offset,
      });
    }, "getErrors");
  }

  /**
   * Get a specific error by ID
   */
  async getErrorById(id: string): Promise<ApiError | null> {
    return this.findById(id);
  }

  /**
   * Mark an error as resolved
   */
  async resolveError(
    id: string,
    resolvedBy: string,
    resolution: string,
  ): Promise<ApiError | null> {
    try {
      const error = await this.update(id, {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        resolution,
      });

      if (error) {
        logger.info(
          { errorId: id, resolvedBy },
          "[ApiErrorRepository] Error resolved",
        );
      }

      return error;
    } catch (error) {
      logger.error(
        { err: error },
        "[ApiErrorRepository] Failed to resolve error:",
      );
      throw error;
    }
  }

  /**
   * Get error statistics for a time period
   */
  async getErrorStats(filters: AggregationFilters): Promise<ErrorStats> {
    return this.executeQuery(async () => {
      const whereConditions: any[] = [
        gte(apiErrors.createdAt, filters.startDate),
        lte(apiErrors.createdAt, filters.endDate),
      ];

      if (filters.endpoint) {
        whereConditions.push(eq(apiErrors.endpoint, filters.endpoint));
      }

      if (filters.severity) {
        whereConditions.push(eq(apiErrors.severity, filters.severity as any));
      }

      if (filters.category) {
        whereConditions.push(eq(apiErrors.category, filters.category as any));
      }

      // Get total errors
      const [totalResult] = await db
        .select({ count: count() })
        .from(apiErrors)
        .where(and(...whereConditions));

      const totalErrors = Number(totalResult.count);

      // Get resolved errors
      const [resolvedResult] = await db
        .select({ count: count() })
        .from(apiErrors)
        .where(and(...whereConditions, eq(apiErrors.resolved, true)));

      const resolvedErrors = Number(resolvedResult.count);

      // Get errors by severity
      const severityResults = await db
        .select({
          severity: apiErrors.severity,
          count: count(),
        })
        .from(apiErrors)
        .where(and(...whereConditions))
        .groupBy(apiErrors.severity);

      const errorsBySeverity: Record<string, number> = {};
      for (const row of severityResults) {
        errorsBySeverity[row.severity] = Number(row.count);
      }

      // Get errors by category
      const categoryResults = await db
        .select({
          category: apiErrors.category,
          count: count(),
        })
        .from(apiErrors)
        .where(and(...whereConditions))
        .groupBy(apiErrors.category);

      const errorsByCategory: Record<string, number> = {};
      for (const row of categoryResults) {
        errorsByCategory[row.category] = Number(row.count);
      }

      // Get errors by endpoint (top 10)
      const endpointResults = await db
        .select({
          endpoint: apiErrors.endpoint,
          count: count(),
        })
        .from(apiErrors)
        .where(and(...whereConditions))
        .groupBy(apiErrors.endpoint)
        .orderBy(desc(count()))
        .limit(10);

      const errorsByEndpoint: Record<string, number> = {};
      for (const row of endpointResults) {
        errorsByEndpoint[row.endpoint] = Number(row.count);
      }

      return {
        totalErrors,
        resolvedErrors,
        unresolvedErrors: totalErrors - resolvedErrors,
        errorsBySeverity,
        errorsByCategory,
        errorsByEndpoint,
      };
    }, "getErrorStats");
  }

  /**
   * Get hourly error aggregations for dashboards
   */
  async getAggregations(
    filters: AggregationFilters,
  ): Promise<ErrorAggregation[]> {
    return this.executeQuery(async () => {
      const whereConditions: any[] = [
        gte(errorAggregations.hourBucket, filters.startDate),
        lte(errorAggregations.hourBucket, filters.endDate),
      ];

      if (filters.endpoint) {
        whereConditions.push(eq(errorAggregations.endpoint, filters.endpoint));
      }

      if (filters.severity) {
        whereConditions.push(
          eq(errorAggregations.severity, filters.severity as any),
        );
      }

      if (filters.category) {
        whereConditions.push(
          eq(errorAggregations.category, filters.category as any),
        );
      }

      const aggregations = await db
        .select()
        .from(errorAggregations)
        .where(and(...whereConditions))
        .orderBy(desc(errorAggregations.hourBucket));

      return aggregations;
    }, "getAggregations");
  }

  /**
   * Upsert an error aggregation
   * Used by the cron job to update hourly stats
   */
  async upsertAggregation(data: NewErrorAggregation): Promise<void> {
    try {
      await db
        .insert(errorAggregations)
        .values(data)
        .onConflictDoUpdate({
          target: [
            errorAggregations.hourBucket,
            errorAggregations.endpoint,
            errorAggregations.severity,
            errorAggregations.category,
          ],
          set: {
            totalErrors: data.totalErrors,
            uniqueUsers: data.uniqueUsers,
            firstOccurrence: data.firstOccurrence,
            lastOccurrence: data.lastOccurrence,
            updatedAt: new Date(),
          },
        });

      logger.debug(
        { hourBucket: data.hourBucket },
        "[ApiErrorRepository] Aggregation upserted",
      );
    } catch (error) {
      logger.error(
        { err: error },
        "[ApiErrorRepository] Failed to upsert aggregation:",
      );
      throw error;
    }
  }

  /**
   * Delete old resolved errors for data retention
   */
  async deleteOldErrors(olderThan: Date): Promise<number> {
    try {
      const result = await db
        .delete(apiErrors)
        .where(
          and(
            eq(apiErrors.resolved, true),
            lte(apiErrors.resolvedAt, olderThan),
          ),
        )
        .returning({ id: apiErrors.id });

      const deletedCount = result.length;

      logger.info(
        { deletedCount, olderThan },
        "[ApiErrorRepository] Deleted old resolved errors",
      );

      return deletedCount;
    } catch (error) {
      logger.error(
        { err: error },
        "[ApiErrorRepository] Failed to delete old errors:",
      );
      throw error;
    }
  }
}

// Export singleton instance
export const apiErrorRepository = new ApiErrorRepository();
