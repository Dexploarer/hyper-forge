/**
 * Environment Variable Validation
 *
 * Validates all environment variables using Zod schema.
 * This file should be imported at the very start of the application
 * to ensure all required environment variables are present and valid.
 */

import { z } from "zod";
import { logger } from "../utils/logger";

/**
 * Environment variable schema
 * Defines all environment variables used in the application
 */
const envSchema = z.object({
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
  // Authentication (Required for API server, optional for workers)
  // =========================================
  PRIVY_APP_ID: z.string().optional(),
  PRIVY_APP_SECRET: z.string().optional(),

  // =========================================
  // API Key Encryption (Required for API server, optional for workers)
  // =========================================
  API_KEY_ENCRYPTION_SECRET: z.string().optional(),

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
  QDRANT_URL: z
    .string()
    .optional()
    .transform((val) => {
      // Auto-add protocol if missing (common with Railway service URLs)
      if (!val || val === "") return val;
      const trimmed = val.trim();
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
      }
      // Railway service URLs should use https://
      // Railway internal URLs should use http://
      if (trimmed.includes(".railway.internal")) {
        return `http://${trimmed}`;
      }
      return `https://${trimmed}`;
    })
    .refine(
      (val) => {
        if (!val || val === "") return true;
        // Allow Railway internal hostnames and standard URLs
        try {
          const url = new URL(val);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      },
      {
        message:
          "Must be a valid URL with http:// or https:// protocol if provided",
      },
    ),
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
  CDN_URL: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().url().safeParse(val).success,
      { message: "Must be a valid URL if provided" },
    ),
  CDN_API_KEY: z.string().optional(),
  CDN_WS_URL: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        val === "" ||
        val.startsWith("ws://") ||
        val.startsWith("wss://"),
      {
        message: "Must be a valid WebSocket URL (ws:// or wss://) if provided",
      },
    ),
  AUTO_PUBLISH_TO_CDN: z
    .string()
    .optional()
    .default("true")
    .transform((val) => val === "true"),
  FRONTEND_URL: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().url().safeParse(val).success,
      { message: "Must be a valid URL if provided" },
    ),
  IMAGE_SERVER_URL: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().url().safeParse(val).success,
      { message: "Must be a valid URL if provided" },
    ),
  API_URL: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().url().safeParse(val).success,
      { message: "Must be a valid URL if provided" },
    ),

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
  // File System (Legacy Compatibility)
  // =========================================
  ASSETS_REPO_PATH: z.string().optional(),

  // =========================================
  // Railway Platform
  // =========================================
  RAILWAY_VOLUME_MOUNT_PATH: z.string().optional(),

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
  // Rate Limiting
  // =========================================
  ENABLE_RATE_LIMITING: z
    .string()
    .optional()
    .transform((val) => val === "true"),

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
  logger.error(
    {
      validation: "failed",
      errors: parsed.error.format(),
      help: "Check .env file and .env.example for required variables",
    },
    "Environment variable validation failed",
  );
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
