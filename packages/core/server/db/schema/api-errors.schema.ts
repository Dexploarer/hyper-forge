/**
 * API Errors Schema
 * Track API errors for monitoring, alerting, and debugging
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema";

/**
 * Error severity enum
 */
export const errorSeverityEnum = pgEnum("error_severity", [
  "debug",
  "info",
  "warning",
  "error",
  "critical",
]);

/**
 * Error category enum
 */
export const errorCategoryEnum = pgEnum("error_category", [
  "validation",
  "authentication",
  "authorization",
  "external_api",
  "database",
  "file_system",
  "network",
  "application",
  "unknown",
]);

/**
 * API errors table
 * Comprehensive error tracking and monitoring
 */
export const apiErrors = pgTable(
  "api_errors",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Request context
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    requestId: varchar("request_id", { length: 255 }),
    endpoint: varchar("endpoint", { length: 512 }).notNull(),
    method: varchar("method", { length: 10 }).notNull(),

    // Error details
    errorCode: varchar("error_code", { length: 100 }),
    errorMessage: text("error_message").notNull(),
    errorStack: text("error_stack"),
    severity: errorSeverityEnum("severity").notNull().default("error"),
    category: errorCategoryEnum("category").notNull().default("unknown"),

    // HTTP details
    statusCode: integer("status_code"),
    requestBody: jsonb("request_body"),
    requestHeaders: jsonb("request_headers"),
    responseBody: jsonb("response_body"),

    // External service tracking
    externalService: varchar("external_service", { length: 100 }), // e.g., 'meshy', 'openai', 'privy'
    externalErrorCode: varchar("external_error_code", { length: 100 }),
    externalErrorMessage: text("external_error_message"),

    // Context and metadata
    context: jsonb("context").notNull().default({}),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),

    // Resolution tracking
    resolved: boolean("resolved").notNull().default(false),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: uuid("resolved_by").references(() => users.id, {
      onDelete: "set null",
    }),
    resolution: text("resolution"),

    // Client info
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 512 }),

    // Timestamp
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_errors_user").on(table.userId),
    endpointIdx: index("idx_errors_endpoint").on(table.endpoint),
    severityIdx: index("idx_errors_severity").on(table.severity),
    categoryIdx: index("idx_errors_category").on(table.category),
    externalServiceIdx: index("idx_errors_external_service").on(
      table.externalService,
    ),
    createdIdx: index("idx_errors_created").on(table.createdAt.desc()),
    resolvedIdx: index("idx_errors_resolved").on(table.resolved),
    statusCodeIdx: index("idx_errors_status_code").on(table.statusCode),
    requestIdIdx: index("idx_errors_request_id").on(table.requestId),
    severityCategoryIdx: index("idx_errors_severity_category").on(
      table.severity,
      table.category,
    ),
  }),
);

/**
 * Error aggregations table
 * Pre-computed error statistics for dashboards (denormalized)
 */
export const errorAggregations = pgTable(
  "error_aggregations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Time bucket (hourly aggregation)
    hourBucket: timestamp("hour_bucket", { withTimezone: true }).notNull(),

    // Grouping dimensions
    endpoint: varchar("endpoint", { length: 512 }),
    severity: errorSeverityEnum("severity"),
    category: errorCategoryEnum("category"),
    externalService: varchar("external_service", { length: 100 }),
    statusCode: integer("status_code"),

    // Counts
    totalErrors: integer("total_errors").notNull().default(0),
    uniqueUsers: integer("unique_users").notNull().default(0),

    // First and last occurrence
    firstOccurrence: timestamp("first_occurrence", { withTimezone: true }),
    lastOccurrence: timestamp("last_occurrence", { withTimezone: true }),

    // Auto-updated
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    hourBucketIdx: index("idx_error_agg_hour_bucket").on(
      table.hourBucket.desc(),
    ),
    endpointIdx: index("idx_error_agg_endpoint").on(table.endpoint),
    severityIdx: index("idx_error_agg_severity").on(table.severity),
    categoryIdx: index("idx_error_agg_category").on(table.category),
    externalServiceIdx: index("idx_error_agg_external_service").on(
      table.externalService,
    ),
    bucketEndpointIdx: index("idx_error_agg_bucket_endpoint").on(
      table.hourBucket,
      table.endpoint,
    ),
  }),
);

// Type exports
export type ApiError = typeof apiErrors.$inferSelect;
export type NewApiError = typeof apiErrors.$inferInsert;
export type ErrorAggregation = typeof errorAggregations.$inferSelect;
export type NewErrorAggregation = typeof errorAggregations.$inferInsert;
