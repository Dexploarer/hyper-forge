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
    // API Key Encryption
    // =========================================
    API_KEY_ENCRYPTION_SECRET: z
      .string()
      .min(32, "API_KEY_ENCRYPTION_SECRET must be at least 32 characters"),

    // =========================================
    // AI Services (Optional - users can provide their own)
    // =========================================
    MESHY_API_KEY: z.string().optional(),

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
    // Webhook Configuration
    // =========================================
    /**
     * WEBHOOK CONFIGURATION FOR RAILWAY DEPLOYMENT
     *
     * The CDN service fires webhooks to the main app after successful uploads.
     * Both services must share the same WEBHOOK_SECRET for signature verification.
     *
     * Required Railway env vars:
     *
     * Main App (asset-forge):
     * - WEBHOOK_SECRET: Shared secret for webhook signature verification (32+ chars recommended)
     * - CDN_WEBHOOK_ENABLED: Set to "true" to enable webhook receiver endpoint
     * - WEBHOOK_SYSTEM_USER_ID: Optional, UUID of system user for auto-created assets
     *
     * CDN Service (asset-forge-cdn):
     * - ENABLE_WEBHOOK: Set to "true" to enable webhook firing
     * - ASSET_FORGE_API_URL: Main app URL (e.g., https://hyperforge-production.up.railway.app)
     * - WEBHOOK_SECRET: Same value as main app
     * - WEBHOOK_RETRY_ATTEMPTS: Optional, default 3
     * - WEBHOOK_RETRY_DELAY_MS: Optional, default 1000
     * - WEBHOOK_TIMEOUT_MS: Optional, default 5000
     */
    WEBHOOK_SECRET: z.string().optional(),
    CDN_WEBHOOK_ENABLED: z
      .string()
      .optional()
      .transform((val) => val === "true"),
    WEBHOOK_SYSTEM_USER_ID: z.string().uuid().optional(),

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
  });

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
