/**
 * Environment Variable Validation
 *
 * Validates all environment variables using Zod schema.
 * This file should be imported at the very start of the application
 * to ensure all required environment variables are present and valid.
 */

import { z } from "zod";

/**
 * Environment variable schema
 * Defines all environment variables used in the application
 */
const envSchema = z
  .object({
    // =========================================
    // Node Environment
    // =========================================
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    // =========================================
    // Database
    // =========================================
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL"),

    // =========================================
    // Authentication
    // =========================================
    PRIVY_APP_ID: z.string().min(1, "PRIVY_APP_ID is required"),
    PRIVY_APP_SECRET: z.string().min(1, "PRIVY_APP_SECRET is required"),

    // =========================================
    // AI Services (Required)
    // =========================================
    MESHY_API_KEY: z.string().min(1, "MESHY_API_KEY is required"),

    // =========================================
    // AI Services (Optional - at least one required)
    // =========================================
    AI_GATEWAY_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),

    // =========================================
    // Optional AI Services
    // =========================================
    ELEVENLABS_API_KEY: z.string().optional(),

    // =========================================
    // Vector Database (Optional)
    // =========================================
    QDRANT_URL: z.string().url().optional().or(z.literal("")),
    QDRANT_API_KEY: z.string().optional(),

    // =========================================
    // Image Hosting (Optional)
    // =========================================
    IMGUR_CLIENT_ID: z.string().optional(),

    // =========================================
    // Server Configuration
    // =========================================
    PORT: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 3004))
      .pipe(z.number().int().positive()),
    API_PORT: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 3004))
      .pipe(z.number().int().positive()),

    // =========================================
    // URLs
    // =========================================
    CDN_URL: z.string().url().optional().or(z.literal("")),
    CDN_API_KEY: z.string().optional(),
    FRONTEND_URL: z.string().url().optional().or(z.literal("")),
    IMAGE_SERVER_URL: z.string().url().optional().or(z.literal("")),
    API_URL: z.string().url().optional().or(z.literal("")),

    // =========================================
    // File System
    // =========================================
    ASSETS_DIR: z.string().optional(),
    ASSETS_REPO_PATH: z.string().optional(),

    // =========================================
    // Railway Platform
    // =========================================
    RAILWAY_VOLUME_MOUNT_PATH: z.string().optional(),

    // =========================================
    // Redis Queue
    // =========================================
    REDIS_URL: z.string().url().optional().or(z.literal("")),

    // =========================================
    // Worker Configuration
    // =========================================
    WORKER_CONCURRENCY: z
      .string()
      .optional()
      .default("3")
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().positive()),
    MAX_JOB_RETRIES: z
      .string()
      .optional()
      .default("3")
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().positive()),
    QUEUE_POLL_TIMEOUT: z
      .string()
      .optional()
      .default("5")
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().positive()),
    WORKER_ID: z.string().optional(),

    // =========================================
    // Meshy Configuration
    // =========================================
    MESHY_MODEL_DEFAULT: z.string().optional(),
    MESHY_POLL_INTERVAL_MS: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10000))
      .pipe(z.number().int().positive()),
    MESHY_TIMEOUT_MS: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 300000))
      .pipe(z.number().int().positive()),

    // =========================================
    // Logging
    // =========================================
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace"])
      .optional(),

    // =========================================
    // CI/CD
    // =========================================
    CI: z
      .string()
      .optional()
      .transform((val) => val === "true"),
  })
  .refine(
    (data) => {
      // At least one of AI_GATEWAY_API_KEY or OPENAI_API_KEY must be provided
      return !!data.AI_GATEWAY_API_KEY || !!data.OPENAI_API_KEY;
    },
    {
      message:
        "At least one of AI_GATEWAY_API_KEY or OPENAI_API_KEY must be provided",
      path: ["AI_GATEWAY_API_KEY", "OPENAI_API_KEY"],
    },
  );

/**
 * Validate and parse environment variables
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Environment variable validation failed:");
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  console.error(
    "\n💡 Please check your .env file and ensure all required variables are set.",
  );
  console.error("📝 See .env.example for reference.");
  process.exit(1);
}

/**
 * Validated and typed environment variables
 * Safe to use throughout the application
 */
export const env = parsed.data;

/**
 * Type-safe access to environment variables
 */
export type Env = z.infer<typeof envSchema>;
