/**
 * Database Connection
 * PostgreSQL connection using Bun-optimized postgres library and Drizzle ORM
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { schema } from "./schema";

// Validate required environment variable
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

/**
 * Query performance monitoring thresholds (milliseconds)
 */
const SLOW_QUERY_THRESHOLD = 100; // Log warning for queries > 100ms
const VERY_SLOW_QUERY_THRESHOLD = 1000; // Log error for queries > 1000ms

/**
 * Custom logger for Drizzle query monitoring
 */
class QueryLogger {
  logQuery(query: string, params: unknown[]): void {
    const startTime = performance.now();

    // Log query execution (in production, you'd track this with Prometheus)
    // For now, we'll log to console in development
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[DB Query]",
        query.substring(0, 100) + (query.length > 100 ? "..." : ""),
      );
    }
  }
}

// Create postgres client (optimized for Bun)
// Using connection pool with sensible defaults
export const queryClient = postgres(process.env.DATABASE_URL, {
  max: 20, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Fail after 10 seconds if can't connect
  prepare: false, // Disable prepared statements for better compatibility

  // Query transformation hook for timing
  transform: {
    undefined: null, // Convert undefined to null in queries
  },

  // Debug mode in development
  debug:
    process.env.NODE_ENV !== "production"
      ? (connection, query, params, types) => {
          const startTime = performance.now();

          // Return a function that will be called after query execution
          return () => {
            const duration = performance.now() - startTime;

            // Extract table name from query
            const tableMatch =
              query.match(/from\s+"?(\w+)"?/i) ||
              query.match(/into\s+"?(\w+)"?/i) ||
              query.match(/update\s+"?(\w+)"?/i);
            const table = tableMatch ? tableMatch[1] : "unknown";

            // Determine operation type
            const operation = query.trim().split(" ")[0].toUpperCase();

            // Log slow queries
            if (duration > VERY_SLOW_QUERY_THRESHOLD) {
              console.error(
                `[DB VERY SLOW] ${operation} ${table} - ${duration.toFixed(2)}ms`,
                { query: query.substring(0, 200), params: params.slice(0, 5) },
              );
            } else if (duration > SLOW_QUERY_THRESHOLD) {
              console.warn(
                `[DB SLOW] ${operation} ${table} - ${duration.toFixed(2)}ms`,
                { query: query.substring(0, 200) },
              );
            } else if (process.env.LOG_ALL_QUERIES === "true") {
              console.log(
                `[DB] ${operation} ${table} - ${duration.toFixed(2)}ms`,
              );
            }
          };
        }
      : undefined,
});

// Create Drizzle instance with schema and logger
export const db = drizzle(queryClient, {
  schema,
  logger: process.env.NODE_ENV !== "production" ? new QueryLogger() : false,
});

// Test connection
queryClient`SELECT NOW()`
  .then((result) => {
    console.log("[Database] ✓ Connected to PostgreSQL at", result[0].now);
  })
  .catch((error) => {
    console.error("[Database] ✗ Connection failed:", error.message);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("[Database] Closing connection...");
  await queryClient.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("[Database] Closing connection...");
  await queryClient.end();
  process.exit(0);
});
