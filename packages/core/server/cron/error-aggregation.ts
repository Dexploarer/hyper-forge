/**
 * Error Aggregation Cron Job
 * Aggregates errors into hourly buckets for efficient dashboard queries
 *
 * Runs every hour to process the previous hour's errors
 */

import { db } from "../db/db";
import { apiErrors, errorAggregations } from "../db/schema/api-errors.schema";
import { sql, and, gte, lt } from "drizzle-orm";
import { logger } from "../utils/logger";

/**
 * Aggregate errors from the previous hour into statistics
 */
export async function aggregateErrors() {
  const now = new Date();
  const hourBucket = new Date(now);
  hourBucket.setMinutes(0, 0, 0);

  // Aggregate the previous hour (not the current one, to ensure complete data)
  const startTime = new Date(hourBucket.getTime() - 3600000); // -1 hour
  const endTime = hourBucket;

  logger.info(
    {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    },
    "Starting error aggregation for hourly bucket",
  );

  try {
    // Query errors grouped by endpoint, severity, and category
    const aggregatedData = await db
      .select({
        endpoint: apiErrors.endpoint,
        severity: apiErrors.severity,
        category: apiErrors.category,
        externalService: apiErrors.externalService,
        statusCode: apiErrors.statusCode,
        count: sql<number>`COUNT(*)::int`,
        uniqueUsers: sql<number>`COUNT(DISTINCT ${apiErrors.userId})::int`,
        firstOccurrence: sql<Date>`MIN(${apiErrors.createdAt})`,
        lastOccurrence: sql<Date>`MAX(${apiErrors.createdAt})`,
      })
      .from(apiErrors)
      .where(
        and(
          gte(apiErrors.createdAt, startTime),
          lt(apiErrors.createdAt, endTime),
        ),
      )
      .groupBy(
        apiErrors.endpoint,
        apiErrors.severity,
        apiErrors.category,
        apiErrors.externalService,
        apiErrors.statusCode,
      );

    // Insert or update aggregations
    let inserted = 0;
    let updated = 0;

    for (const agg of aggregatedData) {
      try {
        await db
          .insert(errorAggregations)
          .values({
            hourBucket: startTime,
            endpoint: agg.endpoint,
            severity: agg.severity,
            category: agg.category,
            externalService: agg.externalService,
            statusCode: agg.statusCode,
            totalErrors: agg.count,
            uniqueUsers: agg.uniqueUsers,
            firstOccurrence: agg.firstOccurrence,
            lastOccurrence: agg.lastOccurrence,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [
              errorAggregations.hourBucket,
              errorAggregations.endpoint,
              errorAggregations.severity,
              errorAggregations.category,
            ],
            set: {
              totalErrors: sql`${errorAggregations.totalErrors} + ${agg.count}`,
              uniqueUsers: agg.uniqueUsers,
              lastOccurrence: agg.lastOccurrence,
              updatedAt: now,
            },
          });

        inserted++;
      } catch (err) {
        logger.error(
          { err, aggregation: agg },
          "Failed to insert error aggregation",
        );
        updated++;
      }
    }

    logger.info(
      {
        hourBucket: startTime.toISOString(),
        totalAggregations: aggregatedData.length,
        inserted,
        updated,
      },
      "Error aggregation completed",
    );

    return {
      success: true,
      hourBucket: startTime,
      totalAggregations: aggregatedData.length,
      inserted,
      updated,
    };
  } catch (error) {
    logger.error({ err: error }, "Error aggregation failed");
    throw error;
  }
}

/**
 * Clean up old error records (data retention)
 * Keeps errors for 90 days, then deletes them
 */
export async function cleanupOldErrors() {
  const retentionDays = parseInt(process.env.ERROR_RETENTION_DAYS || "90", 10);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  logger.info(
    {
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
    },
    "Starting error cleanup",
  );

  try {
    const result = await db
      .delete(apiErrors)
      .where(lt(apiErrors.createdAt, cutoffDate));

    const deletedCount = (result as any).rowCount || 0;

    logger.info(
      {
        deletedCount,
        retentionDays,
      },
      "Error cleanup completed",
    );

    return {
      success: true,
      deletedCount,
      cutoffDate,
    };
  } catch (error) {
    logger.error({ err: error }, "Error cleanup failed");
    throw error;
  }
}

/**
 * Clean up old aggregations (keep for 1 year)
 */
export async function cleanupOldAggregations() {
  const retentionDays = 365;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  logger.info(
    {
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
    },
    "Starting aggregation cleanup",
  );

  try {
    const result = await db
      .delete(errorAggregations)
      .where(lt(errorAggregations.hourBucket, cutoffDate));

    const deletedCount = (result as any).rowCount || 0;

    logger.info(
      {
        deletedCount,
        retentionDays,
      },
      "Aggregation cleanup completed",
    );

    return {
      success: true,
      deletedCount,
      cutoffDate,
    };
  } catch (error) {
    logger.error({ err: error }, "Aggregation cleanup failed");
    throw error;
  }
}
